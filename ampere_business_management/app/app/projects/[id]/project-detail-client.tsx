
'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Calendar, 
  DollarSign,
  User,
  Building2,
  Target,
  Clock,
  Upload,
  Download,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Settings,
  Activity,
  FolderOpen
} from "lucide-react"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { ProjectDocuments } from "@/components/projects/project-documents"

interface ProjectDetail {
  id: string
  projectNumber: string
  name: string
  description?: string | null
  projectType: "REGULAR" | "MAINTENANCE"
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  startDate?: string | null
  endDate?: string | null
  estimatedBudget?: number | null
  actualCost?: number | null
  progress: number
  createdAt: string
  updatedAt: string
  Client: {
    id: string
    name: string
    contactPerson?: string | null
    email?: string | null
    phone?: string | null
  }
  User_Project_managerIdToUser?: {
    id: string
    name?: string | null
    firstName?: string | null
    lastName?: string | null
    email: string
  } | null
  User_Project_salespersonIdToUser?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    email: string
  } | null
  ClientInvoice: Array<{
    id: string
    invoiceNumber: string
    totalAmount: number
    status: string
    issueDate: string
    dueDate: string
  }>
  LegacyInvoice: Array<{
    id: string
    invoiceNumber: string
    totalAmount: number
    status: string
    issueDate: string
    dueDate: string
  }>
  Document: Array<{
    id: string
    filename: string
    originalName: string
    size: number
    category?: string | null
    createdAt: string
    User: {
      name?: string | null
      firstName?: string | null
      lastName?: string | null
    }
  }>
  _count: {
    invoices: number
    documents: number
  }
}

const statusConfig = {
  PLANNING: { color: "bg-yellow-100 text-yellow-800", label: "Planning", icon: Clock },
  IN_PROGRESS: { color: "bg-blue-100 text-blue-800", label: "In Progress", icon: TrendingUp },
  ON_HOLD: { color: "bg-gray-100 text-gray-800", label: "On Hold", icon: Clock },
  COMPLETED: { color: "bg-green-100 text-green-800", label: "Completed", icon: CheckCircle },
  CANCELLED: { color: "bg-red-100 text-red-800", label: "Cancelled", icon: XCircle },
}

const priorityConfig = {
  LOW: { color: "bg-green-100 text-green-800", label: "Low", icon: "🟢" },
  MEDIUM: { color: "bg-blue-100 text-blue-800", label: "Medium", icon: "🔵" },
  HIGH: { color: "bg-orange-100 text-orange-800", label: "High", icon: "🟠" },
  URGENT: { color: "bg-red-100 text-red-800", label: "Urgent", icon: "🔴" },
}

const projectTypeConfig = {
  REGULAR: { color: "bg-blue-100 text-blue-800", label: "Regular Project", icon: "🏗️" },
  MAINTENANCE: { color: "bg-purple-100 text-purple-800", label: "Maintenance", icon: "🔧" },
}

