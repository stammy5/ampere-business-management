
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 Custom login API called')
    
    const { email, password } = await req.json()
    
    console.log('📧 Login attempt for:', email)
    
    if (!email || !password) {
      console.log('❌ Missing credentials')
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    // Find user by username or email
    let user = await prisma.user.findFirst({
      where: { name: email }
    })

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: email }
      })
    }

    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    console.log('👤 Found user:', user.name, '| Role:', user.role)

    const isPasswordValid = await bcrypt.compare(password, user.password || "")

    if (!isPasswordValid) {
      console.log('❌ Invalid password')
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.isActive) {
      console.log('❌ User account is inactive')
      return NextResponse.json({ error: 'Account is inactive' }, { status: 401 })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Create a simple session token
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
    }

    const token = jwt.sign(sessionData, process.env.NEXTAUTH_SECRET!, { 
      expiresIn: '24h' 
    })

    console.log('✅ Custom login successful for:', user.name)
    
    const response = NextResponse.json({ 
      success: true, 
      user: sessionData,
      redirectUrl: '/dashboard'
    })

    // Set session cookie with enhanced settings
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/', // Ensure cookie is available site-wide
    }
    
    console.log('🍪 Setting session cookie with options:', cookieOptions)
    response.cookies.set('session-token', token, cookieOptions)
    
    // Also set a simple flag cookie to help with debugging
    response.cookies.set('auth-method', 'custom', {
      httpOnly: false, // Allow JS access for debugging
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('💥 Custom login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
