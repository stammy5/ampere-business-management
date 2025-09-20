
'use client'

import { useEffect, useState } from "react"
import { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  FolderOpen, 
  FileText, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Building,
  Calendar,
  ArrowUpRight,
  Activity,
  RefreshCcw
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface DashboardClientProps {
  session: Session
}

interface DashboardStats {
  totalClients: number
  activeProjects: number
  pendingInvoices: number
  totalRevenue: number
  recentActivities: Activity[]
  projectsOverview: ProjectOverview[]
  upcomingDeadlines: Deadline[]
}

interface Activity {
  id: string
  type: string
  message: string
  user: string
  timestamp: string
  icon: string
}

interface ProjectOverview {
  id: string
  name: string
  client: string
  status: string
  progress: number
  dueDate: string
}

interface Deadline {
  id: string
  title: string
  type: string
  date: string
  priority: string
}

export function DashboardClient({ session }: DashboardClientProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const userRole = session.user?.role
  
  // Fetch real dashboard data from APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch real data from multiple endpoints
      const [clientsRes, projectsRes, invoicesRes] = await Promise.all([
        fetch('/api/clients?limit=1000').catch(() => ({ ok: false, json: () => ({ clients: [] }) })),
        fetch('/api/projects?limit=1000').catch(() => ({ ok: false, json: () => ({ projects: [] }) })),
        fetch('/api/invoices?limit=1000').catch(() => ({ ok: false, json: () => ([]) }))
      ])

      const [clientsData, projectsData, invoicesData] = await Promise.all([
        clientsRes.ok ? clientsRes.json() : { clients: [] },
        projectsRes.ok ? projectsRes.json() : { projects: [] },
        invoicesRes.ok ? invoicesRes.json() : []
      ])

      // Extract the actual data arrays
      const clients = clientsData.clients || []
      const projects = projectsData.projects || []
      const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData.invoices || [])

      // Calculate real statistics from fetched data
      const stats: DashboardStats = {
        totalClients: clients.length,
        activeProjects: projects.filter((p: any) => p.status === 'IN_PROGRESS').length,
        pendingInvoices: invoices.filter((i: any) => 
          i.status === 'PENDING' || i.status === 'SENT' || i.status === 'DRAFT'
        ).length,
        totalRevenue: invoices
          .filter((i: any) => i.status === 'PAID')
          .reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0), 0),
        recentActivities: [], // Will be populated when activity tracking is implemented
        projectsOverview: projects.slice(0, 5).map((project: any) => ({
          id: project.id,
          name: project.name,
          client: project.client?.name || 'Unknown Client',
          status: project.status,
          progress: project.progress || 0,
          dueDate: project.endDate || project.targetCompletionDate
        })),
        upcomingDeadlines: [] // Will be populated when task/deadline tracking is implemented
      }

      setStats(stats)
      setLastUpdated(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set empty state on error
      setStats({
        totalClients: 0,
        activeProjects: 0,
        pendingInvoices: 0,
        totalRevenue: 0,
        recentActivities: [],
        projectsOverview: [],
        upcomingDeadlines: []
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'PLANNING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ON_HOLD':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'folder':
        return <FolderOpen className="h-4 w-4" />
      case 'check':
        return <CheckCircle2 className="h-4 w-4" />
      case 'user':
        return <Users className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="p-6">Error loading dashboard data</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session.user?.firstName || session.user?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={fetchDashboardData}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">
                2 overdue
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userRole === 'FINANCE' ? 'Total Revenue' : 'Project Value'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From paid invoices
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Activities
              </CardTitle>
              <CardDescription>Latest updates from your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.icon)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {activity.user} • {activity.timestamp}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6">
                <Button variant="outline" size="sm" className="w-full">
                  View all activities
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Overview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-green-600" />
                Projects Overview
              </CardTitle>
              <CardDescription>Status of current projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.projectsOverview.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <Link 
                      href={`/projects/${project.id}`}
                      className="block border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{project.name}</h4>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Client: {project.client}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {project.progress}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(project.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/projects">
                  <Button variant="outline" size="sm" className="w-full">
                    View all projects
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upcoming Deadlines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Important dates to keep track of</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.upcomingDeadlines.map((deadline, index) => (
                <motion.div
                  key={deadline.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-1" />
                    <Badge className={getPriorityColor(deadline.priority)}>
                      {deadline.priority}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm mb-2">{deadline.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(deadline.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="flex flex-wrap gap-4 justify-center"
      >
        <Link href="/clients">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Users className="mr-2 h-4 w-4" />
            Add New Client
          </Button>
        </Link>
        <Link href="/projects">
          <Button className="bg-green-600 hover:bg-green-700">
            <FolderOpen className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </Link>
        {userRole === 'FINANCE' && (
          <Link href="/invoices">
            <Button className="bg-red-600 hover:bg-red-700">
              <FileText className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          </Link>
        )}
      </motion.div>
    </div>
  )
}
