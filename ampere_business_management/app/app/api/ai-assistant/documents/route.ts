
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
    const canUseAI = ["SUPERADMIN", "FINANCE", "PROJECT_MANAGER"].includes(userRole || "")
    
    if (!canUseAI) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get documents uploaded through AI assistant
    const documents = await prisma.document.findMany({
      where: {
        uploadedById: session.user?.id,
        isActive: true
      },
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        },
        Vendor: {
          select: {
            id: true,
            name: true
          }
        },
        Tender: {
          select: {
            id: true,
            title: true,
            tenderNumber: true
          }
        },
        Quotation: {
          select: {
            id: true,
            title: true,
            quotationNumber: true
          }
        },
        ClientInvoice: {
          select: {
            id: true,
            invoiceNumber: true
          }
        },
        VendorInvoice: {
          select: {
            id: true,
            invoiceNumber: true
          }
        },
        PurchaseOrder: {
          select: {
            id: true,
            poNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform documents for frontend
    const processedDocuments = documents.map(doc => {
      let assignedTo = null
      
      if (doc.Project) {
        assignedTo = {
          type: 'project',
          id: doc.Project.id,
          name: doc.Project.name
        }
      } else if (doc.Vendor) {
        assignedTo = {
          type: 'vendor',
          id: doc.Vendor.id,
          name: doc.Vendor.name
        }
      } else if (doc.Tender) {
        assignedTo = {
          type: 'tender',
          id: doc.Tender.id,
          name: doc.Tender.title
        }
      } else if (doc.Quotation) {
        assignedTo = {
          type: 'quotation',
          id: doc.Quotation.id,
          name: doc.Quotation.title
        }
      } else if (doc.ClientInvoice) {
        assignedTo = {
          type: 'invoice',
          id: doc.ClientInvoice.id,
          name: `Invoice ${doc.ClientInvoice.invoiceNumber}`
        }
      } else if (doc.VendorInvoice) {
        assignedTo = {
          type: 'invoice',
          id: doc.VendorInvoice.id,
          name: `Vendor Invoice ${doc.VendorInvoice.invoiceNumber}`
        }
      } else if (doc.PurchaseOrder) {
        assignedTo = {
          type: 'purchase_order',
          id: doc.PurchaseOrder.id,
          name: `PO ${doc.PurchaseOrder.poNumber}`
        }
      }

      return {
        id: doc.id,
        filename: doc.filename,
        fileType: doc.mimetype,
        fileSize: doc.size,
        cloudStoragePath: doc.cloudStoragePath,
        assignedTo: assignedTo,
        uploadedAt: doc.createdAt.toISOString(),
        status: 'completed' // For now, assume all documents are processed
      }
    })

    return NextResponse.json(processedDocuments)

  } catch (error) {
    console.error('Documents fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}
