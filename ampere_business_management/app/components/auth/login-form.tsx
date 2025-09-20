
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface LoginError {
  field?: string
  message: string
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginError[]>([])
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-specific errors when user types
    setErrors(prev => prev.filter(err => err.field !== field))
  }

  // Enhanced login handler with multiple fallback methods
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔄 === NEW ROBUST LOGIN ATTEMPT ===')
    console.log('📝 Credentials:', { username: formData.username, passwordLength: formData.password.length })
    console.log('🌍 Current URL:', window.location.href)
    
    // Reset errors
    setErrors([])
    
    // Basic validation
    const newErrors: LoginError[] = []
    if (!formData.username.trim()) {
      newErrors.push({ field: 'username', message: 'Username or email is required' })
    }
    if (!formData.password.trim()) {
      newErrors.push({ field: 'password', message: 'Password is required' })
    }
    
    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      // METHOD 1: Direct Custom API (Most Reliable)
      console.log('🔄 ATTEMPT 1: Direct Custom API')
      
      const customResponse = await fetch('/api/custom-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: formData.username.trim(),
          password: formData.password
        }),
        credentials: 'same-origin'
      })

      console.log('📡 Custom API Response Status:', customResponse.status)
      console.log('📡 Custom API Response Headers:', Object.fromEntries(customResponse.headers.entries()))

      if (customResponse.ok) {
        const customResult = await customResponse.json()
        console.log('✅ Custom API Response Body:', customResult)

        if (customResult.success) {
          console.log('🎉 CUSTOM LOGIN SUCCESSFUL!')
          console.log('👤 User data:', customResult.user)
          toast.success(`Welcome back, ${customResult.user?.name || 'User'}!`)
          
          // Verify session is set before redirecting
          console.log('🔄 Verifying session before redirect...')
          
          // Wait a bit longer to ensure cookie is properly set
          setTimeout(async () => {
            try {
              // Test the session by calling a debug endpoint
              const sessionTest = await fetch('/api/session-debug')
              const sessionData = await sessionTest.json()
              
              console.log('🔍 Session verification:', sessionData)
              
              if (sessionData.success && (sessionData.debug.authentication.nextAuthToken.present || sessionData.debug.authentication.customSession.present)) {
                console.log('✅ Session verified, redirecting to dashboard...')
                
                // Check if there's a redirect URL from the login page
                const urlParams = new URLSearchParams(window.location.search)
                const redirectTo = urlParams.get('from') || '/dashboard'
                
                window.location.href = redirectTo
              } else {
                console.log('⚠️ Session not properly established, forcing page reload...')
                window.location.reload()
              }
            } catch (verifyError) {
              console.log('⚠️ Session verification failed, proceeding with redirect anyway:', verifyError)
              window.location.href = "/dashboard"
            }
          }, 1500)
          return
        } else {
          console.log('❌ Custom API returned success:false')
          if (customResult.error?.includes('credentials') || customResult.error?.includes('Invalid')) {
            setErrors([{ message: 'Invalid username or password. Please check your credentials.' }])
          }
        }
      } else {
        console.log('❌ Custom API HTTP Error:', customResponse.status)
      }

      // METHOD 2: NextAuth SignIn (Backup)
      console.log('🔄 ATTEMPT 2: NextAuth SignIn')
      try {
        const { signIn } = await import('next-auth/react')
        
        const nextAuthResult = await signIn('credentials', {
          email: formData.username.trim(),
          password: formData.password,
          redirect: false,
          callbackUrl: "/dashboard"
        })

        console.log('🔍 NextAuth Result:', nextAuthResult)

        if (nextAuthResult?.ok && !nextAuthResult?.error) {
          console.log('🎉 NEXTAUTH LOGIN SUCCESSFUL!')
          toast.success("Welcome back!")
          
          // Give NextAuth a moment, then navigate
          setTimeout(async () => {
            try {
              const { useRouter } = await import('next/navigation')
              const router = useRouter()
              router.push("/dashboard")
            } catch (routerError) {
              console.log('Router failed, using window.location')
              window.location.href = "/dashboard"
            }
          }, 1000)
          return
        } else if (nextAuthResult?.error === 'CredentialsSignin') {
          setErrors([{ message: 'Invalid username or password. Please try again.' }])
        }
      } catch (nextAuthError) {
        console.log('⚠️ NextAuth not available or failed:', nextAuthError)
      }

      // METHOD 3: Manual Form Submission (HTML Fallback)
      console.log('🔄 ATTEMPT 3: Manual Form Submission')
      
      try {
        // Get CSRF token first
        let csrfToken = ''
        try {
          const csrfResponse = await fetch('/api/auth/csrf')
          const csrfData = await csrfResponse.json()
          csrfToken = csrfData.csrfToken || ''
          console.log('🔑 CSRF Token obtained:', csrfToken ? 'Yes' : 'No')
        } catch (csrfError) {
          console.log('⚠️ Could not get CSRF token:', csrfError)
        }

        // Create and submit form programmatically
        const hiddenForm = document.createElement('form')
        hiddenForm.method = 'POST'
        hiddenForm.action = '/api/auth/callback/credentials'
        hiddenForm.style.display = 'none'
        
        // Add form fields
        const fields = [
          { name: 'email', value: formData.username.trim() },
          { name: 'password', value: formData.password },
          { name: 'csrfToken', value: csrfToken },
          { name: 'callbackUrl', value: '/dashboard' }
        ]
        
        fields.forEach(field => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = field.name
          input.value = field.value
          hiddenForm.appendChild(input)
        })
        
        document.body.appendChild(hiddenForm)
        console.log('📋 Submitting form with fields:', fields.map(f => ({ name: f.name, hasValue: !!f.value })))
        hiddenForm.submit()
        
        // Don't remove form immediately, let it submit
        setTimeout(() => {
          document.body.removeChild(hiddenForm)
        }, 5000)
        
        return
        
      } catch (formError) {
        console.error('❌ Manual form submission failed:', formError)
      }

      // All methods failed
      console.error('❌ ALL LOGIN METHODS FAILED')
      setErrors([{ message: 'Login failed. Please check your credentials and try again.' }])
      toast.error("Login failed. Please try again.")

    } catch (error: any) {
      console.error('🚨 CRITICAL LOGIN ERROR:', error)
      setErrors([{ message: 'A system error occurred. Please try again or contact support.' }])
      toast.error("System error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Get error message for specific field
  const getFieldError = (field: string) => {
    return errors.find(err => err.field === field)?.message
  }

  // Get general errors (not field-specific)
  const getGeneralErrors = () => {
    return errors.filter(err => !err.field)
  }

  return (
    <div className="space-y-6">
      {/* System Status Indicator */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>System Online</span>
        </div>
      </div>

      {/* General error messages */}
      {getGeneralErrors().map((error, index) => (
        <div key={index} className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">{error.message}</span>
        </div>
      ))}

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        {/* Username Field */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
            Username or Email
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username or email"
              disabled={isLoading}
              className={`pl-10 ${getFieldError('username') ? 'border-red-300 focus:border-red-500' : ''}`}
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          {getFieldError('username') && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{getFieldError('username')}</span>
            </p>
          )}
        </div>
        
        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              disabled={isLoading}
              className={`pr-10 ${getFieldError('password') ? 'border-red-300 focus:border-red-500' : ''}`}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              autoComplete="current-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
          {getFieldError('password') && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{getFieldError('password')}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors" 
          disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <details className="text-xs">
            <summary className="cursor-pointer font-medium text-gray-600 hover:text-gray-800">
              Debug Information (Development Only)
            </summary>
            <div className="mt-3 space-y-2 font-mono text-gray-500">
              <div>Form Valid: {(!!formData.username.trim() && !!formData.password.trim()).toString()}</div>
              <div>Username Length: {formData.username.length}</div>
              <div>Password Length: {formData.password.length}</div>
              <div>Loading State: {isLoading.toString()}</div>
              <div>Error Count: {errors.length}</div>
              <div>Environment: {process.env.NODE_ENV}</div>
            </div>
          </details>
        </div>
      )}

      {/* Test Credentials Hint */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Test Credentials</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <div><strong>Super Admin:</strong> endy / password123</div>
          <div><strong>Project Manager:</strong> pm / password123</div>
          <div><strong>Finance:</strong> finance / password123</div>
        </div>
      </div>
    </div>
  )
}
