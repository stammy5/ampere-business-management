

'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Settings as SettingsIcon, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  UserCog, 
  Mail, 
  Calendar,
  Bell,
  Shield,
  Database,
  Image,
  Upload,
  Palette,
  Globe,
  Key,
  AlertTriangle,
  Save,
  RefreshCw,
  Building2
} from "lucide-react"
import { XeroIntegration } from "@/components/xero/xero-integration"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  createdAt?: string
  lastLoginAt?: string
  companyName?: string
}

interface SystemSettings {
  companyName: string
  companyEmail: string
  currency: string
  timezone: string
  dateFormat: string
  language: string
  theme: string
  notifications: {
    email: boolean
    browser: boolean
    mobile: boolean
  }
  security: {
    twoFactorAuth: boolean
    sessionTimeout: number
    passwordPolicy: string
  }
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    companyName: '',
    password: '',
    isActive: true
  })
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addFormData, setAddFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    companyName: '',
    password: '',
    confirmPassword: ''
  })
  const [settings, setSettings] = useState<SystemSettings>({
    companyName: "",
    companyEmail: "",
    currency: "SGD",
    timezone: "Asia/Singapore",
    dateFormat: "DD/MM/YYYY",
    language: "English",
    theme: "system",
    notifications: {
      email: true,
      browser: true,
      mobile: false
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: "medium"
    }
  })

  const userRole = session?.user?.role
  const canManageUsers = ["SUPERADMIN"].includes(userRole || "")
  const canManageSettings = ["SUPERADMIN"].includes(userRole || "")

  useEffect(() => {
    fetchUsersAndSettings()
  }, [])

  const fetchUsersAndSettings = async () => {
    try {
      setLoading(true)
      
      // Fetch real users from API
      const usersResponse = await fetch('/api/users')
      const userData = usersResponse.ok ? await usersResponse.json() : []
      
      // Set up default settings
      const defaultSettings: SystemSettings = {
        companyName: "Ampere Engineering Pte Ltd",
        companyEmail: "projects@ampere.com.sg",
        currency: "SGD",
        timezone: "Asia/Singapore",
        dateFormat: "DD/MM/YYYY",
        language: "English",
        theme: "system",
        notifications: {
          email: true,
          browser: true,
          mobile: false
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordPolicy: "medium"
        }
      }
      
      setUsers(userData)
      setSettings(defaultSettings)
    } catch (error) {
      console.error('Error fetching data:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      companyName: user.companyName || '',
      password: '',
      isActive: user.isActive
    })
    setEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        await fetchUsersAndSettings() // Refresh the user list
        setEditDialogOpen(false)
        setEditingUser(null)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        await fetchUsersAndSettings() // Refresh the user list
        alert(`User ${action}d successfully`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || `Failed to ${action} user`)
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      alert(`Error ${action}ing user`)
    }
  }

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password for the user:')
    if (!newPassword) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword })
      })

      if (response.ok) {
        alert('Password reset successfully')
      } else {
        alert('Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Error resetting password')
    }
  }

  const handleAddUser = () => {
    setAddFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      companyName: 'Ampere Engineering Pte Ltd',
      password: '',
      confirmPassword: ''
    })
    setAddDialogOpen(true)
  }

  const handleCreateUser = async () => {
    // Validate form
    if (!addFormData.firstName || !addFormData.lastName || !addFormData.email || !addFormData.role || !addFormData.password) {
      alert('Please fill in all required fields')
      return
    }

    if (addFormData.password !== addFormData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (addFormData.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: addFormData.firstName,
          lastName: addFormData.lastName,
          email: addFormData.email,
          role: addFormData.role,
          companyName: addFormData.companyName,
          password: addFormData.password
        })
      })

      if (response.ok) {
        await fetchUsersAndSettings() // Refresh the user list
        setAddDialogOpen(false)
        alert('User created successfully')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Error creating user')
    }
  }

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

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.role.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!canManageSettings && !canManageUsers) {
    return (
      <MainLayout>
        <div className="p-6">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You don't have permission to access the Settings module.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage system configuration, users, and application preferences
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button className="bg-red-600 hover:bg-red-700">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logos">Logos</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Basic company details and branding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => setSettings({
                        ...settings,
                        companyName: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => setSettings({
                        ...settings,
                        companyEmail: e.target.value
                      })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2 h-5 w-5" />
                    Regional Settings
                  </CardTitle>
                  <CardDescription>
                    Localization and formatting preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={settings.currency} onValueChange={(value) => 
                      setSettings({...settings, currency: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => 
                      setSettings({...settings, timezone: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select value={settings.dateFormat} onValueChange={(value) => 
                      setSettings({...settings, dateFormat: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={settings.theme} onValueChange={(value) => 
                      setSettings({...settings, theme: value})
                    }>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {canManageUsers ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.filter(u => u.isActive).length}</div>
                      <p className="text-xs text-muted-foreground">
                        {users.filter(u => u.isActive).length} active / {users.length} total
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">SuperAdmins</CardTitle>
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.filter(u => u.role === "SUPERADMIN" && u.isActive).length}</div>
                      <p className="text-xs text-muted-foreground">Active system administrators</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Project Managers</CardTitle>
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.filter(u => u.role === "PROJECT_MANAGER" && u.isActive).length}</div>
                      <p className="text-xs text-muted-foreground">Active project managers</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Finance Team</CardTitle>
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.filter(u => u.role === "FINANCE" && u.isActive).length}</div>
                      <p className="text-xs text-muted-foreground">Active finance users</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sales Team</CardTitle>
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.filter(u => u.role === "SALES" && u.isActive).length}</div>
                      <p className="text-xs text-muted-foreground">Active sales personnel</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>
                          Manage user accounts, roles, and permissions
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                        <Button className="bg-red-600 hover:bg-red-700" onClick={handleAddUser}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add User
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!user.isActive ? 'opacity-60 bg-gray-50 dark:bg-gray-900' : ''}`}>
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src="" />
                              <AvatarFallback className={`text-white ${user.isActive ? 'bg-red-600' : 'bg-gray-500'}`}>
                                {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-medium ${!user.isActive ? 'text-gray-500' : ''}`}>
                                  {user.firstName} {user.lastName}
                                </h4>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getRoleColor(user.role)}`}
                                >
                                  {getRoleDisplay(user.role)}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={user.isActive ? 
                                    "text-green-600 border-green-600" : 
                                    "text-red-600 border-red-600"
                                  }
                                >
                                  {user.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {user.email}
                                </div>
                                {user.lastLoginAt && (
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              {user.companyName && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {user.companyName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                >
                                  {user.isActive ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {filteredUsers.length === 0 && searchTerm && (
                      <div className="text-center py-12">
                        <UserCog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Try adjusting your search criteria or add a new user.
                        </p>
                      </div>
                    )}
                    
                    {users.length === 1 && !searchTerm && (
                      <div className="text-center py-12">
                        <UserCog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Minimal User Setup</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          You have one admin account configured. Add your team members to expand access to the system.
                        </p>
                        <Button className="bg-red-600 hover:bg-red-700" onClick={handleAddUser}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add First User
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You don't have permission to manage users.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="logos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Logo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="mr-2 h-5 w-5" />
                    Company Logo
                  </CardTitle>
                  <CardDescription>
                    Main company logo displayed in quotations and documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <Image className="h-16 w-16 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Upload your company logo (PNG, JPG, SVG)</p>
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Recommended size: 400x200px or larger. Max file size: 5MB
                  </div>
                </CardContent>
              </Card>

              {/* Letterhead */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="mr-2 h-5 w-5" />
                    Letterhead Design
                  </CardTitle>
                  <CardDescription>
                    Company letterhead for official documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="w-full h-24 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <Palette className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Upload letterhead design</p>
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Letterhead
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Accreditation Logos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Accreditation & Certification Logos
                </CardTitle>
                <CardDescription>
                  ISO, BizSafe, and other certification logos (displayed at bottom of quotations)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ISO Certification */}
                  <div className="border rounded-lg p-4">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium mb-2">ISO Certification</p>
                      <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-3 w-3" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  {/* BizSafe */}
                  <div className="border rounded-lg p-4">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                        <Shield className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium mb-2">BizSafe</p>
                      <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-3 w-3" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  {/* Other Certifications */}
                  <div className="border rounded-lg p-4">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium mb-2">Other Certifications</p>
                      <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-3 w-3" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Logo Management
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Only SuperAdmin users can upload and manage company logos. 
                        All logos will be automatically included in PDF exports and quotations.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="browser-notifications">Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    id="browser-notifications"
                    checked={settings.notifications.browser}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, browser: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mobile-notifications">Mobile Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications on mobile devices
                    </p>
                  </div>
                  <Switch
                    id="mobile-notifications"
                    checked={settings.notifications.mobile}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, mobile: checked }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage security policies and authentication methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all user accounts
                    </p>
                  </div>
                  <Switch
                    id="two-factor-auth"
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        security: { ...settings.security, twoFactorAuth: checked }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                    })}
                    className="w-24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-policy">Password Policy</Label>
                  <Select value={settings.security.passwordPolicy} onValueChange={(value) => 
                    setSettings({
                      ...settings, 
                      security: { ...settings.security, passwordPolicy: value }
                    })
                  }>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weak">Weak (6+ characters)</SelectItem>
                      <SelectItem value="medium">Medium (8+ chars, mixed case)</SelectItem>
                      <SelectItem value="strong">Strong (12+ chars, symbols)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            {/* Xero Integration */}
            <XeroIntegration />
            
            {/* Other Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Other Integrations
                </CardTitle>
                <CardDescription>
                  Additional third-party services and APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Mail className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">Email Service</div>
                        <div className="text-sm text-gray-500">SMTP configuration for notifications</div>
                      </div>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Database className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium">Backup Service</div>
                        <div className="text-sm text-gray-500">Automated database backups</div>
                      </div>
                    </div>
                    <Button variant="outline">Setup</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={editFormData.role} onValueChange={(value) => 
                  setEditFormData({...editFormData, role: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                    <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="SALES">Sales</SelectItem>
                    <SelectItem value="VENDOR">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={editFormData.companyName}
                  onChange={(e) => setEditFormData({...editFormData, companyName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">New Password (optional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editFormData.isActive}
                  onCheckedChange={(checked) => setEditFormData({...editFormData, isActive: checked})}
                />
                <Label>Account Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with role and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addFirstName">First Name *</Label>
                  <Input
                    id="addFirstName"
                    value={addFormData.firstName}
                    onChange={(e) => setAddFormData({...addFormData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addLastName">Last Name *</Label>
                  <Input
                    id="addLastName"
                    value={addFormData.lastName}
                    onChange={(e) => setAddFormData({...addFormData, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addEmail">Email *</Label>
                <Input
                  id="addEmail"
                  type="email"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addRole">Role *</Label>
                <Select value={addFormData.role} onValueChange={(value) => 
                  setAddFormData({...addFormData, role: value})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                    <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="SALES">Sales</SelectItem>
                    <SelectItem value="VENDOR">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addCompanyName">Company Name</Label>
                <Input
                  id="addCompanyName"
                  value={addFormData.companyName}
                  onChange={(e) => setAddFormData({...addFormData, companyName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addPassword">Password *</Label>
                <Input
                  id="addPassword"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={addFormData.password}
                  onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addConfirmPassword">Confirm Password *</Label>
                <Input
                  id="addConfirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={addFormData.confirmPassword}
                  onChange={(e) => setAddFormData({...addFormData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} className="bg-red-600 hover:bg-red-700">
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
