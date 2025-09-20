
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createInvoiceSchema = z.object({
  description: z.string().optional().nullable(),
  amount: z.number().min(0, "Amount must be positive"),
  taxAmount: z.number().min(0).optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
  issueDate: z.string().optional(),
  dueDate: z.string(),
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().min(1, "Project is required"), // Made required to match schema
})

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear()
  const lastInvoice = await prisma.legacyInvoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}-`,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
  })

  let sequence = 1
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0')
    sequence = lastSequence + 1
  }

  return `INV-${year}-${sequence.toString().padStart(4, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const clientId = searchParams.get("clientId") || ""
    const projectId = searchParams.get("projectId") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { invoiceNumber: { contains: search, mode: "insensitive" as const } },
          { client: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...(status && { status: status as any }),
      ...(clientId && { clientId }),
      ...(projectId && { projectId }),
    }

    const [invoices, total] = await Promise.all([
      prisma.legacyInvoice.findMany({
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
          Project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.legacyInvoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("GET /api/invoices error:", error)
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
    const validatedData = createInvoiceSchema.parse(body)

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId, isActive: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 400 })
    }

    // Verify project exists if provided
    if (validatedData.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: validatedData.projectId, isActive: true },
      })

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 400 })
      }
    }

    // Calculate total amount
    const taxAmount = validatedData.taxAmount || 0
    const totalAmount = validatedData.amount + taxAmount

    const invoiceNumber = await generateInvoiceNumber()

    const invoice = await prisma.legacyInvoice.create({
      data: {
        id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        description: validatedData.description,
        amount: validatedData.amount,
        taxAmount: validatedData.taxAmount,
        status: validatedData.status,
        clientId: validatedData.clientId,
        projectId: validatedData.projectId,
        invoiceNumber,
        totalAmount,
        issueDate: validatedData.issueDate ? new Date(validatedData.issueDate) : new Date(),
        dueDate: new Date(validatedData.dueDate),
        createdById: session.user.id,
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
        Project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("POST /api/invoices error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
