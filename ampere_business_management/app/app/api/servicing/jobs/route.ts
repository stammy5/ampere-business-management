
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/servicing/jobs - List all service jobs with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const userId = session.user?.id
    const canViewAll = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER", "FINANCE"].includes(userRole || "")

    const url = new URL(request.url)
    const clientId = url.searchParams.get('clientId')
    const projectId = url.searchParams.get('projectId')
    const status = url.searchParams.get('status')
    const assignedTo = url.searchParams.get('assignedTo')
    const assignedToType = url.searchParams.get('assignedToType')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    const whereClause: any = {}

    // If not admin/manager, show only jobs assigned to current user
    if (!canViewAll) {
      whereClause.OR = [
        { assignedToType: 'Staff', assignedToId: userId },
        { assignedToType: 'Vendor', assignedUser: { vendorId: userId } }
      ]
    }

    if (clientId) whereClause.clientId = clientId
    if (projectId) whereClause.projectId = projectId
    if (status) whereClause.status = status
    if (assignedTo) whereClause.assignedToId = assignedTo
    if (assignedToType) whereClause.assignedToType = assignedToType
    
    if (dateFrom || dateTo) {
      whereClause.scheduledDate = {}
      if (dateFrom) whereClause.scheduledDate.gte = new Date(dateFrom)
      if (dateTo) whereClause.scheduledDate.lte = new Date(dateTo)
    }

    const jobs = await prisma.serviceJob.findMany({
      where: whereClause,
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
            phone: true,
            contactPerson: true
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
            contactPerson: true
          }
        },
        _count: {
          select: {
            jobSheets: true,
            vendorReports: true,
            invoices: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching service jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/servicing/jobs - Create new service job
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const canCreate = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER"].includes(userRole || "")
    
    if (!canCreate) {
      return NextResponse.json({ error: 'Insufficient permissions to create jobs' }, { status: 403 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.contractId || !data.clientId || !data.assignedToType || !data.assignedToId || !data.scheduledDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the assigned user/vendor exists
    if (data.assignedToType === 'Staff') {
      const user = await prisma.user.findUnique({ where: { id: data.assignedToId } })
      if (!user) {
        return NextResponse.json({ error: 'Assigned user not found' }, { status: 404 })
      }
    } else if (data.assignedToType === 'Vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { id: data.assignedToId } })
      if (!vendor) {
        return NextResponse.json({ error: 'Assigned vendor not found' }, { status: 404 })
      }
    }

    const job = await prisma.serviceJob.create({
      data: {
        contractId: data.contractId,
        clientId: data.clientId,
        projectId: data.projectId || null,
        assignedToType: data.assignedToType,
        assignedToId: data.assignedToId,
        scheduledDate: new Date(data.scheduledDate),
        status: data.status || 'Scheduled',
        completionNotes: data.completionNotes || null
      },
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

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Error creating service job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
