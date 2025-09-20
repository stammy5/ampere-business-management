

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { populateDocumentNumbers } from "@/scripts/populate-document-numbers"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only SUPERADMIN can run this maintenance operation
    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Document number generation initiated by ${session.user.email}`)
    
    // Run the population script
    await populateDocumentNumbers()
    
    return NextResponse.json({ 
      success: true, 
      message: "Document numbers generated successfully" 
    })
  } catch (error) {
    console.error("Error generating document numbers:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate document numbers",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

