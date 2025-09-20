
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenders = await prisma.tender.findMany({
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        User_Tender_createdByIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        User_Tender_assignedToIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        User_Tender_salespersonIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedTenders = tenders.map(tender => ({
      id: tender.id,
      title: tender.title,
      tenderNumber: tender.tenderNumber,
      description: tender.description,
      clientName: tender.Client.name,
      clientId: tender.clientId,
      estimatedValue: tender.estimatedValue ? Number(tender.estimatedValue) : null,
      submissionDeadline: tender.submissionDeadline.toISOString(),
      openDate: tender.openDate.toISOString(),
      closeDate: tender.closeDate?.toISOString() || null,
      status: tender.status,
      priority: tender.priority,
      category: tender.category,
      contactPerson: tender.contactPerson,
      contactEmail: tender.contactEmail,
      contactPhone: tender.contactPhone,
      location: tender.location,
      requirements: tender.requirements,
      nasDocumentPath: tender.nasDocumentPath,
      isActive: tender.isActive,
      createdAt: tender.createdAt.toISOString(),
      updatedAt: tender.updatedAt.toISOString(),
      assignedTo: tender.User_Tender_assignedToIdToUser ? `${tender.User_Tender_assignedToIdToUser.firstName} ${tender.User_Tender_assignedToIdToUser.lastName}` : null,
      salesperson: tender.User_Tender_salespersonIdToUser ? `${tender.User_Tender_salespersonIdToUser.firstName} ${tender.User_Tender_salespersonIdToUser.lastName}` : null,
      salespersonId: tender.salespersonId
    }))

    return NextResponse.json(transformedTenders)
  } catch (error) {
    console.error('Error fetching tenders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      clientId,
      estimatedValue,
      submissionDeadline,
      openDate,
      closeDate,
      priority,
      requirements,
      contactPerson,
      contactEmail,
      contactPhone,
      location,
      category,
      nasDocumentPath,
      assignedToId,
      salespersonId
    } = body

    // Generate tender number
    const lastTender = await prisma.tender.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { tenderNumber: true }
    })

    let nextNumber = 1
    if (lastTender?.tenderNumber) {
      const match = lastTender.tenderNumber.match(/TND-\d{4}-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    const currentYear = new Date().getFullYear()
    const tenderNumber = `TND-${currentYear}-${nextNumber.toString().padStart(3, '0')}`

    const tender = await prisma.tender.create({
      data: {
        id: uuidv4(),
        title,
        tenderNumber,
        description,
        clientId,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue.toString()) : null,
        submissionDeadline: new Date(submissionDeadline),
        openDate: new Date(openDate),
        closeDate: closeDate ? new Date(closeDate) : null,
        priority,
        requirements,
        contactPerson,
        contactEmail,
        contactPhone,
        location,
        category,
        nasDocumentPath,
        assignedToId,
        salespersonId: salespersonId || null,
        createdById: session.user.id,
        updatedAt: new Date()
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        User_Tender_createdByIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        User_Tender_assignedToIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        User_Tender_salespersonIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(tender, { status: 201 })
  } catch (error) {
    console.error('Error creating tender:', error)
    return NextResponse.json(
      { error: 'Failed to create tender' },
      { status: 500 }
    )
  }
}
