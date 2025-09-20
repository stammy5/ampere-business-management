
'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { 
  CalendarDays,
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Paperclip,
  Users,
  FolderOpen,
  Building2,
  Bell,
  BellOff,
  ArrowUpDown,
  MoreHorizontal,
  Calendar,
  Flag,
  User,
  Target,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from "lucide-react"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { format, formatDistanceToNow, isBefore, isAfter, addDays } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED'
  dueDate?: string
  completedAt?: string
  assigner: {
    id: string
    firstName: string
    lastName: string
  }
  assignee: {
    id: string
    firstName: string
    lastName: string
  }
  project?: {
    id: string
    name: string
    projectNumber: string
  }
  client?: {
    id: string
    name: string
  }
  commentsCount: number
  attachmentsCount: number
  isOverdue: boolean
  daysPastDue?: number
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface ProjectOption {
  id: string
  name: string
  projectNumber: string
}

interface ClientOption {
  id: string
  name: string
}

const priorityConfig = {
  LOW: { color: 'bg-gray-100 text-gray-700', icon: Flag, label: 'Low', bgColor: 'bg-gray-50' },
  MEDIUM: { color: 'bg-blue-100 text-blue-700', icon: Flag, label: 'Medium', bgColor: 'bg-blue-50' },
  HIGH: { color: 'bg-orange-100 text-orange-700', icon: Flag, label: 'High', bgColor: 'bg-orange-50' },
  URGENT: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Urgent', bgColor: 'bg-red-50' },
}

const statusConfig = {
  TODO: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'To Do' },
  IN_PROGRESS: { color: 'bg-blue-100 text-blue-700', icon: Play, label: 'In Progress' },
  REVIEW: { color: 'bg-purple-100 text-purple-700', icon: Eye, label: 'In Review' },
  COMPLETED: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' },
  CANCELLED: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' },
}

