
import { getXeroClient, xeroEndpoints, xeroMappings } from './xero-config'
import { prisma } from './db'
import { 
  Contact, 
  Invoice, 
  LineItem, 
  Payment,
  PurchaseOrder,
  Organisation,
  Account,
  TaxRate
} from 'xero-node'

export interface XeroTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  tenantId: string
}

export interface XeroSyncResult {
  success: boolean
  message: string
  syncedCount?: number
  errors?: string[]
}

export class XeroService {
  private xeroClient = getXeroClient()

  constructor(private tokens?: XeroTokens, private userId?: string) {
    if (tokens) {
      this.setTokens(tokens)
    }
  }

  // Token Management
  setTokens(tokens: XeroTokens) {
    this.tokens = tokens
    this.xeroClient.setTokenSet({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt.getTime(),
    })
    // Note: Tenant will be set when making API calls
  }

  async refreshTokensIfNeeded(): Promise<boolean> {
    if (!this.tokens) return false

    // Check if token expires within next 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
    if (this.tokens.expiresAt > fiveMinutesFromNow) {
      return true // Token is still valid
    }

    try {
      const response = await this.xeroClient.refreshToken()
      if (response && response.access_token && response.refresh_token && response.expires_in) {
        this.tokens = {
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresAt: new Date(Date.now() + response.expires_in * 1000),
          tenantId: this.tokens.tenantId,
        }

        // Update tokens in database
        await this.saveTokensToDatabase()
        return true
      }
    } catch (error: any) {
      console.error('Failed to refresh Xero token:', error)
      return false
    }

    return false
  }

  private async saveTokensToDatabase() {
    if (!this.tokens || !this.userId) return

    try {
      await prisma.xeroIntegration.upsert({
        where: { tenantId: this.tokens.tenantId },
        update: {
          accessToken: this.tokens.accessToken,
          refreshToken: this.tokens.refreshToken,
          expiresAt: this.tokens.expiresAt,
          lastSyncAt: new Date(),
        },
        create: {
          id: `xero-${this.tokens.tenantId}`,
          tenantId: this.tokens.tenantId,
          accessToken: this.tokens.accessToken,
          refreshToken: this.tokens.refreshToken,
          expiresAt: this.tokens.expiresAt,
          scopes: process.env.XERO_SCOPES?.split(' ') || [],
          createdById: this.userId,
        }
      })
    } catch (error) {
      console.error('Failed to save Xero tokens to database:', error)
      throw error
    }
  }

  // Authentication Methods
  async getAuthorizationUrl(): Promise<string> {
    return await this.xeroClient.buildConsentUrl()
  }

  async handleCallback(code: string, state: string) {
    try {
      console.log('Processing Xero callback with code:', code?.substring(0, 10) + '...')
      
      const tokenResponse = await this.xeroClient.apiCallback(code)
      console.log('Token response received:', !!tokenResponse, 'has access_token:', !!tokenResponse?.access_token)
      
      if (tokenResponse && tokenResponse.access_token && tokenResponse.refresh_token && tokenResponse.expires_in) {
        console.log('Updating Xero tenants...')
        const tenants = await this.xeroClient.updateTenants()
        console.log('Tenants found:', tenants?.length || 0)
        
        if (tenants && tenants.length > 0) {
          const tenant = tenants[0]
          console.log('Using tenant:', tenant.tenantId)
          
          this.tokens = {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
            tenantId: tenant.tenantId,
          }

          console.log('Saving tokens to database...')
          await this.saveTokensToDatabase()
          console.log('Tokens saved successfully')
          
          return { success: true, tokens: this.tokens }
        } else {
          return { success: false, error: 'No Xero organisation found' }
        }
      } else {
        return { success: false, error: 'Invalid token response from Xero' }
      }
    } catch (error: any) {
      console.error('Xero callback error:', error)
      return { success: false, error: error?.message || 'Unknown error' }
    }
  }

