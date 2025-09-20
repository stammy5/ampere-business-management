
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

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        Vendor: {
          select: {
            id: true,
            name: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        },
        User_PurchaseOrder_requesterIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        User_PurchaseOrder_approvedByIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        PurchaseOrderItem: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedPOs = purchaseOrders.map(po => {
      const now = new Date()
      const deliveryDate = po.deliveryDate
      const isOverdue = deliveryDate && po.status !== 'COMPLETED' && po.status !== 'CANCELLED' && 
                       now > deliveryDate
      const daysPastDue = isOverdue && deliveryDate ? 
        Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

      return {
        id: po.id,
        poNumber: po.poNumber,
        vendor: {
          id: po.Vendor.id,
          name: po.Vendor.name,
          companyName: po.Vendor.name
        },
        project: po.Project ? {
          id: po.Project.id,
          name: po.Project.name,
          projectNumber: po.Project.projectNumber
        } : null,
        requester: {
          id: po.User_PurchaseOrder_requesterIdToUser.id,
          firstName: po.User_PurchaseOrder_requesterIdToUser.firstName,
          lastName: po.User_PurchaseOrder_requesterIdToUser.lastName
        },
        subtotal: Number(po.subtotal),
        taxAmount: Number(po.taxAmount) || 0,
        totalAmount: Number(po.totalAmount),
        currency: po.currency,
        status: po.status,
        issueDate: po.issueDate?.toISOString() || null,
        deliveryDate: po.deliveryDate?.toISOString() || null,
        terms: po.terms,
        notes: po.notes,
        approvedBy: po.User_PurchaseOrder_approvedByIdToUser ? {
          id: po.User_PurchaseOrder_approvedByIdToUser.id,
          firstName: po.User_PurchaseOrder_approvedByIdToUser.firstName,
          lastName: po.User_PurchaseOrder_approvedByIdToUser.lastName
        } : null,
        approvedAt: po.approvedAt?.toISOString() || null,
        createdAt: po.createdAt.toISOString(),
        updatedAt: po.updatedAt.toISOString(),
        itemsCount: po.PurchaseOrderItem.length,
        isOverdue: Boolean(isOverdue),
        daysPastDue: daysPastDue > 0 ? daysPastDue : undefined
      }
    })

    return NextResponse.json(formattedPOs)

  } catch (error) {
    console.error('Error fetching purchase orders:', error)
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
    const canCreatePO = ["SUPERADMIN", "PROJECT_MANAGER"].includes(userRole || "")
    
    if (!canCreatePO) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = await request.json()
    console.log('Received PO creation request:', data)

    // Generate PO number
    const currentYear = new Date().getFullYear()
    const yearPrefix = currentYear.toString()
    
    // Find the last PO number for this year
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: {
        poNumber: {
          contains: yearPrefix
        }
      },
      orderBy: {
        poNumber: 'desc'
      }
    })

    let nextNumber = 1
    if (lastPO) {
      // Extract number from PO format (e.g., PO-001-VEN-20240315)
      const match = lastPO.poNumber.match(/PO-(\d+)-/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const poNumber = `PO-${nextNumber.toString().padStart(3, '0')}-${data.vendorCode || 'GEN'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Create the purchase order
      const po = await tx.purchaseOrder.create({
        data: {
          id: `po_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          poNumber,
          vendorId: data.vendorId,
          projectId: data.projectId,
          requesterId: session.user?.id,
          subtotal: data.subtotal || 0,
          taxAmount: data.taxAmount || 0,
          totalAmount: data.totalAmount || 0,
          currency: data.currency || 'SGD',
          status: data.status || 'DRAFT',
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
          terms: data.terms,
          notes: data.notes,
          createdById: session.user?.id,
          updatedAt: new Date()
        }
      })

      // Create purchase order items if provided
      if (data.items && data.items.length > 0) {
        await tx.purchaseOrderItem.createMany({
          data: data.items.map((item: any, index: number) => ({
            id: `${po.id}_item_${index + 1}`,
            purchaseOrderId: po.id,
            description: item.description,
            category: item.category || 'MATERIALS',
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            discount: item.discount || 0,
            taxRate: item.taxRate || 0,
            subtotal: item.subtotal || 0,
            discountAmount: item.discountAmount || 0,
            taxAmount: item.taxAmount || 0,
            totalPrice: item.totalPrice || 0,
            unit: item.unit || 'pcs',
            notes: item.notes || '',
            order: item.order || index + 1
          }))
        })
      }

      // Log activity
      await tx.purchaseOrderActivity.create({
        data: {
          id: `${po.id}_activity_created`,
          purchaseOrderId: po.id,
          action: 'CREATED',
          description: `Purchase Order created by ${session.user?.firstName} ${session.user?.lastName}`,
          userId: session.user?.id || '',
          userEmail: session.user?.email || ''
        }
      })

      return po
    })

    return NextResponse.json({
      id: purchaseOrder.id,
      poNumber: purchaseOrder.poNumber,
      status: purchaseOrder.status,
      totalAmount: Number(purchaseOrder.totalAmount),
      createdAt: purchaseOrder.createdAt.toISOString()
    })

  } catch (error) {
    console.error('Error creating purchase order:', error)
    
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
