
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { MainLayout } from "@/components/layout/main-layout"
import { ProjectsClient } from "./projects-client"
import { cookies } from "next/headers"
import { validateCustomSessionServer } from "@/lib/custom-auth-server"

export default async function ProjectsPage() {
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
          session = {
            user: {
              id: customSession.id,
              name: customSession.name,
              email: customSession.email,
              role: customSession.role
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
          }
        }
      } catch (error) {
        console.error('Custom session validation failed:', error)
      }
    }
  }

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <MainLayout>
      <ProjectsClient />
    </MainLayout>
  )
}