const invoiceStatusConfig = {
  DRAFT: { color: "bg-gray-100 text-gray-800", label: "Draft" },
  SENT: { color: "bg-blue-100 text-blue-800", label: "Sent" },
  PAID: { color: "bg-green-100 text-green-800", label: "Paid" },
  OVERDUE: { color: "bg-red-100 text-red-800", label: "Overdue" },
  CANCELLED: { color: "bg-red-100 text-red-800", label: "Cancelled" },
}

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Project not found")
        }
        throw new Error("Failed to fetch project")
      }

      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error("Error fetching project:", error)
      setError(error instanceof Error ? error.message : "Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const handleBack = () => {
    router.push("/projects")
  }

  const getManagerDisplayName = (manager: ProjectDetail["User_Project_managerIdToUser"]) => {
    if (!manager) return "Unassigned"
    if (manager.firstName && manager.lastName) {
      return `${manager.firstName} ${manager.lastName}`
    }
    return manager.name || "Unknown"
  }

  const getSalespersonDisplayName = (salesperson: ProjectDetail["User_Project_salespersonIdToUser"]) => {
    if (!salesperson) return "Unassigned"
    if (salesperson.firstName && salesperson.lastName) {
      return `${salesperson.firstName} ${salesperson.lastName}`
    }
    return "Unknown"
  }

  const getUserDisplayName = (user: { name?: string | null, firstName?: string | null, lastName?: string | null }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || "Unknown User"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getDaysUntilDeadline = (endDate: string) => {
    const now = new Date()
    const deadline = new Date(endDate)
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Error Loading Project</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
          <div className="mt-6 flex justify-center space-x-4">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
            <Button onClick={fetchProject} className="bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Project Not Found</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBack} className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[project.status].icon
  const allInvoices = [...project.ClientInvoice, ...project.LegacyInvoice].sort(
    (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
  )

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              <Badge variant="outline" className={statusConfig[project.status].color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig[project.status].label}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {project.projectNumber}
              </span>
              <Badge variant="outline" className={projectTypeConfig[project.projectType].color}>
                {projectTypeConfig[project.projectType].icon} {projectTypeConfig[project.projectType].label}
              </Badge>
              <Badge variant="outline" className={priorityConfig[project.priority].color}>
                {priorityConfig[project.priority].icon} {priorityConfig[project.priority].label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Project Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Activity className="mr-2 h-4 w-4" />
                View Activity Log
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export Project Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Progress</h4>
                  <div className="flex items-center space-x-3">
                    <Progress value={project.progress} className="h-2 flex-1" />
                    <span className="text-sm font-medium min-w-12">{project.progress}%</span>
                  </div>
                </div>
                
                {project.estimatedBudget && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget</h4>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">${project.estimatedBudget.toLocaleString()}</span>
                      {project.actualCost && (
                        <span className="text-sm text-gray-500">
                          / ${project.actualCost.toLocaleString()} spent
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {project.startDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</h4>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                
                {project.endDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</h4>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <div>
                        <span>{new Date(project.endDate).toLocaleDateString()}</span>
                        {(() => {
                          const days = getDaysUntilDeadline(project.endDate)
                          if (days < 0) {
                            return <div className="text-xs text-red-600 font-medium">Overdue by {Math.abs(days)} days</div>
                          } else if (days <= 7) {
                            return <div className="text-xs text-orange-600 font-medium">Due in {days} days</div>
                          }
                          return null
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="invoices" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Invoices ({project._count.invoices})</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center space-x-2">
                    <FolderOpen className="h-4 w-4" />
                    <span>Document Management</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Activity</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="invoices" className="p-6">
                  {allInvoices.length > 0 ? (
                    <div className="space-y-4">
                      {allInvoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-medium">{invoice.invoiceNumber}</div>
                              <div className="text-sm text-gray-600">
                                Issued: {new Date(invoice.issueDate).toLocaleDateString()}
                                {invoice.dueDate && ` • Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge 
                              variant="outline" 
                              className={invoiceStatusConfig[invoice.status as keyof typeof invoiceStatusConfig]?.color || "bg-gray-100 text-gray-800"}
                            >
                              {invoiceStatusConfig[invoice.status as keyof typeof invoiceStatusConfig]?.label || invoice.status}
                            </Badge>
                            <div className="font-medium">${invoice.totalAmount.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium">No invoices yet</h3>
                      <p className="mt-2 text-gray-600">Invoices for this project will appear here.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="p-0">
                  <ProjectDocuments 
                    projectId={projectId} 
                    userRole={session?.user?.role as string || 'VIEWER'}
                    projectDetails={project ? {
                      projectNumber: project.projectNumber,
                      name: project.name,
                      description: project.description || undefined,
                      clientName: project.Client.name,
                      location: project.description || undefined, // Using description as location for now
                      startDate: project.startDate || undefined,
                      endDate: project.endDate || undefined
                    } : undefined}
                  />
                </TabsContent>

                <TabsContent value="activity" className="p-6">
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium">Activity log coming soon</h3>
                    <p className="mt-2 text-gray-600">Project activity and timeline will be displayed here.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Client</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">{project.Client.name}</h4>
                {project.Client.contactPerson && (
                  <p className="text-sm text-gray-600">Contact: {project.Client.contactPerson}</p>
                )}
                {project.Client.email && (
                  <p className="text-sm text-gray-600">{project.Client.email}</p>
                )}
                {project.Client.phone && (
                  <p className="text-sm text-gray-600">{project.Client.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Manager */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Manager</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium">
                    {getManagerDisplayName(project.User_Project_managerIdToUser)}
                  </div>
                  {project.User_Project_managerIdToUser?.email && (
                    <div className="text-sm text-gray-600">
                      {project.User_Project_managerIdToUser.email}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Personnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Sales Personnel</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">
                    {getSalespersonDisplayName(project.User_Project_salespersonIdToUser)}
                  </div>
                  {project.User_Project_salespersonIdToUser?.email && (
                    <div className="text-sm text-gray-600">
                      {project.User_Project_salespersonIdToUser.email}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm font-medium">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Invoices</span>
                <span className="text-sm font-medium">{project._count.invoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Project Docs</span>
                <span className="text-sm font-medium">{project._count.documents || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
