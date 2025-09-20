
import { NextRequest } from 'next/server'

export interface CustomSession {
  id: string
  email: string
  name: string
  role: string
  firstName: string
  lastName: string
  companyName: string
  iat: number
  exp: number
}

export function validateCustomSession(req: NextRequest): CustomSession | null {
  try {
    const sessionToken = req.cookies.get('session-token')?.value
    
    if (!sessionToken) {
      return null
    }
    
    // Check JWT format (should have 3 parts separated by dots)
    const tokenParts = sessionToken.split('.')
    if (tokenParts.length !== 3) {
      return null
    }
    
    try {
      // Decode the payload without verification (for Edge runtime compatibility)
      const payload = JSON.parse(atob(tokenParts[1]))
      
      // Check if it has required fields
      if (!payload.id || !payload.name || !payload.role) {
        return null
      }
      
      // Check if token is expired
      if (!payload.exp) {
        return null
      }
      
      const now = Date.now()
      const expiry = payload.exp * 1000
      const isExpired = now >= expiry
      
      if (isExpired) {
        return null
      }
      
      return payload as CustomSession
      
    } catch (decodeError: any) {
      return null
    }
    
  } catch (error: any) {
    return null
  }
}

export async function getCustomSession(req: NextRequest): Promise<CustomSession | null> {
  return validateCustomSession(req)
}
