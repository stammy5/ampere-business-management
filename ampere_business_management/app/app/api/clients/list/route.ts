
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clients = await prisma.client.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        contactPerson: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error("GET /api/clients/list error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