  // Data Sync Methods
  async syncContacts(): Promise<XeroSyncResult> {
    if (!(await this.refreshTokensIfNeeded())) {
      return { success: false, message: 'Invalid or expired tokens' }
    }

    try {
      const response = await this.xeroClient.accountingApi.getContacts(this.tokens!.tenantId)
      const contacts = response.body.contacts || []

      let syncedCount = 0
      const errors: string[] = []

      for (const xeroContact of contacts) {
        try {
          await this.syncSingleContact(xeroContact)
          syncedCount++
        } catch (error: any) {
          console.error(`Failed to sync contact ${xeroContact.name}:`, error)
          errors.push(`Contact ${xeroContact.name}: ${error?.message || 'Unknown error'}`)
        }
      }

      return {
        success: true,
        message: `Synced ${syncedCount} contacts`,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error: any) {
      console.error('Failed to sync contacts from Xero:', error)
      return { success: false, message: `Failed to sync contacts: ${error?.message || 'Unknown error'}` }
    }
  }

  private async syncSingleContact(xeroContact: Contact) {
    const isClient = xeroContact.isCustomer || 
                    (xeroContact.contactGroups && xeroContact.contactGroups.some(g => g.name === 'Customer'))
    
    const isVendor = xeroContact.isSupplier ||
                    (xeroContact.contactGroups && xeroContact.contactGroups.some(g => g.name === 'Supplier'))

    // Sync as client
    if (isClient) {
      await prisma.client.upsert({
        where: { xeroContactId: xeroContact.contactID || '' },
        update: {
          name: xeroContact.name || '',
          email: xeroContact.emailAddress || null,
          phone: xeroContact.phones?.[0]?.phoneNumber || null,
          address: this.formatXeroAddress(xeroContact.addresses?.[0]),
          updatedAt: new Date(),
        },
        create: {
          id: `xero-${xeroContact.contactID}`,
          name: xeroContact.name || '',
          email: xeroContact.emailAddress || null,
          phone: xeroContact.phones?.[0]?.phoneNumber || null,
          address: this.formatXeroAddress(xeroContact.addresses?.[0]),
          clientType: 'ENTERPRISE',
          xeroContactId: xeroContact.contactID,
          createdById: 'xero-sync', // System user ID
          updatedAt: new Date(),
        }
      })
    }

    // Sync as vendor
    if (isVendor) {
      await prisma.vendor.upsert({
        where: { xeroContactId: xeroContact.contactID || '' },
        update: {
          name: xeroContact.name || '',
          email: xeroContact.emailAddress || null,
          phone: xeroContact.phones?.[0]?.phoneNumber || null,
          address: this.formatXeroAddress(xeroContact.addresses?.[0]),
          updatedAt: new Date(),
        },
        create: {
          id: `xero-${xeroContact.contactID}`,
          name: xeroContact.name || '',
          email: xeroContact.emailAddress || null,
          phone: xeroContact.phones?.[0]?.phoneNumber || null,
          address: this.formatXeroAddress(xeroContact.addresses?.[0]),
          vendorType: 'SUPPLIER',
          xeroContactId: xeroContact.contactID,
          createdById: 'xero-sync', // System user ID
          updatedAt: new Date(),
        }
      })
    }
  }

  async syncInvoices(): Promise<XeroSyncResult> {
    if (!(await this.refreshTokensIfNeeded())) {
      return { success: false, message: 'Invalid or expired tokens' }
    }

    try {
      const response = await this.xeroClient.accountingApi.getInvoices(this.tokens!.tenantId)
      const invoices = response.body.invoices || []

      let syncedCount = 0
      const errors: string[] = []

      for (const xeroInvoice of invoices) {
        try {
          if (xeroInvoice.type === Invoice.TypeEnum.ACCREC) { // Accounts Receivable (Customer Invoice)
            await this.syncClientInvoice(xeroInvoice)
            syncedCount++
          }
        } catch (error: any) {
          console.error(`Failed to sync invoice ${xeroInvoice.invoiceNumber}:`, error)
          errors.push(`Invoice ${xeroInvoice.invoiceNumber}: ${error?.message || 'Unknown error'}`)
        }
      }

      return {
        success: true,
        message: `Synced ${syncedCount} invoices`,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error: any) {
      console.error('Failed to sync invoices from Xero:', error)
      return { success: false, message: `Failed to sync invoices: ${error?.message || 'Unknown error'}` }
    }
  }

  private async syncClientInvoice(xeroInvoice: Invoice) {
    // Find the client by Xero contact ID
    const client = await prisma.client.findUnique({
      where: { xeroContactId: xeroInvoice.contact?.contactID }
    })

    if (!client) {
      throw new Error(`Client not found for Xero contact ID: ${xeroInvoice.contact?.contactID}`)
    }

    const totalAmount = parseFloat(xeroInvoice.total?.toString() || '0')
    
    // First, try to find existing invoice by xeroInvoiceId
    const existingInvoice = await prisma.clientInvoice.findFirst({
      where: { xeroInvoiceId: xeroInvoice.invoiceID }
    })

    const invoiceData = {
      invoiceNumber: xeroInvoice.invoiceNumber || `XERO-${Date.now()}`,
      subtotal: totalAmount,
      totalAmount: totalAmount,
      status: this.mapXeroInvoiceStatus(xeroInvoice.status?.toString() || 'DRAFT') as any,
      dueDate: xeroInvoice.dueDate ? new Date(xeroInvoice.dueDate) : new Date(),
      issueDate: xeroInvoice.date ? new Date(xeroInvoice.date) : new Date(),
      isXeroSynced: true,
      lastXeroSync: new Date(),
    }

    if (existingInvoice) {
      // Update existing invoice
      await prisma.clientInvoice.update({
        where: { id: existingInvoice.id },
        data: {
          ...invoiceData,
          updatedAt: new Date(),
        }
      })
    } else {
      // Create new invoice
      await prisma.clientInvoice.create({
        data: {
          id: `xero-${xeroInvoice.invoiceID}`,
          clientId: client.id,
          ...invoiceData,
          xeroInvoiceId: xeroInvoice.invoiceID,
          createdById: 'xero-sync', // System user ID
          updatedAt: new Date(),
        }
      })
    }
  }

  // Helper Methods
  private formatXeroAddress(address: any): string | null {
    if (!address) return null
    
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.region,
      address.postalCode,
      address.country
    ].filter(Boolean)
    
    return parts.length > 0 ? parts.join(', ') : null
  }

  private mapXeroInvoiceStatus(xeroStatus: string) {
    const statusMap: Record<string, string> = {
      'DRAFT': 'DRAFT',
      'SUBMITTED': 'SENT',
      'AUTHORISED': 'SENT',
      'PAID': 'PAID',
      'VOIDED': 'CANCELLED',
    }
    return statusMap[xeroStatus] || 'DRAFT'
  }

  // Push data to Xero (from app to Xero)
  async createXeroContact(clientData: any): Promise<{ success: boolean, contactId?: string, error?: string }> {
    if (!(await this.refreshTokensIfNeeded())) {
      return { success: false, error: 'Invalid or expired tokens' }
    }

    try {
      const contact: Contact = {
        name: clientData.name,
        emailAddress: clientData.email || undefined,
        phones: clientData.phone ? [{
          phoneType: 'DEFAULT' as any,
          phoneNumber: clientData.phone
        }] : [],
        addresses: clientData.address ? [{
          addressType: 'POBOX' as any,
          addressLine1: clientData.address,
        }] : [],
        isCustomer: true,
      }

      const response = await this.xeroClient.accountingApi.createContacts(
        this.tokens!.tenantId, 
        { contacts: [contact] }
      )

      const createdContact = response.body.contacts?.[0]
      if (createdContact?.contactID) {
        return { success: true, contactId: createdContact.contactID }
      }

      return { success: false, error: 'Failed to create contact in Xero' }
    } catch (error: any) {
      console.error('Failed to create Xero contact:', error)
      return { success: false, error: error?.message || 'Unknown error' }
    }
  }

  async createXeroInvoice(invoiceData: any): Promise<{ success: boolean, invoiceId?: string, error?: string }> {
    if (!(await this.refreshTokensIfNeeded())) {
      return { success: false, error: 'Invalid or expired tokens' }
    }

    try {
      // Find client's Xero contact ID
      const client = await prisma.client.findUnique({
        where: { id: invoiceData.clientId }
      })

      if (!client?.xeroContactId) {
        return { success: false, error: 'Client not synced with Xero' }
      }

      const invoice: Invoice = {
        type: Invoice.TypeEnum.ACCREC,
        contact: { contactID: client.xeroContactId },
        date: invoiceData.issueDate || new Date().toISOString(),
        dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        invoiceNumber: invoiceData.invoiceNumber,
        reference: invoiceData.reference || '',
        lineAmountTypes: 'Exclusive' as any,
        lineItems: invoiceData.items?.map((item: any) => ({
          description: item.description || '',
          quantity: item.quantity || 1,
          unitAmount: item.unitPrice || 0,
          accountCode: '200', // Default sales account
          taxType: 'OUTPUT2', // GST on Income (7% for Singapore)
        })) || [],
        status: Invoice.StatusEnum.DRAFT,
      }

      const response = await this.xeroClient.accountingApi.createInvoices(
        this.tokens!.tenantId,
        { invoices: [invoice] }
      )

      const createdInvoice = response.body.invoices?.[0]
      if (createdInvoice?.invoiceID) {
        return { success: true, invoiceId: createdInvoice.invoiceID }
      }

      return { success: false, error: 'Failed to create invoice in Xero' }
    } catch (error: any) {
      console.error('Failed to create Xero invoice:', error)
      return { success: false, error: error?.message || 'Unknown error' }
    }
  }

  // Static Methods
  static async getStoredTokens(): Promise<XeroTokens | null> {
    try {
      const integration = await prisma.xeroIntegration.findFirst({
        where: { isActive: true },
        orderBy: { connectedAt: 'desc' }
      })

      if (!integration) return null

      return {
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken,
        expiresAt: integration.expiresAt,
        tenantId: integration.tenantId,
      }
    } catch (error) {
      console.error('Failed to retrieve Xero tokens:', error)
      return null
    }
  }

  static async updateOrganisationInfo(tenantId: string, organisationName: string) {
    try {
      await prisma.xeroIntegration.updateMany({
        where: { tenantId },
        data: { tenantName: organisationName }
      })
    } catch (error) {
      console.error('Failed to update organisation info:', error)
    }
  }

  // Utility Methods
  async testConnection(): Promise<{ success: boolean, organisation?: any, error?: string }> {
    if (!(await this.refreshTokensIfNeeded())) {
      return { success: false, error: 'Invalid or expired tokens' }
    }

    try {
      const response = await this.xeroClient.accountingApi.getOrganisations(this.tokens!.tenantId)
      const organisation = response.body.organisations?.[0]
      
      if (organisation) {
        return { success: true, organisation }
      }
      
      return { success: false, error: 'No organisation found' }
    } catch (error: any) {
      console.error('Xero connection test failed:', error)
      return { success: false, error: error?.message || 'Unknown error' }
    }
  }
}
