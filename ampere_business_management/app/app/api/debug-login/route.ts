
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Login API called')
    
    // Get basic system information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      userAgent: request.headers.get('user-agent') || 'Unknown',
      origin: request.headers.get('origin') || 'Unknown',
      host: request.headers.get('host') || 'Unknown'
    }
    
    // Test database connection
    let dbStatus = 'Unknown'
    let userCount = 0
    
    try {
      userCount = await prisma.user.count()
      dbStatus = 'Connected'
    } catch (dbError: any) {
      dbStatus = `Error: ${dbError.message}`
    }
    
    // Get list of available test users (without passwords)
    let testUsers: any[] = []
    try {
      testUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          role: { in: ['SUPERADMIN', 'PROJECT_MANAGER', 'FINANCE'] }
        },
        select: {
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true
        },
        take: 5
      })
    } catch (userError: any) {
      console.error('Error fetching test users:', userError)
    }

    return NextResponse.json({
      success: true,
      debug: {
        system: systemInfo,
        database: {
          status: dbStatus,
          userCount,
          testUsers
        },
        recommendations: [
          'Clear browser cache and cookies completely',
          'Disable ad blockers and browser extensions temporarily', 
          'Try incognito/private browsing mode',
          'Check browser console for JavaScript errors',
          'Ensure cookies are enabled',
          'Try different browser or network'
        ]
      }
    })
    
  } catch (error: any) {
    console.error('Debug login API error:', error)
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

export async function POST(request: NextRequest) {
  try {
    const { username, testMode } = await request.json()
    
    console.log('🔍 Debug Login POST - Testing credentials for:', username)
    
    if (!testMode) {
      return NextResponse.json({
        success: false,
        error: 'Test mode required for debug endpoint'
      }, { status: 400 })
    }
    
    // Find user without password check
    let user = null
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { name: username },
            { email: username }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true
        }
      })
    } catch (dbError: any) {
      return NextResponse.json({
        success: false,
        error: `Database error: ${dbError.message}`,
        debug: { username, timestamp: new Date().toISOString() }
      }, { status: 500 })
    }
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: { 
          username, 
          searchedBy: ['name', 'email'],
          timestamp: new Date().toISOString()
        }
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        found: true,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLoginAt
      },
      debug: {
        searchMethod: user.name === username ? 'by name' : 'by email',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error: any) {
    console.error('Debug login POST error:', error)
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
