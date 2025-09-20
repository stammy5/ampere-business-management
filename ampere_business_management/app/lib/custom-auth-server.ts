
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { CustomSession } from './custom-auth'

export function validateCustomSessionServer(req: NextRequest): CustomSession | null {
  try {
    const sessionToken = req.cookies.get('session-token')?.value
    
    if (!sessionToken) {
      return null
    }
    
    const decoded = jwt.verify(sessionToken, process.env.NEXTAUTH_SECRET!) as CustomSession
    return decoded
  } catch (error) {
    console.error('Custom session validation error:', error)
    return null
  }
}
