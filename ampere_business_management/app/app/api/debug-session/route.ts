
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateCustomSession } from "@/lib/custom-auth"
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Session API called')
    
    // Get NextAuth session
    const nextAuthSession = await getServerSession(authOptions)
    console.log('NextAuth session:', !!nextAuthSession, nextAuthSession?.user?.name)
    
    // Check cookies
    const cookies = request.cookies.getAll()
    console.log('All cookies:', cookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Check NextAuth cookie
    const nextAuthCookie = request.cookies.get('next-auth.session-token')
    console.log('NextAuth cookie:', !!nextAuthCookie?.value)
    
    // Check custom session
    const customSession = validateCustomSession(request)
    console.log('Custom session:', !!customSession, customSession?.name)
    
    // Check custom session cookie
    const customCookie = request.cookies.get('session-token')
    console.log('Custom cookie:', !!customCookie?.value)
    
    // If custom cookie exists, try to decode it manually
    let decodedCustom = null
    if (customCookie?.value) {
      try {
        decodedCustom = jwt.verify(customCookie.value, process.env.NEXTAUTH_SECRET!)
        console.log('Decoded custom session:', !!decodedCustom)
      } catch (error) {
        console.log('Custom session decode error:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        nextAuthSession: {
          exists: !!nextAuthSession,
          user: nextAuthSession?.user,
        },
        customSession: {
          exists: !!customSession,
          user: customSession,
        },
        cookies: {
          total: cookies.length,
          nextAuth: !!nextAuthCookie?.value,
          custom: !!customCookie?.value,
        },
        decodedCustom: decodedCustom ? {
          name: (decodedCustom as any).name,
          role: (decodedCustom as any).role,
        } : null,
        timestamp: new Date().toISOString(),
        env: {
          nodeEnv: process.env.NODE_ENV,
          nextAuthUrl: process.env.NEXTAUTH_URL,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        }
      }
    })
  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        timestamp: new Date().toISOString(),
      }
    })
  }
}
