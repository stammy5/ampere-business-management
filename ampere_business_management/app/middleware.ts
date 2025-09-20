
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { validateCustomSession } from "./lib/custom-auth"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow access to public routes
  if (pathname.startsWith("/auth") || 
      pathname.startsWith("/_next") || 
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/api/auth") ||
      pathname === "/") {
    return NextResponse.next()
  }

  // For development, allow API routes to pass through
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Simple authentication check without timeouts
  try {
    const nextAuthToken = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
    })
    
    if (nextAuthToken) {
      return NextResponse.next()
    }
  } catch (error) {
    // Continue to custom session check
  }
  
  try {
    const customSession = validateCustomSession(req)
    if (customSession) {
      return NextResponse.next()
    }
  } catch (error) {
    // Continue to redirect
  }

  // Protected routes
  const protectedRoutes = ["/dashboard", "/clients", "/projects", "/quotations", "/finance", "/users", "/settings", "/reports"]
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    const loginUrl = new URL("/auth/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/invoices/:path*",
    "/vendors/:path*",
    "/tenders/:path*",
    "/quotations/:path*",
    "/finance/:path*",
    "/vendor-portal/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/reports/:path*",
    "/tasks/:path*",
    "/servicing/:path*",
    "/ai-assistant/:path*",
  ],
}
