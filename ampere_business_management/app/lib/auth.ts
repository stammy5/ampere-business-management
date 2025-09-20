
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔍 Authorization attempt for:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        console.log('🔎 Searching for user by username:', credentials.email)
        // Try to find user by username (name field) first, then by email
        let user = await prisma.user.findFirst({
          where: {
            name: credentials.email
          }
        })

        // If not found by username, try by email
        if (!user) {
          console.log('🔎 User not found by username, trying email...')
          user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })
        }

        if (!user) {
          console.log('❌ User not found in database')
          return null
        }

        console.log('👤 Found user:', user.name, '| Role:', user.role, '| Active:', user.isActive)

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ""
        )

        if (!isPasswordValid) {
          console.log('❌ Invalid password')
          return null
        }

        if (!user.isActive) {
          console.log('❌ User account is inactive')
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        console.log('✅ Authentication successful for user:', user.name)
        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback - URL:', url, 'Base URL:', baseUrl)
      
      // Force localhost in development
      const forcedBaseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : baseUrl
      console.log('🔧 Using base URL:', forcedBaseUrl)
      
      // After successful login, always redirect to dashboard
      const defaultRedirect = '/dashboard'
      
      // If the URL is the dashboard or starts with dashboard, allow it
      if (url === '/dashboard' || url.startsWith('/dashboard')) {
        console.log('➡️ Redirecting to dashboard')
        return `${forcedBaseUrl}/dashboard`
      }
      
      // Allow relative URLs on the same domain
      if (url && url.startsWith("/")) {
        console.log('➡️ Redirecting to relative URL:', url)
        return `${forcedBaseUrl}${url}`
      }
      
      // For any other case, redirect to dashboard
      console.log('➡️ Default redirect to dashboard')
      return `${forcedBaseUrl}${defaultRedirect}`
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.companyName = user.companyName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.companyName = token.companyName as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    },
  },
}
