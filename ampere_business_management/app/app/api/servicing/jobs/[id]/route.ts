
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/servicing/jobs/[id] - Get job by ID
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
    const canViewAll = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER", "FINANCE"].includes(userRole || "")

    const job = await prisma.serviceJob.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          select: {
            id: true,
            contractNo: true,
            serviceType: true,
            frequency: true,
            startDate: true,
            endDate: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            clientNumber: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            contactPerson: true
          }
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            name: true,
            status: true,
            description: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        assignedVendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            contactPerson: true,
            address: true
          }
        },
        jobSheets: {
          orderBy: {
            generatedAt: 'desc'
          }
        },
        vendorReports: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        invoices: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Service job not found' }, { status: 404 })
    }

    // Check permissions - users can only view jobs assigned to them (unless admin)
    if (!canViewAll) {
      const canView = (
        (job.assignedToType === 'Staff' && job.assignedToId === userId) ||
        (job.assignedToType === 'Vendor' && job.assignedToId === userId)
      )
      
      if (!canView) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error fetching service job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/servicing/jobs/[id] - Update job
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

    // Get existing job to check permissions
    const existingJob = await prisma.serviceJob.findUnique({
      where: { id: params.id }
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Service job not found' }, { status: 404 })
    }

    const canUpdateAll = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER"].includes(userRole || "")
    const canUpdateAssigned = (
      (existingJob.assignedToType === 'Staff' && existingJob.assignedToId === userId) ||
      (existingJob.assignedToType === 'Vendor' && existingJob.assignedToId === userId)
    )

    if (!canUpdateAll && !canUpdateAssigned) {
      return NextResponse.json({ error: 'Insufficient permissions to update this job' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    // Only admins can change assignment and scheduling
    if (canUpdateAll) {
      if (data.assignedToType !== undefined) updateData.assignedToType = data.assignedToType
      if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId
      if (data.scheduledDate !== undefined) updateData.scheduledDate = new Date(data.scheduledDate)
    }

    // Both admins and assigned users can update status and notes
    if (data.status !== undefined) updateData.status = data.status
    if (data.completionNotes !== undefined) updateData.completionNotes = data.completionNotes
    
    // Set completion date when status changes to Completed or Endorsed
    if (data.status === 'Completed' || data.status === 'Endorsed') {
      updateData.completedAt = new Date()
    }

    const job = await prisma.serviceJob.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contract: {
          select: {
            id: true,
            contractNo: true,
            serviceType: true,
            frequency: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            clientNumber: true,
            email: true,
            phone: true
          }
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            name: true,
            status: true
          }
        },
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

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error updating service job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
