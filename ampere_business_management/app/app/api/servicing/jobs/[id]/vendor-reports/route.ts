
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/servicing/jobs/[id]/vendor-reports - Upload vendor report
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
    const userId = session.user?.id

    // Get the job to check if it's assigned to a vendor
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
        },
        assignedVendor: {
          select: {
            id: true,
            name: true,
            vendorNumber: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Service job not found' }, { status: 404 })
    }

    // Check permissions - only assigned vendor or admins can upload
    const canUpload = (
      ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER"].includes(userRole || "") ||
      (job.assignedToType === 'Vendor' && job.assignedToId === userId)
    )

    if (!canUpload) {
      return NextResponse.json({ error: 'Insufficient permissions to upload vendor reports' }, { status: 403 })
    }

    const data = await request.json()
    
    if (!data.vendorId || !data.fileName) {
      return NextResponse.json({ error: 'Missing required fields: vendorId, fileName' }, { status: 400 })
    }

    // Generate file path following NAS structure
    const clientCode = job.client.clientNumber || job.client.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const projectCode = job.project?.projectNumber || 'NO_PROJECT'
    const vendorCode = job.assignedVendor?.vendorNumber || job.assignedVendor?.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const filePath = `/NAS/Ampere/Clients/${clientCode}/Projects/${projectCode}/Servicing/Jobs/${job.id}/VendorReports/${vendorCode}_${job.id}_${data.fileName}`

    const vendorReport = await prisma.vendorReport.create({
      data: {
        jobId: params.id,
        vendorId: data.vendorId,
        filePath
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json(vendorReport, { status: 201 })

  } catch (error) {
    console.error('Error uploading vendor report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/servicing/jobs/[id]/vendor-reports - List vendor reports for a job
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
    const userId = session.user?.id

    // Get the job to check permissions
    const job = await prisma.serviceJob.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        assignedToType: true,
        assignedToId: true
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Service job not found' }, { status: 404 })
    }

    // Check permissions
    const canView = (
      ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER", "FINANCE"].includes(userRole || "") ||
      (job.assignedToType === 'Staff' && job.assignedToId === userId) ||
      (job.assignedToType === 'Vendor' && job.assignedToId === userId)
    )

    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const vendorReports = await prisma.vendorReport.findMany({
      where: { jobId: params.id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            contactPerson: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json(vendorReports)

  } catch (error) {
    console.error('Error fetching vendor reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
