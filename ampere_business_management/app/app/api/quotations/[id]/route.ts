
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quotation = await prisma.quotation.findUnique({
      where: { 
        id: params.id 
      },
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
        User_Quotation_createdByIdToUser: {
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        QuotationActivity: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Error fetching quotation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const userId = session.user?.id
    
    const data = await request.json()

    // Check if quotation exists and user can edit it
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: params.id }
    })

    if (!existingQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    // Determine what the user can do
    const canEditByRole = ["SUPERADMIN", "PROJECT_MANAGER"].includes(userRole || "")
    const isQuotationCreator = existingQuotation.createdById === userId
    const isQuotationSalesperson = existingQuotation.salespersonId === userId
    
    // Check permissions based on what's being updated
    const isStatusOnlyUpdate = Object.keys(data).length === 1 && 'status' in data
    
    if (isStatusOnlyUpdate) {
      // For status updates, allow creators/salespersons for workflow transitions
      const canUpdateStatus = canEditByRole || isQuotationCreator || isQuotationSalesperson
      if (!canUpdateStatus) {
        return NextResponse.json({ 
          error: 'Insufficient permissions. You must be an admin, project manager, or the quotation creator/salesperson.' 
        }, { status: 403 })
      }
    } else {
      // For full updates, only admins or for DRAFT quotations
      const canEdit = canEditByRole && existingQuotation.status === 'DRAFT'
      if (!canEdit) {
        return NextResponse.json({ 
          error: 'Can only edit draft quotations and you must have admin permissions' 
        }, { status: 403 })
      }
    }

    const updatedQuotation = await prisma.$transaction(async (tx) => {
      // Prepare update data - only include provided fields
      const updateData: any = {
        updatedAt: new Date()
      }
      
      // Add fields that are provided in the request
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.clientReference !== undefined) updateData.clientReference = data.clientReference
      if (data.status !== undefined) updateData.status = data.status
      if (data.validUntil !== undefined) updateData.validUntil = new Date(data.validUntil)
      if (data.terms !== undefined) updateData.terms = data.terms
      if (data.notes !== undefined) updateData.notes = data.notes
      if (data.subtotal !== undefined) updateData.subtotal = data.subtotal
      if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount
      if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount
      if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.discountPercentage !== undefined) updateData.discountPercentage = data.discountPercentage
      if (data.taxPercentage !== undefined) updateData.taxPercentage = data.taxPercentage

      // Update quotation
      const quotation = await tx.quotation.update({
        where: { id: params.id },
        data: updateData
      })

      // Handle line items update if provided
      if (data.lineItems) {
        // Delete existing line items
        await tx.quotationItem.deleteMany({
          where: { quotationId: params.id }
        })

        // Create new line items
        if (data.lineItems.length > 0) {
          await tx.quotationItem.createMany({
            data: data.lineItems.map((item: any, index: number) => ({
              quotationId: params.id,
              type: item.type || 'item',
              description: item.description,
              category: item.category,
              quantity: item.quantity || 0,
              unit: item.unit || 'pcs',
              unitPrice: item.unitPrice || 0,
              subtotal: item.subtotal || 0,
              totalPrice: item.totalPrice || 0,
              notes: item.notes || '',
              order: item.order || index + 1
            }))
          })
        }
      }

      // Determine activity description and action
      let action = 'UPDATED'
      let description = 'Quotation updated'
      
      if (isStatusOnlyUpdate) {
        action = 'STATUS_CHANGED'
        let context = ''
        if (isQuotationCreator && isQuotationSalesperson) {
          context = ' (by creator and salesperson)'
        } else if (isQuotationCreator) {
          context = ' (by creator)'
        } else if (isQuotationSalesperson) {
          context = ' (by salesperson)'
        } else {
          context = ` (by ${userRole})`
        }
        description = `Status changed from ${existingQuotation.status} to ${data.status}${context}`
      }

      // Log activity
      await tx.quotationActivity.create({
        data: {
          id: uuidv4(),
          quotationId: params.id,
          action: action,
          description: `${description} by ${session.user?.firstName} ${session.user?.lastName}`,
          oldValue: isStatusOnlyUpdate ? existingQuotation.status : null,
          newValue: isStatusOnlyUpdate ? data.status : null,
          userId: session.user?.id || '',
          userEmail: session.user?.email || ''
        }
      })

      return quotation
    })

    return NextResponse.json(updatedQuotation)
  } catch (error) {
    console.error('Error updating quotation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const canDelete = ["SUPERADMIN", "PROJECT_MANAGER"].includes(userRole || "")
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: params.id }
    })

    if (!existingQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    // Only allow deleting DRAFT quotations
    if (existingQuotation.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Can only delete draft quotations' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.quotationActivity.deleteMany({
        where: { quotationId: params.id }
      })
      
      await tx.quotationApproval.deleteMany({
        where: { quotationId: params.id }
      })
      
      await tx.quotationItem.deleteMany({
        where: { quotationId: params.id }
      })

      // Delete quotation
      await tx.quotation.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ message: 'Quotation deleted successfully' })
  } catch (error) {
    console.error('Error deleting quotation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
