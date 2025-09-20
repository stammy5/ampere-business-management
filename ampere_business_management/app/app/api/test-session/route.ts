
import { NextRequest, NextResponse } from "next/server"
import { validateCustomSession } from "@/lib/custom-auth"
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test Session API called')
    
    // Check cookies
    const cookies = request.cookies.getAll()
    console.log('All cookies:', cookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Check custom session cookie specifically
    const sessionCookie = request.cookies.get('session-token')
    console.log('Session cookie exists:', !!sessionCookie?.value)
    
    if (sessionCookie?.value) {
      console.log('Session cookie value (first 50 chars):', sessionCookie.value.substring(0, 50) + '...')
      
      try {
        const decoded = jwt.verify(sessionCookie.value, process.env.NEXTAUTH_SECRET!)
        console.log('JWT decoded successfully:', typeof decoded)
        console.log('JWT payload:', decoded)
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError)
      }
    }
    
    // Test validateCustomSession
    const customSession = validateCustomSession(request)
    console.log('validateCustomSession result:', !!customSession, customSession)
    
    return NextResponse.json({
      success: true,
      debug: {
        cookiesCount: cookies.length,
        hasSessionCookie: !!sessionCookie?.value,
        customSessionValid: !!customSession,
        customSession: customSession,
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Test session error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
