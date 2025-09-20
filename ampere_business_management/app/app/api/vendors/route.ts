
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateVendorNumber } from '@/lib/number-generation'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendors = await prisma.vendor.findMany({
      include: {
        User_Vendor_createdByIdToUser: {
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

    return NextResponse.json({ vendors })
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
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
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      contactPerson,
      companyReg,
      website,
      notes,
      vendorType,
      paymentTerms,
      contractDetails,
      bankName,
      bankAccountNumber,
      bankAccountName,
      bankSwiftCode,
      bankAddress,
    } = body

    // Generate the next vendor number
    const vendorNumber = await generateVendorNumber()

    const vendor = await prisma.vendor.create({
      data: {
        id: uuidv4(),
        name,
        vendorNumber,
        email,
        phone,
        address,
        city,
        state,
        country: country || 'Singapore',
        postalCode,
        contactPerson,
        companyReg,
        website,
        notes,
        vendorType,
        paymentTerms,
        contractDetails,
        bankName,
        bankAccountNumber,
        bankAccountName,
        bankSwiftCode,
        bankAddress,
        createdById: session.user.id,
        updatedAt: new Date()
      },
      include: {
        User_Vendor_createdByIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    console.error('Error creating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}
