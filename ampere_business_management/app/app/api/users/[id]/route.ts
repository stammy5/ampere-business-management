

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const canView = ["SUPERADMIN"].includes(userRole || "")
    
    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        companyName: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const canEdit = ["SUPERADMIN"].includes(userRole || "")
    
    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = await request.json()

    // Check if this is a status-only update (for activate/deactivate)
    const isStatusOnlyUpdate = Object.keys(data).length === 1 && data.hasOwnProperty('isActive')
    const isPasswordOnlyUpdate = Object.keys(data).length === 1 && data.hasOwnProperty('password')

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    // Handle status-only updates (activate/deactivate)
    if (isStatusOnlyUpdate) {
      updateData.isActive = data.isActive
    }
    // Handle password-only updates  
    else if (isPasswordOnlyUpdate) {
      updateData.password = await bcrypt.hash(data.password, 12)
    }
    // Handle full profile updates
    else {
      // Validate required fields for full updates
      if (!data.firstName || !data.lastName || !data.email || !data.role) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: params.id }
        }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }

      updateData.firstName = data.firstName
      updateData.lastName = data.lastName
      updateData.email = data.email
      updateData.role = data.role
      updateData.isActive = data.isActive !== undefined ? data.isActive : true
      updateData.companyName = data.companyName || null

      // Hash new password if provided
      if (data.password && data.password.length > 0) {
        updateData.password = await bcrypt.hash(data.password, 12)
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        companyName: true
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Update user profile (self-update allowed)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const isOwnProfile = params.id === session.user?.id
    const canEdit = ["SUPERADMIN"].includes(userRole || "") || isOwnProfile
    
    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = await request.json()

    // Prepare update data for profile updates
    const updateData: any = {
      updatedAt: new Date()
    }

    // For own profile, allow updating personal details
    if (isOwnProfile) {
      if (data.firstName !== undefined) updateData.firstName = data.firstName
      if (data.lastName !== undefined) updateData.lastName = data.lastName
      if (data.companyName !== undefined) updateData.companyName = data.companyName
      
      // For own profile, validate email uniqueness if changing email
      if (data.email && data.email !== session.user?.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: data.email,
            id: { not: params.id }
          }
        })

        if (existingUser) {
          return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }
        updateData.email = data.email
      }
    }

    // SuperAdmin can update any field
    if (userRole === "SUPERADMIN") {
      if (data.firstName !== undefined) updateData.firstName = data.firstName
      if (data.lastName !== undefined) updateData.lastName = data.lastName
      if (data.email !== undefined) updateData.email = data.email
      if (data.role !== undefined) updateData.role = data.role
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.companyName !== undefined) updateData.companyName = data.companyName
      
      // Hash new password if provided
      if (data.password && data.password.length > 0) {
        updateData.password = await bcrypt.hash(data.password, 12)
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        companyName: true,
        name: true
      }
    })

    return NextResponse.json({ 
      success: true,
      user: updatedUser 
    })

  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Deactivate user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user?.role
    const canDelete = ["SUPERADMIN"].includes(userRole || "")
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Don't allow deletion of current user
    if (params.id === session.user?.id) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
    }

    // Deactivate user instead of hard delete
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { 
        isActive: false,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error('Error deactivating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

