
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        User_Task_assignerIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        User_Task_assigneeIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            status: true
          }
        },
        Client: {
          select: {
            id: true,
            name: true
          }
        },
        TaskComment: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        TaskAttachment: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        TaskNotification: {
          where: {
            userId: session.user?.id
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const now = new Date()
    const dueDate = task.dueDate ? new Date(task.dueDate) : null
    const isOverdue = dueDate && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && 
                     now > dueDate
    const daysPastDue = isOverdue && dueDate ? 
      Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

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
      comments: task.TaskComment.map(comment => ({
        id: comment.id,
        comment: comment.comment,
        isInternal: comment.isInternal,
        user: comment.User,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString()
      })),
      attachments: task.TaskAttachment.map(attachment => ({
        id: attachment.id,
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimetype: attachment.mimetype,
        size: attachment.size,
        cloudStoragePath: attachment.cloudStoragePath,
        uploadedBy: attachment.User,
        createdAt: attachment.createdAt.toISOString()
      })),
      notifications: task.TaskNotification,
      isOverdue: Boolean(isOverdue),
      daysPastDue: daysPastDue > 0 ? daysPastDue : undefined,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }

    return NextResponse.json(formattedTask)

  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id
    const data = await request.json()

    // Check if task exists and user has permission to update
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const userRole = session?.user?.role
    const canUpdate = ["SUPERADMIN", "PROJECT_MANAGER"].includes(userRole || "") ||
                     existingTask.assigneeId === session.user?.id ||
                     existingTask.assignerId === session.user?.id

    if (!canUpdate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const updateData: any = {}

    // Only allow certain fields to be updated
    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date()
      }
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
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

    // Create notification for status changes
    if (data.status && data.status !== existingTask.status) {
      let notificationMessage = ''
      let notificationUserId = ''

      if (data.status === 'COMPLETED') {
        notificationMessage = `Task completed: ${updatedTask.title}`
        notificationUserId = updatedTask.assignerId // Notify the person who assigned the task
      } else {
        notificationMessage = `Task status changed to ${data.status}: ${updatedTask.title}`
        notificationUserId = updatedTask.assignerId
      }

      if (notificationUserId && notificationUserId !== session.user?.id) {
        await prisma.taskNotification.create({
          data: {
            id: uuidv4(),
            taskId: updatedTask.id,
            userId: notificationUserId,
            type: data.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
            message: notificationMessage
          }
        })
      }
    }

    const now = new Date()
    const dueDate = updatedTask.dueDate ? new Date(updatedTask.dueDate) : null
    const isOverdue = dueDate && updatedTask.status !== 'COMPLETED' && updatedTask.status !== 'CANCELLED' && 
                     now > dueDate
    const daysPastDue = isOverdue && dueDate ? 
      Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

    const formattedTask = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      status: updatedTask.status,
      dueDate: updatedTask.dueDate?.toISOString() || null,
      completedAt: updatedTask.completedAt?.toISOString() || null,
      assigner: updatedTask.User_Task_assignerIdToUser,
      assignee: updatedTask.User_Task_assigneeIdToUser,
      project: updatedTask.Project,
      client: updatedTask.Client,
      commentsCount: 0, // Will be calculated in full fetch
      attachmentsCount: 0, // Will be calculated in full fetch
      isOverdue: Boolean(isOverdue),
      daysPastDue: daysPastDue > 0 ? daysPastDue : undefined,
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString()
    }

    return NextResponse.json(formattedTask)

  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id
    const userRole = session?.user?.role
    const canDelete = ["SUPERADMIN", "PROJECT_MANAGER"].includes(userRole || "")

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Soft delete by archiving
    await prisma.task.update({
      where: { id: taskId },
      data: {
        isArchived: true
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
