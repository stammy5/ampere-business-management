
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const updateInvoiceSchema = z.object({
  description: z.string().optional().nullable(),
  amount: z.number().min(0, "Amount must be positive").optional(),
  taxAmount: z.number().min(0).optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
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

    const invoice = await prisma.legacyInvoice.findUnique({
      where: {
        id: params.id,
      },
      include: {
        Client: true,
        Project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error)
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
    const validatedData = updateInvoiceSchema.parse(body)

    const existingInvoice = await prisma.legacyInvoice.findUnique({
      where: { id: params.id },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Calculate total amount if amount or tax is being updated
    let updateData: any = {
      ...validatedData,
      issueDate: validatedData.issueDate ? new Date(validatedData.issueDate) : undefined,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
    }

    if (validatedData.amount !== undefined || validatedData.taxAmount !== undefined) {
      const amount = validatedData.amount ?? existingInvoice.amount
      const taxAmount = validatedData.taxAmount ?? existingInvoice.taxAmount ?? 0
      updateData.totalAmount = Number(amount) + Number(taxAmount)
    }

    const updatedInvoice = await prisma.legacyInvoice.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("PUT /api/invoices/[id] error:", error)
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

    const existingInvoice = await prisma.legacyInvoice.findUnique({
      where: { id: params.id },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Delete invoice (hard delete for invoices)
    await prisma.legacyInvoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/invoices/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
