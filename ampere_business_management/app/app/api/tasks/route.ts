
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      include: {
        User_Task_assignerIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        User_Task_assigneeIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        },
        Client: {
          select: {
            id: true,
            name: true
          }
        },
        TaskComment: {
          select: {
            id: true
          }
        },
        TaskAttachment: {
          select: {
            id: true
          }
        }
      },
      where: {
        isArchived: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedTasks = tasks.map(task => {
      const now = new Date()
      const dueDate = task.dueDate ? new Date(task.dueDate) : null
      const isOverdue = dueDate && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && 
                       now > dueDate
      const daysPastDue = isOverdue && dueDate ? 
        Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate?.toISOString() || null,
        completedAt: task.completedAt?.toISOString() || null,
        assigner: task.User_Task_assignerIdToUser,
        assignee: task.User_Task_assigneeIdToUser,
        project: task.Project,
        client: task.Client,
        commentsCount: task.TaskComment.length,
        attachmentsCount: task.TaskAttachment.length,
        isOverdue: Boolean(isOverdue),
        daysPastDue: daysPastDue > 0 ? daysPastDue : undefined,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString()
      }
    })

    return NextResponse.json(formattedTasks)

  } catch (error) {
    console.error('Error fetching tasks:', error)
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
    const canCreateTask = ["SUPERADMIN", "PROJECT_MANAGER", "FINANCE"].includes(userRole || "")
    
    if (!canCreateTask) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = await request.json()

    const task = await prisma.task.create({
      data: {
        id: uuidv4(),
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: 'TODO',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignerId: session.user?.id || '',
        assigneeId: data.assigneeId,
        projectId: data.projectId || null,
        clientId: data.clientId || null,
        updatedAt: new Date()
      },
      include: {
        User_Task_assignerIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        User_Task_assigneeIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        },
        Client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Create notification for assignee
    await prisma.taskNotification.create({
      data: {
        id: uuidv4(),
        taskId: task.id,
        userId: task.assigneeId,
        type: 'TASK_ASSIGNED',
        message: `New task assigned: ${task.title}`
      }
    })

    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate?.toISOString() || null,
      completedAt: task.completedAt?.toISOString() || null,
      assigner: task.User_Task_assignerIdToUser,
      assignee: task.User_Task_assigneeIdToUser,
      project: task.Project,
      client: task.Client,
      commentsCount: 0,
      attachmentsCount: 0,
      isOverdue: false,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }

    return NextResponse.json(formattedTask)

  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
