
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/servicing/jobs/[id]/invoices - Create draft invoice (client/vendor)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const canCreate = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER", "FINANCE"].includes(userRole || "")
    
    if (!canCreate) {
      return NextResponse.json({ error: 'Insufficient permissions to create invoices' }, { status: 403 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.invoiceType || !data.amount) {
      return NextResponse.json({ error: 'Missing required fields: invoiceType, amount' }, { status: 400 })
    }

    if (!['Client', 'Vendor'].includes(data.invoiceType)) {
      return NextResponse.json({ error: 'Invalid invoice type. Must be Client or Vendor' }, { status: 400 })
    }

    // Get the job to validate it exists
    const job = await prisma.serviceJob.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            clientNumber: true,
            name: true
          }
        },
        project: {
          select: {
            projectNumber: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Service job not found' }, { status: 404 })
    }

    // Generate invoice number
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const invoicePrefix = data.invoiceType === 'Client' ? 'SVC-INV-C' : 'SVC-INV-V'
    
    const existingInvoices = await prisma.serviceInvoice.count({
      where: {
        invoiceNo: {
          startsWith: `${invoicePrefix}-${year}-${month}-`
        }
      }
    })
    
    const invoiceNo = `${invoicePrefix}-${year}-${month}-${String(existingInvoices + 1).padStart(3, '0')}`

    // Generate file path following NAS structure
    const clientCode = job.client.clientNumber || job.client.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const projectCode = job.project?.projectNumber || 'NO_PROJECT'
    const filePath = `/NAS/Ampere/Clients/${clientCode}/Projects/${projectCode}/Servicing/Invoices/${invoiceNo}.pdf`

    const invoice = await prisma.serviceInvoice.create({
      data: {
        jobId: params.id,
        invoiceNo,
        invoiceType: data.invoiceType,
        amount: parseFloat(data.amount),
        status: data.status || 'Draft',
        xeroId: data.xeroId || null,
        filePath
      }
    })

    return NextResponse.json(invoice, { status: 201 })

  } catch (error) {
    console.error('Error creating service invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/servicing/jobs/[id]/invoices - List invoices for a job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const canView = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER", "FINANCE"].includes(userRole || "")
    
    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions to view invoices' }, { status: 403 })
    }

    // Verify job exists
    const jobExists = await prisma.serviceJob.findUnique({
      where: { id: params.id },
      select: { id: true }
    })

    if (!jobExists) {
      return NextResponse.json({ error: 'Service job not found' }, { status: 404 })
    }

    const invoices = await prisma.serviceInvoice.findMany({
      where: { jobId: params.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invoices)

  } catch (error) {
    console.error('Error fetching service invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
