
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/servicing/contracts/[id] - Get contract by ID
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const contract = await prisma.serviceContract.findUnique({
      where: { id: params.id },
      include: {
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        jobs: {
          include: {
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
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        }
      }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Service contract not found' }, { status: 404 })
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching service contract:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/servicing/contracts/[id] - Update contract
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
    const canUpdate = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER"].includes(userRole || "")
    
    if (!canUpdate) {
      return NextResponse.json({ error: 'Insufficient permissions to update contracts' }, { status: 403 })
    }

    const data = await request.json()

    const contract = await prisma.serviceContract.update({
      where: { id: params.id },
      data: {
        serviceType: data.serviceType,
        frequency: data.frequency,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        filePath: data.filePath,
        updatedAt: new Date()
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

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error updating service contract:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/servicing/contracts/[id] - Delete contract
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
    const canDelete = ["SUPERADMIN"].includes(userRole || "")
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions to delete contracts' }, { status: 403 })
    }

    await prisma.serviceContract.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Service contract deleted successfully' })
  } catch (error) {
    console.error('Error deleting service contract:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
