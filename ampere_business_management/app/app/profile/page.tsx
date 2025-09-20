
'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Building2, Calendar, Shield, Edit, Save, X } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/login")
      return
    }

    // Initialize form data with current user info
    setFormData({
      firstName: session.user?.firstName || '',
      lastName: session.user?.lastName || '',
      email: session.user?.email || '',
      companyName: session.user?.companyName || '',
    })
  }, [session, status, router])

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "PROJECT_MANAGER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "FINANCE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "SALES":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "VENDOR":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "Super Admin"
      case "PROJECT_MANAGER":
        return "Project Manager"
      case "FINANCE":
        return "Finance"
      case "SALES":
        return "Sales"
      case "VENDOR":
        return "Vendor"
      default:
        return role
    }
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedUser = await response.json()
      
      // Update the session with new data
      await update({
        ...session,
        user: {
          ...session?.user,
          ...updatedUser.user,
        }
      })

      toast.success("Profile updated successfully")
      setIsEditing(false)
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      firstName: session?.user?.firstName || '',
      lastName: session?.user?.lastName || '',
      email: session?.user?.email || '',
      companyName: session?.user?.companyName || '',
    })
    setIsEditing(false)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <MainLayout session={session}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Overview */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <CardTitle>Profile Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={session.user?.image || ""} />
                <AvatarFallback className="bg-red-600 text-white text-2xl">
                  {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="text-lg font-semibold">{session.user?.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{session.user?.email}</p>
                <Badge 
                  variant="secondary" 
                  className={`mt-2 ${getRoleColor(session.user?.role || "")}`}
                >
                  {getRoleDisplay(session.user?.role || "")}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  <span>{session.user?.companyName || "No company set"}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {new Date().getFullYear()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{session.user?.firstName || "Not set"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{session.user?.lastName || "Not set"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{session.user?.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                {isEditing ? (
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter your company name"
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{session.user?.companyName || "Not set"}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Account Role</Label>
                <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <Badge 
                    variant="secondary" 
                    className={getRoleColor(session.user?.role || "")}
                  >
                    {getRoleDisplay(session.user?.role || "")}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    (Contact admin to change role)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
