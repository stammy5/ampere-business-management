
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/servicing/contracts - List all service contracts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const canView = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER", "FINANCE"].includes(userRole || "")
    
    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const url = new URL(request.url)
    const clientId = url.searchParams.get('clientId')
    const projectId = url.searchParams.get('projectId')
    const serviceType = url.searchParams.get('serviceType')
    const status = url.searchParams.get('status')

    const whereClause: any = {}
    if (clientId) whereClause.clientId = clientId
    if (projectId) whereClause.projectId = projectId
    if (serviceType) whereClause.serviceType = serviceType

    const contracts = await prisma.serviceContract.findMany({
      where: whereClause,
      include: {
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            jobs: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error('Error fetching service contracts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/servicing/contracts - Create new service contract
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const canCreate = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER"].includes(userRole || "")
    
    if (!canCreate) {
      return NextResponse.json({ error: 'Insufficient permissions to create contracts' }, { status: 403 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.clientId || !data.serviceType || !data.frequency || !data.startDate || !data.endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate contract number
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    
    const existingContracts = await prisma.serviceContract.count({
      where: {
        contractNo: {
          startsWith: `SVC-${year}-${month}-`
        }
      }
    })
    
    const contractNo = `SVC-${year}-${month}-${String(existingContracts + 1).padStart(3, '0')}`

    const contract = await prisma.$transaction(async (tx) => {
      const newContract = await tx.serviceContract.create({
        data: {
          contractNo,
          clientId: data.clientId,
          projectId: data.projectId || null,
          serviceType: data.serviceType,
          frequency: data.frequency,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          filePath: data.filePath || null,
          createdById: session.user?.id || ''
        },
        include: {
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
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      // Generate initial scheduled jobs based on frequency
      await generateInitialJobs(tx, newContract)

      return newContract
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('Error creating service contract:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate initial scheduled jobs
async function generateInitialJobs(tx: any, contract: any) {
  const jobs = []
  const startDate = new Date(contract.startDate)
  const endDate = new Date(contract.endDate)
  let currentDate = new Date(startDate)

  // Calculate job intervals based on frequency
  let intervalMonths = 1
  switch (contract.frequency) {
    case 'Monthly':
      intervalMonths = 1
      break
    case 'Quarterly':
      intervalMonths = 3
      break
    case 'BiAnnual':
      intervalMonths = 6
      break
    case 'Annual':
      intervalMonths = 12
      break
    case 'Custom':
      // For custom frequency, generate one job per year for now
      intervalMonths = 12
      break
  }

  // Generate jobs until end date
  while (currentDate <= endDate) {
    jobs.push({
      contractId: contract.id,
      clientId: contract.clientId,
      projectId: contract.projectId,
      assignedToType: 'Staff', // Default to staff, can be changed later
      assignedToId: contract.createdById, // Assign to contract creator initially
      scheduledDate: new Date(currentDate),
      status: 'Scheduled'
    })

    // Move to next scheduled date
    currentDate.setMonth(currentDate.getMonth() + intervalMonths)
  }

  // Create all jobs
  if (jobs.length > 0) {
    await tx.serviceJob.createMany({
      data: jobs
    })
  }
}
