
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { generateJobCompletionHTML } from '@/lib/document-templates'

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

    // Fetch service job with all related data
    const serviceJob = await prisma.serviceJob.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          include: {
            client: true
          }
        },
        assignedUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!serviceJob) {
      return NextResponse.json({ error: 'Service job not found' }, { status: 404 })
    }

    // Only allow export for completed jobs
    if (serviceJob.status !== 'Completed') {
      return NextResponse.json({ error: 'Job completion certificate can only be generated for completed jobs' }, { status: 400 })
    }

    // Format data for template
    const certificateNumber = `CERT-${serviceJob.id}-${new Date().getFullYear()}`
    
    const formattedJob = {
      ...serviceJob,
      certificateNumber,
      jobNumber: serviceJob.id,
      client: serviceJob.contract.client,
      technician: serviceJob.assignedUser || { firstName: 'Assigned', lastName: 'Technician', email: '' },
      completedDate: serviceJob.completedAt || serviceJob.updatedAt,
      workPerformed: serviceJob.completionNotes || 'Service maintenance and inspection completed as per contract requirements.',
      materialsUsed: 'Standard maintenance materials as required.',
      duration: null,
      serviceType: 'Maintenance Service'
    }

    // Generate professional HTML document with letterhead
    const htmlContent = generateJobCompletionHTML(formattedJob)
    
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${certificateNumber}.html"`,
      },
    })

  } catch (error) {
    console.error('Error generating completion certificate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
