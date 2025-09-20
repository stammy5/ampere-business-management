
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { XeroService } from '@/lib/xero-service'

// GET /api/xero/test - Test Xero connection
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stored tokens
    const tokens = await XeroService.getStoredTokens()
    
    if (!tokens) {
      return NextResponse.json({ 
        connected: false,
        error: 'Xero not connected. Please authenticate first.' 
      })
    }

    const xeroService = new XeroService(tokens, session.user.id)
    const result = await xeroService.testConnection()

    // Update organisation info if successful
    if (result.success && result.organisation) {
      await XeroService.updateOrganisationInfo(
        tokens.tenantId, 
        result.organisation.name
      )
    }

    return NextResponse.json({
      connected: result.success,
      organisation: result.organisation,
      error: result.error
    })

  } catch (error: any) {
    console.error('Xero test connection error:', error)
    return NextResponse.json(
      { 
        connected: false,
        error: 'Connection test failed: ' + (error?.message || 'Unknown error')
      },
      { status: 500 }
    )
  }
}
