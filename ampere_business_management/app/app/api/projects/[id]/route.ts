
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").optional(),
  description: z.string().optional().nullable(),
  projectType: z.enum(["REGULAR", "MAINTENANCE"]).optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  estimatedBudget: z.number().optional().nullable(),
  actualCost: z.number().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
  clientId: z.string().optional(),
  managerId: z.string().optional().nullable(),
  salespersonId: z.string().optional().nullable(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectData = await prisma.project.findUnique({
      where: {
        id: params.id,
        isActive: true,
      },
      include: {
        Client: true,
        User_Project_managerIdToUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        User_Project_salespersonIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        ClientInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            issueDate: true,
            dueDate: true,
          },
        },
        LegacyInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            issueDate: true,
            dueDate: true,
          },
        },
        Document: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            size: true,
            category: true,
            createdAt: true,
            User: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            ClientInvoice: true,
            LegacyInvoice: true,
            Document: true,
          },
        },
      },
    })

    if (!projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Transform the data to match frontend expectations
    const project = {
      ...projectData,
      _count: {
        invoices: projectData._count.ClientInvoice + projectData._count.LegacyInvoice,
        documents: projectData._count.Document,
      },
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateProjectSchema.parse(body)

    const existingProject = await prisma.project.findUnique({
      where: { id: params.id, isActive: true },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Verify client exists if clientId is being updated
    if (validatedData.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: validatedData.clientId, isActive: true },
      })

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 400 })
      }
    }

    const updatedProjectData = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : validatedData.startDate,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : validatedData.endDate,
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
          },
        },
        User_Project_managerIdToUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
        User_Project_salespersonIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            ClientInvoice: true,
            LegacyInvoice: true,
            Document: true,
          },
        },
      },
    })

    // Transform the data to match frontend expectations
    const updatedProject = {
      ...updatedProjectData,
      _count: {
        invoices: updatedProjectData._count.ClientInvoice + updatedProjectData._count.LegacyInvoice,
        documents: updatedProjectData._count.Document,
      },
    }

    return NextResponse.json(updatedProject)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("PUT /api/projects/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingProject = await prisma.project.findUnique({
      where: { id: params.id, isActive: true },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Soft delete
    await prisma.project.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
