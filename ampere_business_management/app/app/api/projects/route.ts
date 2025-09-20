
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Function to generate project number
async function generateProjectNumber(projectType: "REGULAR" | "MAINTENANCE") {
  const prefix = projectType === "MAINTENANCE" ? "MNT" : "PRJ"
  const currentYear = new Date().getFullYear()
  
  // Get the last project number for this type and year
  const lastProject = await prisma.project.findFirst({
    where: {
      projectType,
      projectNumber: {
        startsWith: `${prefix}-${currentYear}-`
      }
    },
    orderBy: {
      projectNumber: "desc"
    }
  })
  
  let nextNumber = 1
  if (lastProject) {
    const parts = lastProject.projectNumber.split("-")
    const lastNumber = parseInt(parts[2], 10)
    nextNumber = lastNumber + 1
  }
  
  return `${prefix}-${currentYear}-${nextNumber.toString().padStart(3, "0")}`
}

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().nullable(),
  projectType: z.enum(["REGULAR", "MAINTENANCE"]).default("REGULAR"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).default("PLANNING"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  estimatedBudget: z.number().optional().nullable(),
  progress: z.number().min(0).max(100).default(0),
  clientId: z.string().min(1, "Client is required"),
  managerId: z.string().optional().nullable(),
  salespersonId: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const projectType = searchParams.get("projectType") || ""
    const clientId = searchParams.get("clientId") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { client: { name: { contains: search, mode: "insensitive" as const } } },
          { projectNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status: status as any }),
      ...(projectType && { projectType: projectType as any }),
      ...(clientId && { clientId }),
    }

    const [projectsData, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.project.count({ where }),
    ])

    // Transform the data to match frontend expectations
    const projects = projectsData.map(project => ({
      ...project,
      _count: {
        invoices: project._count.ClientInvoice + project._count.LegacyInvoice,
        documents: project._count.Document,
      },
    }))

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("GET /api/projects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createProjectSchema.parse(body)

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId, isActive: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 400 })
    }

    // Generate project number
    const projectNumber = await generateProjectNumber(validatedData.projectType)

    const projectData = await prisma.project.create({
      data: {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...validatedData,
        projectNumber,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        createdById: session.user.id,
        managerId: validatedData.managerId || session.user.id,
        salespersonId: validatedData.salespersonId || null,
        updatedAt: new Date(),
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
    const project = {
      ...projectData,
      _count: {
        invoices: projectData._count.ClientInvoice + projectData._count.LegacyInvoice,
        documents: projectData._count.Document,
      },
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("POST /api/projects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
