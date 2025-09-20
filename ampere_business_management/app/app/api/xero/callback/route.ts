
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { XeroService } from '@/lib/xero-service'
import { prisma } from '@/lib/db'

// GET /api/xero/callback - Handle Xero OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Xero OAuth error:', error)
      return NextResponse.redirect(new URL('/settings?xero=error&message=' + encodeURIComponent(error), request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?xero=error&message=No authorization code received', request.url))
    }

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const xeroService = new XeroService(undefined, session.user.id)
    const result = await xeroService.handleCallback(code, state || '')

    console.log('Xero callback result:', { success: result.success, hasTokens: !!result.tokens, error: result.error })

    if (result.success && result.tokens) {
      try {
        console.log('Testing Xero connection with tokens...')
        // Test the connection
        const xeroServiceWithTokens = new XeroService(result.tokens, session.user.id)
        const connectionTest = await xeroServiceWithTokens.testConnection()

        console.log('Xero connection test result:', connectionTest)

        if (connectionTest.success) {
          return NextResponse.redirect(new URL('/settings?xero=success&message=' + encodeURIComponent('Xero integration successful'), request.url))
        } else {
          return NextResponse.redirect(new URL('/settings?xero=error&message=' + encodeURIComponent('Failed to connect to Xero: ' + (connectionTest.error || 'Unknown error')), request.url))
        }

      } catch (dbError) {
        console.error('Failed to save Xero tokens or test connection:', dbError)
        return NextResponse.redirect(new URL('/settings?xero=error&message=Failed to save integration settings', request.url))
      }
    } else {
      console.log('Xero callback failed:', result.error)
      return NextResponse.redirect(new URL('/settings?xero=error&message=' + encodeURIComponent(result.error || 'Authentication failed'), request.url))
    }

  } catch (error) {
    console.error('Xero callback error:', error)
    return NextResponse.redirect(new URL('/settings?xero=error&message=Integration failed', request.url))
  }
}