export default function TasksPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterAssignee, setFilterAssignee] = useState("all")
  const [sortField, setSortField] = useState<keyof Task>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [activeTab, setActiveTab] = useState("all")
  
  // Create task dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createTaskForm, setCreateTaskForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as const,
    assigneeId: "",
    dueDate: "",
    projectId: "",
    clientId: ""
  })

  const userRole = session?.user?.role
  const canManageTasks = ["SUPERADMIN", "PROJECT_MANAGER"].includes(userRole || "")
  const currentUserId = session?.user?.id

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [tasksRes, usersRes, projectsRes, clientsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/users'),
        fetch('/api/projects/list'),
        fetch('/api/clients/list')
      ])

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!createTaskForm.title.trim()) {
      toast.error('Task title is required')
      return
    }

    if (!createTaskForm.assigneeId) {
      toast.error('Please select an assignee')
      return
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...createTaskForm,
          dueDate: createTaskForm.dueDate ? new Date(createTaskForm.dueDate).toISOString() : null
        })
      })

      if (response.ok) {
        const newTask = await response.json()
        setTasks(prev => [newTask, ...prev])
        setShowCreateDialog(false)
        setCreateTaskForm({
          title: "",
          description: "",
          priority: "MEDIUM",
          assigneeId: "",
          dueDate: "",
          projectId: "",
          clientId: ""
        })
        toast.success('Task created successfully')
      } else {
        throw new Error('Failed to create task')
      }
    } catch (error) {
      console.error('Task creation failed:', error)
      toast.error('Failed to create task')
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null
        })
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ))
        toast.success('Task status updated')
      } else {
        throw new Error('Failed to update task')
      }
    } catch (error) {
      console.error('Task update failed:', error)
      toast.error('Failed to update task')
    }
  }

  const handleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Filter tasks based on active tab
  let filteredTasksByTab = tasks
  if (activeTab === "assigned") {
    filteredTasksByTab = tasks.filter(task => task.assignee.id === currentUserId)
  } else if (activeTab === "created") {
    filteredTasksByTab = tasks.filter(task => task.assigner.id === currentUserId)
  } else if (activeTab === "overdue") {
    filteredTasksByTab = tasks.filter(task => task.isOverdue)
  }

  // Apply additional filters
  const filteredTasks = filteredTasksByTab.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || task.status === filterStatus
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority
    const matchesAssignee = filterAssignee === "all" || task.assignee.id === filterAssignee
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  })

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    if (sortField === 'assignee') {
      aValue = `${a.assignee.firstName} ${a.assignee.lastName}`
      bValue = `${b.assignee.firstName} ${b.assignee.lastName}`
    } else if (sortField === 'assigner') {
      aValue = `${a.assigner.firstName} ${a.assigner.lastName}`
      bValue = `${b.assigner.firstName} ${b.assigner.lastName}`
    }

    if (aValue === null && bValue === null) return 0
    if (aValue === null) return sortDirection === "asc" ? 1 : -1
    if (bValue === null) return sortDirection === "asc" ? -1 : 1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const getPriorityIcon = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    const Icon = config?.icon || Flag
    return <Icon className="h-4 w-4" />
  }

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config?.icon || Clock
    return <Icon className="h-4 w-4" />
  }

  const getPriorityColor = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    return config?.color || 'bg-gray-100 text-gray-700'
  }

  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    return config?.color || 'bg-gray-100 text-gray-700'
  }

  const getPriorityBg = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    return config?.bgColor || 'bg-gray-50'
  }

  // Statistics
  const totalTasks = tasks.length
  const myTasks = tasks.filter(task => task.assignee.id === currentUserId)
  const overdueTasks = tasks.filter(task => task.isOverdue)
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED')
  const dueSoonTasks = tasks.filter(task => 
    task.dueDate && 
    task.status !== 'COMPLETED' && 
    isAfter(new Date(task.dueDate), new Date()) && 
    isBefore(new Date(task.dueDate), addDays(new Date(), 7))
  )

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600">Assign and track work across your team</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              disabled={!canManageTasks}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold">{totalTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">My Tasks</p>
                  <p className="text-2xl font-bold">{myTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold">{overdueTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Soon</p>
                  <p className="text-2xl font-bold">{dueSoonTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{completedTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="assigned">Assigned to Me ({myTasks.length})</TabsTrigger>
            <TabsTrigger value="created">Created by Me ({tasks.filter(t => t.assigner.id === currentUserId).length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdueTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search tasks, assignees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="REVIEW">In Review</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tasks List */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks ({sortedTasks.length})</CardTitle>
                <CardDescription>
                  Click on any task row to view details and comments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortedTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || filterStatus !== "all" || filterPriority !== "all" || filterAssignee !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "Get started by creating your first task."
                      }
                    </p>
                    {canManageTasks && (!searchTerm && filterStatus === "all" && filterPriority === "all" && filterAssignee === "all") && (
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                            <div className="flex items-center">
                              Task
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("assignee")}>
                            <div className="flex items-center">
                              Assignee
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("priority")}>
                            <div className="flex items-center">
                              Priority
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                            <div className="flex items-center">
                              Status
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("dueDate")}>
                            <div className="flex items-center">
                              Due Date
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Activity</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTasks.map((task) => (
                          <TableRow 
                            key={task.id} 
                            className={`hover:bg-muted/50 cursor-pointer ${getPriorityBg(task.priority)}`}
                            onClick={() => router.push(`/tasks/${task.id}`)}
                          >
                            <TableCell>
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                  <CheckSquare className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{task.title}</div>
                                  {task.description && (
                                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                      {task.description.length > 100 
                                        ? `${task.description.slice(0, 100)}...`
                                        : task.description
                                      }
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400 mt-1">
                                    Created by {task.assigner.firstName} {task.assigner.lastName} • {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {task.assignee.firstName} {task.assignee.lastName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getPriorityColor(task.priority)} border-0`}>
                                <span className="flex items-center space-x-1">
                                  {getPriorityIcon(task.priority)}
                                  <span>{priorityConfig[task.priority as keyof typeof priorityConfig]?.label}</span>
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(task.status)} border-0`}>
                                <span className="flex items-center space-x-1">
                                  {getStatusIcon(task.status)}
                                  <span>{statusConfig[task.status as keyof typeof statusConfig]?.label}</span>
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {task.dueDate ? (
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(new Date(task.dueDate), "MMM dd, yyyy")}</span>
                                  </div>
                                  {task.isOverdue && (
                                    <div className="flex items-center space-x-1 text-red-600 text-xs mt-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span>{task.daysPastDue} days overdue</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No due date</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {task.project ? (
                                <div className="flex items-center space-x-2">
                                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="text-sm font-medium">{task.project.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{task.project.projectNumber}</div>
                                  </div>
                                </div>
                              ) : task.client ? (
                                <div className="flex items-center space-x-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{task.client.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No project</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                {task.commentsCount > 0 && (
                                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{task.commentsCount}</span>
                                  </div>
                                )}
                                {task.attachmentsCount > 0 && (
                                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                    <Paperclip className="h-3 w-3" />
                                    <span>{task.attachmentsCount}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end">
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
                                    <DropdownMenuItem onClick={() => router.push(`/tasks/${task.id}`)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    {(task.assignee.id === currentUserId || canManageTasks) && task.status !== 'COMPLETED' && (
                                      <>
                                        <DropdownMenuItem onClick={(e) => {
                                          e.stopPropagation()
                                          handleUpdateTaskStatus(task.id, 'IN_PROGRESS')
                                        }}>
                                          <Play className="mr-2 h-4 w-4" />
                                          Mark In Progress
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                          e.stopPropagation()
                                          handleUpdateTaskStatus(task.id, 'COMPLETED')
                                        }}>
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Mark Completed
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {canManageTasks && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit Task
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Task
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Task Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Assign a new task to team members with details and due dates.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="title"
                    value={createTaskForm.title}
                    onChange={(e) => setCreateTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Description
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="description"
                    value={createTaskForm.description}
                    onChange={(e) => setCreateTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed task description..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={createTaskForm.priority} onValueChange={(value: any) => setCreateTaskForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={createTaskForm.dueDate}
                    onChange={(e) => setCreateTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign To *</Label>
                <Select value={createTaskForm.assigneeId} onValueChange={(value) => setCreateTaskForm(prev => ({ ...prev, assigneeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project (Optional)</Label>
                  <Select value={createTaskForm.projectId} onValueChange={(value) => setCreateTaskForm(prev => ({ ...prev, projectId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.projectNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Client (Optional)</Label>
                  <Select value={createTaskForm.clientId} onValueChange={(value) => setCreateTaskForm(prev => ({ ...prev, clientId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
