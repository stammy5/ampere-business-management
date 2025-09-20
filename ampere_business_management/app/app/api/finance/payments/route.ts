
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.user?.role
    const canAccessFinance = ["SUPERADMIN", "FINANCE"].includes(userRole || "")
    
    if (!canAccessFinance) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const payments = await prisma.payment.findMany({
      include: {
        User_Payment_createdByIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        User_Payment_processedByIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        ClientInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            Client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        VendorInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            Vendor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate.toISOString(),
      reference: payment.reference,
      notes: payment.notes,
      status: payment.status,
      createdBy: {
        id: payment.User_Payment_createdByIdToUser.id,
        name: `${payment.User_Payment_createdByIdToUser.firstName} ${payment.User_Payment_createdByIdToUser.lastName}`,
        email: payment.User_Payment_createdByIdToUser.email
      },
      processedBy: payment.User_Payment_processedByIdToUser ? {
        id: payment.User_Payment_processedByIdToUser.id,
        name: `${payment.User_Payment_processedByIdToUser.firstName} ${payment.User_Payment_processedByIdToUser.lastName}`,
        email: payment.User_Payment_processedByIdToUser.email
      } : null,
      clientInvoice: payment.ClientInvoice,
      vendorInvoice: payment.VendorInvoice,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedPayments)

  } catch (error) {
    console.error('Error fetching payments:', error)
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

    const userRole = session?.user?.role
    const canCreatePayment = ["SUPERADMIN", "FINANCE", "PROJECT_MANAGER"].includes(userRole || "")
    
    if (!canCreatePayment) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = await request.json()
    console.log('Received payment creation request:', data)

    // Generate payment number
    const currentYear = new Date().getFullYear()
    const yearPrefix = currentYear.toString()
    
    // Find the last payment number for this year
    const lastPayment = await prisma.payment.findFirst({
      where: {
        paymentNumber: {
          contains: yearPrefix
        }
      },
      orderBy: {
        paymentNumber: 'desc'
      }
    })

    let nextNumber = 1
    if (lastPayment) {
      // Extract number from payment format (e.g., PAY-001-20240915)
      const match = lastPayment.paymentNumber.match(/PAY-(\d+)-/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const paymentNumber = `PAY-${nextNumber.toString().padStart(3, '0')}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`

    // Determine the invoice to link to based on payment type
    let clientInvoiceId = null
    let vendorInvoiceId = null

    if (data.type === 'CLIENT_PAYMENT') {
      // Link to client invoice if specified
      clientInvoiceId = data.invoiceId || null
    } else if (data.type === 'VENDOR_PAYMENT') {
      // Link to vendor invoice if specified  
      vendorInvoiceId = data.invoiceId || null
    }

    const payment = await prisma.payment.create({
      data: {
        id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        paymentNumber,
        clientInvoiceId,
        vendorInvoiceId,
        amount: parseFloat(data.amount) || 0,
        currency: data.currency || 'SGD',
        paymentMethod: data.method || 'BANK_TRANSFER',
        paymentDate: new Date(data.paymentDate),
        reference: data.reference,
        notes: data.notes,
        status: data.isDraft ? 'PENDING' : 'PROCESSING',
        createdById: session.user?.id || '',
        processedById: data.isDraft ? null : session.user?.id,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      status: payment.status,
      amount: Number(payment.amount),
      createdAt: payment.createdAt.toISOString()
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
