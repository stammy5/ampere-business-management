
'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SalesPersonnelSelect } from "@/components/ui/sales-personnel-select"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  FolderOpen, 
  User, 
  Calendar, 
  DollarSign,
  Clock,
  Building,
  FileText,
  Upload,
  Target,
  TrendingUp,
  AlertCircle,
  ArrowUpDown,
  Building2,
  CheckCircle,
  XCircle,
  Eye
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

interface Project {
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
  client: {
    id: string
    name: string
    contactPerson?: string | null
  }
  manager?: {
    id: string
    name?: string | null
    firstName?: string | null
    lastName?: string | null
  } | null
  _count: {
    invoices: number
    documents: number
  }
}

interface Client {
  id: string
  name: string
  contactPerson?: string | null
}

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  projectType: z.enum(["REGULAR", "MAINTENANCE"]).default("REGULAR"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).default("PLANNING"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  estimatedBudget: z.number().min(0).optional().or(z.literal("")),
  progress: z.number().min(0).max(100).default(0),
  clientId: z.string().min(1, "Client is required"),
  managerId: z.string().optional(),
  salespersonId: z.string().optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

const statusConfig = {
  PLANNING: { color: "bg-yellow-100 text-yellow-800", label: "Planning" },
  IN_PROGRESS: { color: "bg-blue-100 text-blue-800", label: "In Progress" },
  ON_HOLD: { color: "bg-gray-100 text-gray-800", label: "On Hold" },
  COMPLETED: { color: "bg-green-100 text-green-800", label: "Completed" },
  CANCELLED: { color: "bg-red-100 text-red-800", label: "Cancelled" },
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

export function ProjectsClient() {
  const router = useRouter()
  const [hasError, setHasError] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [projectTypeFilter, setProjectTypeFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [sortField, setSortField] = useState<keyof Project>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      projectType: "REGULAR",
      status: "PLANNING",
      priority: "MEDIUM",
      startDate: "",
      endDate: "",
      estimatedBudget: "",
      progress: 0,
      clientId: "",
      managerId: "",
      salespersonId: "",
    },
  })

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)
      if (projectTypeFilter && projectTypeFilter !== "all") params.append("projectType", projectTypeFilter)

      const response = await fetch(`/api/projects?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }

      const data = await response.json()
      
      // Transform the data to match the expected interface
      const transformedProjects = (data.projects || []).map((project: any) => ({
        ...project,
        client: project.Client || project.client,
        manager: project.User_Project_managerIdToUser || project.manager,
      }))
      
      setProjects(transformedProjects)
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast.error("Failed to load projects")
      setProjects([])
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients/list")
      if (!response.ok) {
        throw new Error("Failed to fetch clients")
      }
      const data = await response.json()
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast.error("Failed to load clients")
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [searchTerm, statusFilter, projectTypeFilter])

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      const cleanedData = {
        ...data,
        estimatedBudget: data.estimatedBudget ? Number(data.estimatedBudget) : null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        description: data.description || null,
      }

      const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects"
      const method = editingProject ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save project")
      }

      toast.success(editingProject ? "Project updated successfully" : "Project created successfully")
      setIsDialogOpen(false)
      setEditingProject(null)
      form.reset()
      fetchProjects()
    } catch (error) {
      console.error("Error saving project:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save project")
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    try {
      form.reset({
        name: project.name || "",
        description: project.description || "",
        projectType: project.projectType || "REGULAR",
        status: project.status || "PLANNING",
        priority: project.priority || "MEDIUM",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
        estimatedBudget: project.estimatedBudget || "",
        progress: project.progress || 0,
        clientId: project.client?.id || "",
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Error setting up edit form:", error)
      toast.error("Error opening edit form")
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    setIsDeleting(projectId)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete project")
      }

      toast.success("Project deleted successfully")
      fetchProjects()
    } catch (error) {
      console.error("Error deleting project:", error)
      toast.error("Failed to delete project")
    } finally {
      setIsDeleting(null)
    }
  }

  const handleAddNew = () => {
    setEditingProject(null)
    form.reset()
    setIsDialogOpen(true)
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const getDaysUntilDeadline = (endDate: string) => {
    const now = new Date()
    const deadline = new Date(endDate)
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleSort = (field: keyof Project) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedProjects = projects.sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]
    
    // Handle special cases for nested objects
    if (sortField === "client" && a.client && b.client) {
      aValue = a.client.name
      bValue = b.client.name
    }
    
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    
    let comparison = 0
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime()
    } else {
      comparison = String(aValue).localeCompare(String(bValue))
    }
    
    return sortDirection === "asc" ? comparison : -comparison
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Error Loading Projects</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            There was an error loading the projects page. Please refresh and try again.
          </p>
          <Button 
            onClick={() => {
              setHasError(false)
              setLoading(true)
              fetchProjects()
            }} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your engineering projects and track progress
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? "Edit Project" : "Create New Project"}
              </DialogTitle>
              <DialogDescription>
                {editingProject ? "Update project information and status." : "Set up a new project with client and timeline."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Office Renovation Project"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Client *</Label>
                  <Select
                    value={form.watch("clientId")}
                    onValueChange={(value) => form.setValue("clientId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                          {client.contactPerson && ` (${client.contactPerson})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.clientId && (
                    <p className="text-sm text-red-600">{form.formState.errors.clientId.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="projectType">Project Type</Label>
                  <Select
                    value={form.watch("projectType")}
                    onValueChange={(value) => form.setValue("projectType", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(projectTypeConfig).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          {config.icon} {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sales Personnel and Manager Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <SalesPersonnelSelect
                    value={form.watch("salespersonId")}
                    onValueChange={(value) => form.setValue("salespersonId", value)}
                    label="Sales Personnel"
                    placeholder="Select sales personnel"
                  />
                </div>
                <div>
                  <Label htmlFor="managerId">Project Manager</Label>
                  <Select
                    value={form.watch("managerId")}
                    onValueChange={(value) => form.setValue("managerId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No manager assigned</span>
                      </SelectItem>
                      {/* TODO: Add project managers from API */}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Project description and objectives..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={form.watch("priority")}
                    onValueChange={(value) => form.setValue("priority", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([priority, config]) => (
                        <SelectItem key={priority} value={priority}>
                          {config.icon} {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register("startDate")}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register("endDate")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedBudget">Estimated Budget ($)</Label>
                  <Input
                    id="estimatedBudget"
                    type="number"
                    step="0.01"
                    {...form.register("estimatedBudget", { valueAsNumber: true })}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register("progress", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingProject(null)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  {editingProject ? "Update Project" : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(projectTypeConfig).map(([type, config]) => (
              <SelectItem key={type} value={type}>
                {config.icon} {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-xl font-bold">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-xl font-bold">
                  {projects.filter(p => p.status === "IN_PROGRESS").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Planning</p>
                <p className="text-xl font-bold">
                  {projects.filter(p => p.status === "PLANNING").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-xl font-bold">
                  {projects.filter(p => p.priority === "HIGH" || p.priority === "URGENT").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔧</span>
              <div>
                <p className="text-sm text-gray-600">Maintenance</p>
                <p className="text-xl font-bold">
                  {projects.filter(p => p.projectType === "MAINTENANCE").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Complete list of engineering projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("projectNumber")}>
                    <div className="flex items-center">
                      Project #
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Project Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("projectType")}>
                    <div className="flex items-center">
                      Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("client")}>
                    <div className="flex items-center">
                      Client
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("priority")}>
                    <div className="flex items-center">
                      Priority
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("progress")}>
                    <div className="flex items-center">
                      Progress
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("estimatedBudget")}>
                    <div className="flex items-center">
                      Budget
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("endDate")}>
                    <div className="flex items-center">
                      Due Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProjects?.length > 0 && sortedProjects.map((project) => (
                  <TableRow 
                    key={project.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <TableCell>
                      <div className="font-mono text-sm font-medium">
                        {project.projectNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <FolderOpen className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-64">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={projectTypeConfig[project.projectType].color}>
                        {projectTypeConfig[project.projectType].icon} {projectTypeConfig[project.projectType].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span>{project.client?.name || "Unknown Client"}</span>
                          {project.client?.contactPerson && (
                            <div className="text-xs text-muted-foreground">
                              {project.client.contactPerson}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig[project.status].color}>
                        {project.status === "COMPLETED" ? <CheckCircle className="w-3 h-3 mr-1" /> :
                         project.status === "CANCELLED" ? <XCircle className="w-3 h-3 mr-1" /> :
                         project.status === "ON_HOLD" ? <Clock className="w-3 h-3 mr-1" /> :
                         <TrendingUp className="w-3 h-3 mr-1" />}
                        {statusConfig[project.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityConfig[project.priority].color}>
                        {priorityConfig[project.priority].icon} {priorityConfig[project.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3 min-w-32">
                        <Progress value={project.progress} className="h-2 flex-1" />
                        <span className="text-sm font-medium min-w-10">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.estimatedBudget ? (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">${project.estimatedBudget.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.endDate ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">
                              {new Date(project.endDate).toLocaleDateString()}
                            </div>
                            {(() => {
                              const days = getDaysUntilDeadline(project.endDate)
                              if (days < 0) {
                                return <div className="text-xs text-red-600 font-medium">Overdue</div>
                              } else if (days <= 7) {
                                return <div className="text-xs text-orange-600 font-medium">Due Soon</div>
                              }
                              return null
                            })()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.manager ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {project.manager?.firstName && project.manager?.lastName
                              ? `${project.manager.firstName} ${project.manager.lastName}`
                              : project.manager?.name || "Unassigned"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{project._count?.invoices || 0}</span>
                          <span className="text-xs text-gray-500">inv</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Upload className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">{project._count?.documents || 0}</span>
                          <span className="text-xs text-gray-500">docs</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleProjectClick(project.id)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(project)
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(project.id)
                            }}
                            disabled={isDeleting === project.id}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {sortedProjects?.length === 0 && !loading && (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No projects found</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {searchTerm || (statusFilter && statusFilter !== "all") || (projectTypeFilter && projectTypeFilter !== "all") ? "Try adjusting your search or filters." : "Get started by creating your first project."}
              </p>
              {!searchTerm && (!statusFilter || statusFilter === "all") && (!projectTypeFilter || projectTypeFilter === "all") && (
                <Button onClick={handleAddNew} className="mt-4 bg-red-600 hover:bg-red-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
