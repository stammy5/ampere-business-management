
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/servicing/jobs/[id]/jobsheet - Generate job sheet PDF
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

    // Get the job with all necessary details
    const job = await prisma.serviceJob.findUnique({
      where: { id: params.id },
      include: {
        contract: true,
        client: true,
        project: true,
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignedVendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Service job not found' }, { status: 404 })
    }

    // Check permissions
    const canGenerate = (
      ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER"].includes(userRole || "") ||
      (job.assignedToType === 'Staff' && job.assignedToId === userId) ||
      (job.assignedToType === 'Vendor' && job.assignedToId === userId)
    )

    if (!canGenerate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Generate file path following NAS structure
    const clientCode = job.client.clientNumber || job.client.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const projectCode = job.project?.projectNumber || 'NO_PROJECT'
    const filePath = `/NAS/Ampere/Clients/${clientCode}/Projects/${projectCode}/Servicing/Jobs/${job.id}/JobSheet_${job.id}.pdf`

    // Create job sheet record
    const jobSheet = await prisma.serviceJobSheet.create({
      data: {
        jobId: params.id,
        filePath,
        clientSignature: null // Will be updated when client signs
      }
    })

    // Here you would implement the actual PDF generation logic
    // For now, we'll return the job sheet record
    // In a real implementation, you'd use libraries like PDFKit, Puppeteer, or similar

    return NextResponse.json({
      jobSheet,
      message: 'Job sheet generated successfully',
      downloadUrl: `/api/servicing/jobs/${params.id}/jobsheet/${jobSheet.id}/download`
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating job sheet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/servicing/jobs/[id]/jobsheet - List job sheets for a job
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

    const jobSheets = await prisma.serviceJobSheet.findMany({
      where: { jobId: params.id },
      orderBy: { generatedAt: 'desc' }
    })

    return NextResponse.json(jobSheets)

  } catch (error) {
    console.error('Error fetching job sheets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
