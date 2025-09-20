

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// Generate next quotation number in AE-Q-{ClientCode}-{RunningNo} format
async function generateQuotationNumber(clientId: string): Promise<string> {
  try {
    // Get client details to extract client code
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { 
        clientNumber: true,
        name: true
      }
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Extract client code from clientNumber (AE-C-001 -> C001) or generate from name
    let clientCode = 'C001'
    if (client.clientNumber) {
      const match = client.clientNumber.match(/AE-C-(\d+)/)
      if (match) {
        clientCode = `C${match[1]}`
      }
    } else {
      // If no client number, generate from first 3 chars of name + random digits
      const namePrefix = client.name.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase()
      const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0')
      clientCode = `${namePrefix}${randomNum}`
    }

    // Get the highest existing quotation number for this client
    const lastQuotation = await prisma.quotation.findFirst({
      where: {
        quotationNumber: {
          startsWith: `AE-Q-${clientCode}-`
        }
      },
      orderBy: {
        quotationNumber: 'desc'
      },
      select: {
        quotationNumber: true
      }
    })

    let nextNumber = 1

    if (lastQuotation?.quotationNumber) {
      // Extract the running number (AE-Q-C001-005 -> 005)
      const match = lastQuotation.quotationNumber.match(/AE-Q-\w+-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    // Format with leading zeros to 3 digits
    return `AE-Q-${clientCode}-${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating quotation number:', error)
    // Fallback to timestamp-based number if there's an error
    const timestamp = Date.now().toString().slice(-6)
    return `AE-Q-ERR-${timestamp}`
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return mock data until we implement full quotation CRUD
    const quotations = await prisma.quotation.findMany({
      include: {
        Client: {
          select: {
            name: true
          }
        },
        User_Quotation_salespersonIdToUser: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        User_Quotation_createdByIdToUser: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        User_Quotation_approvedByIdToUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedQuotations = quotations.map(quotation => ({
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      version: quotation.version,
      title: quotation.title,
      clientName: quotation.Client.name,
      clientId: quotation.clientId,
      subtotal: quotation.subtotal,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      status: quotation.status,
      validUntil: quotation.validUntil?.toISOString(),
      salesperson: quotation.User_Quotation_salespersonIdToUser 
        ? `${quotation.User_Quotation_salespersonIdToUser.firstName} ${quotation.User_Quotation_salespersonIdToUser.lastName}`
        : 'Unassigned',
      requiresApproval: quotation.requiresApproval,
      approvalValue: quotation.approvalValue,
      createdAt: quotation.createdAt.toISOString(),
      approvedAt: quotation.approvedAt?.toISOString(),
      isSuperseded: quotation.parentQuotationId !== null
    }))

    return NextResponse.json(formattedQuotations)

  } catch (error) {
    console.error('Error fetching quotations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    // Allow all authenticated users to create quotations since we have approval workflows
    const canCreateQuotation = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER", "FINANCE"].includes(userRole || "")
    
    if (!canCreateQuotation) {
      return NextResponse.json({ error: 'Insufficient permissions to create quotations' }, { status: 403 })
    }

    const data = await request.json()
    console.log('Received quotation data:', JSON.stringify(data, null, 2))

    // Enhanced validation with better error messages
    if (!data.clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }
    
    if (!data.title || data.title.trim() === '') {
      return NextResponse.json({ error: 'Quotation title is required' }, { status: 400 })
    }

    // Verify client exists
    const clientExists = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: { id: true }
    })

    if (!clientExists) {
      return NextResponse.json({ error: 'Selected client not found' }, { status: 400 })
    }

    // Generate the next quotation number
    const quotationNumber = await generateQuotationNumber(data.clientId)

    // Ensure line items are properly formatted
    const lineItems = Array.isArray(data.lineItems) ? data.lineItems : []
    
    // Create quotation with line items in a transaction
    const quotation = await prisma.$transaction(async (tx) => {
      // Create the quotation first with safer defaults
      const newQuotation = await tx.quotation.create({
        data: {
          id: uuidv4(),
          quotationNumber,
          version: 1,
          title: data.title.trim(),
          description: data.description || '',
          clientReference: data.clientReference || '',
          clientId: data.clientId,
          projectId: data.projectId || null,
          tenderId: data.tenderId && data.tenderId !== "no-tender" ? data.tenderId : null,
          salespersonId: data.salespersonId || session.user?.id || '',
          subtotal: Number(data.subtotal) || 0,
          taxAmount: Number(data.taxAmount) || 0,
          discountAmount: Number(data.discountAmount) || 0,
          totalAmount: Number(data.totalAmount) || 0,
          currency: data.currency || 'SGD',
          status: data.status || 'DRAFT',
          validUntil: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          terms: data.terms || '',
          notes: data.notes || '',
          templateType: data.templateType || 'standard',
          requiresApproval: Number(data.totalAmount) > 100, // $100 threshold for approval
          approvalValue: Number(data.totalAmount) || 0,
          createdById: session.user?.id || '',
          updatedAt: new Date()
        }
      })

      // Create line items if provided
      if (lineItems.length > 0) {
        const itemPromises = lineItems.map((item: any, index: number) => {
          // Ensure all required fields have safe defaults
          return tx.quotationItem.create({
            data: {
              id: uuidv4(),
              quotationId: newQuotation.id,
              description: item.description || '',
              category: item.type === 'subtitle' ? 'SUBTITLE' : (item.category || 'MATERIALS'),
              quantity: item.type === 'subtitle' ? 0 : (parseFloat(String(item.quantity)) || 1),
              unitPrice: item.type === 'subtitle' ? 0 : (parseFloat(String(item.unitPrice)) || 0),
              discount: null, // No longer used at item level
              taxRate: null, // No longer used at item level
              subtotal: parseFloat(String(item.subtotal)) || 0,
              discountAmount: null, // No longer used at item level
              taxAmount: null, // No longer used at item level
              totalPrice: parseFloat(String(item.totalPrice)) || 0,
              unit: item.type === 'subtitle' ? '' : (item.unit || 'pcs'),
              notes: item.notes || '',
              order: index + 1
            }
          })
        })
        
        await Promise.all(itemPromises)
        
        // Store items in library for future use
        await Promise.all(
          lineItems
            .filter((item: any) => item.type !== 'subtitle' && item.description && item.unitPrice > 0)
            .map(async (item: any) => {
              try {
                await tx.quotationItemLibrary.upsert({
                  where: {
                    description_category_unit: {
                      description: item.description,
                      category: item.category || 'MATERIALS',
                      unit: item.unit || 'pcs'
                    }
                  },
                  update: {
                    lastUnitPrice: Number(item.unitPrice),
                    usageCount: {
                      increment: 1
                    },
                    lastUsedAt: new Date(),
                    updatedAt: new Date()
                  },
                  create: {
                    id: uuidv4(),
                    description: item.description,
                    category: item.category || 'MATERIALS',
                    unit: item.unit || 'pcs',
                    averageUnitPrice: Number(item.unitPrice),
                    lastUnitPrice: Number(item.unitPrice),
                    usageCount: 1,
                    createdById: session.user?.id || '',
                    lastUsedAt: new Date(),
                    updatedAt: new Date()
                  }
                })
              } catch (libError) {
                console.error('Error updating item library:', libError)
                // Don't fail the quotation creation if library update fails
              }
            })
        )
      }

      // Create activity log
      await tx.quotationActivity.create({
        data: {
          id: uuidv4(),
          quotationId: newQuotation.id,
          action: 'CREATED',
          description: `Quotation ${quotationNumber} created by ${session.user?.firstName} ${session.user?.lastName}`,
          oldValue: null,
          newValue: 'DRAFT',
          userId: session.user?.id || '',
          userEmail: session.user?.email || ''
        }
      })

      // Return quotation with all related data
      return await tx.quotation.findUnique({
        where: { id: newQuotation.id },
        include: {
          Client: {
            select: {
              id: true,
              name: true,
              clientNumber: true,
              email: true,
              phone: true,
              clientType: true
            }
          },
          Tender: {
            select: {
              id: true,
              tenderNumber: true,
              title: true
            }
          },
          User_Quotation_salespersonIdToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          QuotationItem: {
            orderBy: {
              order: 'asc'
            }
          },
          QuotationApproval: {
            include: {
              User: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      })
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 })
    }

    return NextResponse.json({
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      version: quotation.version,
      title: quotation.title,
      clientName: quotation.Client?.name || 'Unknown Client',
      status: quotation.status,
      totalAmount: quotation.totalAmount,
      createdAt: quotation.createdAt.toISOString()
    })

  } catch (error) {
    console.error('Error creating quotation:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

