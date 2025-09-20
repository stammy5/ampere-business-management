
import { XeroClient } from 'xero-node'

if (!process.env.XERO_CLIENT_ID) {
  throw new Error('XERO_CLIENT_ID is required')
}

if (!process.env.XERO_CLIENT_SECRET) {
  throw new Error('XERO_CLIENT_SECRET is required')
}

// Xero API Configuration
export const xeroConfig = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [
    process.env.XERO_REDIRECT_URI || 
    (process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/xero/callback` : '') ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api/xero/callback' : '')
  ].filter(Boolean),
  scopes: (process.env.XERO_SCOPES || 'accounting.transactions accounting.contacts accounting.settings').split(' '),
  state: 'returnPage=business-management-app',
}

// Create Xero Client instance
let xeroClient: XeroClient | null = null

export const getXeroClient = (): XeroClient => {
  if (!xeroClient) {
    xeroClient = new XeroClient({
      clientId: xeroConfig.clientId,
      clientSecret: xeroConfig.clientSecret,
      redirectUris: xeroConfig.redirectUris,
      scopes: xeroConfig.scopes,
      state: xeroConfig.state,
    })
  }
  return xeroClient
}

// Xero API endpoints
export const xeroEndpoints = {
  // Authentication
  AUTH_URL: 'https://login.xero.com/identity/connect/authorize',
  TOKEN_URL: 'https://identity.xero.com/connect/token',
  
  // API Base
  API_BASE: 'https://api.xero.com/api.xro/2.0',
  
  // Endpoints
  CONTACTS: '/Contacts',
  INVOICES: '/Invoices',
  PAYMENTS: '/Payments',
  PURCHASE_ORDERS: '/PurchaseOrders',
  ITEMS: '/Items',
  ACCOUNTS: '/Accounts',
  ORGANISATIONS: '/Organisations',
  CURRENCIES: '/Currencies',
  TAX_RATES: '/TaxRates',
}

// Xero to App Data Mapping
export const xeroMappings = {
  contactType: {
    'CUSTOMER': 'client',
    'SUPPLIER': 'vendor',
    'CLIENT': 'client',
    'VENDOR': 'vendor',
  },
  
  invoiceType: {
    'ACCREC': 'invoice', // Accounts Receivable (Customer Invoice)
    'ACCPAY': 'bill',    // Accounts Payable (Vendor Bill)
  },
  
  invoiceStatus: {
    'DRAFT': 'DRAFT',
    'SUBMITTED': 'SENT',
    'AUTHORISED': 'SENT',
    'PAID': 'PAID',
    'VOIDED': 'CANCELLED',
  },
  
  paymentStatus: {
    'AUTHORISED': 'COMPLETED',
    'DELETED': 'CANCELLED',
  }
}
