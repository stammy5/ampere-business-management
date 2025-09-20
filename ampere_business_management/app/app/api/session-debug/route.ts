
import { NextRequest, NextResponse } from "next/server"
import { validateCustomSession } from "@/lib/custom-auth"
import { getToken } from "next-auth/jwt"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Session Debug API called')
    
    // Get all cookies
    const cookies = Object.fromEntries(
      request.cookies.getAll().map(cookie => [cookie.name, cookie.value])
    )
    
    // Check NextAuth token
    let nextAuthToken = null
    try {
      nextAuthToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    } catch (nextAuthError) {
      console.log('NextAuth token error:', nextAuthError)
    }
    
    // Check custom session
    let customSession = null
    try {
      customSession = validateCustomSession(request)
    } catch (customError) {
      console.log('Custom session error:', customError)
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      cookies: {
        found: Object.keys(cookies),
        sessionToken: cookies['session-token'] ? 'Present' : 'Missing',
        nextAuthToken: cookies['next-auth.session-token'] ? 'Present' : 'Missing',
        cookieCount: Object.keys(cookies).length
      },
      authentication: {
        nextAuthToken: {
          present: !!nextAuthToken,
          data: nextAuthToken ? {
            name: nextAuthToken.name,
            email: nextAuthToken.email,
            role: nextAuthToken.role
          } : null
        },
        customSession: {
          present: !!customSession,
          data: customSession ? {
            name: customSession.name,
            email: customSession.email,
            role: customSession.role,
            exp: customSession.exp,
            isExpired: Date.now() > (customSession.exp * 1000)
          } : null
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL
      },
      request: {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
        origin: request.headers.get('origin')
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
    
  } catch (error: any) {
    console.error('Session debug error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        errorType: error.constructor.name
      }
    }, { status: 500 })
  }
}
