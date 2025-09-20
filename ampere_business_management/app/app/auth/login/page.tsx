
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - Ampere Engineering",
  description: "Sign in to your Ampere Engineering Business Management System account",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Company Header */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Ampere Engineering</h1>
            <p className="text-gray-600">Business Management System</p>
          </div>
        </div>
        
        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <LoginForm />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2024 Ampere Engineering Pte Ltd. All rights reserved.</p>
          <div className="mt-2">
            <span>Version 2.0 - Enhanced Security</span>
          </div>
        </div>
      </div>
    </div>
  )
}
