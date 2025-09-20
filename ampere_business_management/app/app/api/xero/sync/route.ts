
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { XeroService } from '@/lib/xero-service'

// POST /api/xero/sync - Manual sync trigger
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { syncType, direction } = body // syncType: 'contacts' | 'invoices' | 'all', direction: 'to_xero' | 'from_xero' | 'both'

    // Get tokens from database
    const tokens = await XeroService.getStoredTokens()

    if (!tokens) {
      return NextResponse.json({ 
        error: 'Xero not connected. Please authenticate first.' 
      }, { status: 400 })
    }

    const xeroService = new XeroService(tokens)
    const results: any[] = []

    if (syncType === 'contacts' || syncType === 'all') {
      if (direction === 'from_xero' || direction === 'both') {
        const contactResult = await xeroService.syncContacts()
        results.push({ type: 'contacts_from_xero', ...contactResult })
      }
    }

    if (syncType === 'invoices' || syncType === 'all') {
      if (direction === 'from_xero' || direction === 'both') {
        const invoiceResult = await xeroService.syncInvoices()
        results.push({ type: 'invoices_from_xero', ...invoiceResult })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      results
    })

  } catch (error: any) {
    console.error('Xero sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}

// GET /api/xero/sync - Get sync status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokens = await XeroService.getStoredTokens()
    const isConnected = !!tokens

    if (isConnected) {
      const xeroService = new XeroService(tokens)
      const connectionTest = await xeroService.testConnection()
      
      // Update organisation info if successful
      if (connectionTest.success && connectionTest.organisation) {
        await XeroService.updateOrganisationInfo(
          tokens.tenantId, 
          connectionTest.organisation.name
        )
      }
      
      return NextResponse.json({
        connected: connectionTest.success,
        organisation: connectionTest.organisation,
        lastSync: null, // You can implement this
        error: connectionTest.error
      })
    }

    return NextResponse.json({
      connected: false,
      organisation: null,
      lastSync: null
    })

  } catch (error) {
    console.error('Xero sync status error:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
