
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
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

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        name,
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

    return NextResponse.json(vendor)
  } catch (error: any) {
    console.error('Error updating vendor:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.vendor.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting vendor:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}
