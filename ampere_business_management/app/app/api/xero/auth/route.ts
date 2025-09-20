
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { XeroService } from '@/lib/xero-service'

// GET /api/xero/auth - Get authorization URL for Xero OAuth
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if credentials are configured
    if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Xero credentials not configured' },
        { status: 500 }
      )
    }

    const xeroService = new XeroService()
    const authUrl = await xeroService.getAuthorizationUrl()

    console.log('Generated Xero auth URL:', authUrl)

    return NextResponse.json({ 
      success: true, 
      authUrl,
      message: 'Redirect user to this URL to authorize Xero access'
    })

  } catch (error: any) {
    console.error('Xero auth URL generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate authorization URL',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
