
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { XeroService } from '@/lib/xero-service'

// GET /api/xero/status - Get detailed integration status for testing
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check environment variables
    const hasCredentials = {
      clientId: !!process.env.XERO_CLIENT_ID,
      clientSecret: !!process.env.XERO_CLIENT_SECRET,
      redirectUri: !!process.env.XERO_REDIRECT_URI,
      scopes: !!process.env.XERO_SCOPES,
    }

    // Check stored tokens
    const tokens = await XeroService.getStoredTokens()
    
    let connectionTest = null
    if (tokens) {
      const xeroService = new XeroService(tokens, session.user.id)
      connectionTest = await xeroService.testConnection()
    }

    return NextResponse.json({
      environment: {
        credentials: hasCredentials,
        allConfigured: Object.values(hasCredentials).every(Boolean)
      },
      tokens: {
        stored: !!tokens,
        tenantId: tokens?.tenantId || null,
        expiresAt: tokens?.expiresAt || null,
        isExpired: tokens ? new Date() > tokens.expiresAt : null
      },
      connection: connectionTest || { connected: false, error: 'No tokens stored' },
      integration: {
        ready: Object.values(hasCredentials).every(Boolean),
        status: tokens && connectionTest && (connectionTest as any)?.connected ? 'Connected' : 'Not Connected'
      }
    })

  } catch (error: any) {
    console.error('Xero status check error:', error)
    return NextResponse.json(
      { 
        error: 'Status check failed',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
