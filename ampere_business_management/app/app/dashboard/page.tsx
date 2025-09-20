
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { MainLayout } from "@/components/layout/main-layout"
import { DashboardClient } from "./dashboard-client"
import { cookies } from "next/headers"
import { validateCustomSessionServer } from "@/lib/custom-auth-server"

export default async function DashboardPage() {
  // Check NextAuth session first
  const nextAuthSession = await getServerSession(authOptions)
  
  let session = nextAuthSession
  
  // If no NextAuth session, check for custom session
  if (!nextAuthSession) {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session-token')
    
    if (sessionCookie?.value) {
      try {
        // Create a mock request object for validation
        const mockRequest = {
          cookies: {
            get: (name: string) => name === 'session-token' ? { value: sessionCookie.value } : null
          }
        } as any
        
        const customSession = validateCustomSessionServer(mockRequest)
        
        if (customSession) {
          // Convert custom session to NextAuth-like format
          session = {
            user: {
              id: customSession.id,
              email: customSession.email,
              name: customSession.name,
              role: customSession.role,
              firstName: customSession.firstName,
              lastName: customSession.lastName,
              companyName: customSession.companyName,
            },
            expires: new Date(customSession.exp * 1000).toISOString()
          }
        }
      } catch (error) {
        console.error('Error validating custom session:', error)
      }
    }
  }

  // If no session found, redirect to login
  if (!session) {
    redirect("/auth/login")
  }

  return (
    <MainLayout session={session}>
      <DashboardClient session={session} />
    </MainLayout>
  )
}
