
'use client'

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Briefcase, 
  Search, 
  Plus, 
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Target,
  Building2,
  User,
  FileText,
  TrendingUp,
  ArrowUpDown
} from "lucide-react"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format, isAfter, isBefore, addDays } from "date-fns"
import { useRouter } from "next/navigation"
import { NASLink } from "@/components/ui/nas-link"

interface Tender {
  id: string
  title: string
  tenderNumber: string
  description?: string
  clientName: string
  estimatedValue?: number
  submissionDeadline: string
  openDate: string
  status: string
  priority: string
  category: string
  contactPerson?: string
  location?: string
  assignedTo?: string
  nasDocumentPath?: string
}

interface TenderColumn {
  id: string
  title: string
  count: number
  tenders: Tender[]
  color: string
}

export default function TendersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [tenders, setTenders] = useState<Tender[]>([])
  const [columns, setColumns] = useState<TenderColumn[]>([])
  const [sortField, setSortField] = useState<keyof Tender>("title")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const response = await fetch('/api/tenders')
        if (!response.ok) {
          throw new Error('Failed to fetch tenders')
        }
        const data = await response.json()

        // Organize tenders into kanban columns
        const statusColumns = {
          OPEN: { title: "Open Tenders", color: "bg-blue-50 border-blue-200", tenders: [] as Tender[] },
          SUBMITTED: { title: "Submitted", color: "bg-yellow-50 border-yellow-200", tenders: [] as Tender[] },
          WON: { title: "Won", color: "bg-green-50 border-green-200", tenders: [] as Tender[] },
          LOST: { title: "Lost", color: "bg-red-50 border-red-200", tenders: [] as Tender[] },
          EXPIRED: { title: "Expired", color: "bg-gray-50 border-gray-200", tenders: [] as Tender[] }
        }

        data.forEach((tender: Tender) => {
          if (statusColumns[tender.status as keyof typeof statusColumns]) {
            statusColumns[tender.status as keyof typeof statusColumns].tenders.push(tender)
          }
        })

        const kanbanColumns: TenderColumn[] = Object.entries(statusColumns).map(([status, data]) => ({
          id: status,
          title: data.title,
          count: data.tenders.length,
          tenders: data.tenders,
          color: data.color
        }))

        setTenders(data)
        setColumns(kanbanColumns)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching tenders:', error)
        setTenders([])
        setColumns([])
        setLoading(false)
      }
    }

    fetchTenders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "SUBMITTED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "WON":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "LOST":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "EXPIRED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "MEDIUM":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "LOW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Briefcase className="w-3 h-3" />
      case "SUBMITTED":
        return <Clock className="w-3 h-3" />
      case "WON":
        return <CheckCircle className="w-3 h-3" />
      case "LOST":
        return <XCircle className="w-3 h-3" />
      case "EXPIRED":
        return <AlertTriangle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const threeDaysFromNow = addDays(new Date(), 3)
    return isBefore(deadlineDate, threeDaysFromNow) && isAfter(deadlineDate, new Date())
  }

  const isOverdue = (deadline: string, status: string) => {
    const deadlineDate = new Date(deadline)
    return isBefore(deadlineDate, new Date()) && (status === "OPEN" || status === "SUBMITTED")
  }

  const handleSort = (field: keyof Tender) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleTenderClick = (tenderId: string) => {
    router.push(`/tenders/${tenderId}`)
  }

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.tenderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === "all" || tender.category === filterCategory
    const matchesStatus = filterStatus === "all" || tender.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const sortedTenders = filteredTenders.sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    
    let comparison = 0
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue
    } else {
      comparison = String(aValue).localeCompare(String(bValue))
    }
    
    return sortDirection === "asc" ? comparison : -comparison
  })

  const statsData = [
    {
      title: "Total Tenders",
      value: tenders.length,
      description: "All tender opportunities",
      icon: Briefcase,
      color: "text-blue-600"
    },
    {
      title: "Open Tenders",
      value: tenders.filter(t => t.status === "OPEN").length,
      description: "Available to bid",
      icon: Target,
      color: "text-blue-600"
    },
    {
      title: "Success Rate",
      value: `${tenders.filter(t => t.status === "WON").length > 0 
        ? Math.round((tenders.filter(t => t.status === "WON").length / (tenders.filter(t => t.status === "WON").length + tenders.filter(t => t.status === "LOST").length)) * 100) 
        : 0}%`,
      description: "Win rate",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Pipeline Value",
      value: `$${(tenders.filter(t => t.status === "OPEN" || t.status === "SUBMITTED")
        .reduce((sum, t) => sum + (t.estimatedValue || 0), 0)).toLocaleString()}`,
      description: "Potential revenue",
      icon: DollarSign,
      color: "text-green-600"
    }
  ]

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tender Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track and manage tender opportunities with visual pipeline
              </p>
            </div>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => router.push('/tenders/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Tender
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
                  <TabsList>
                    <TabsTrigger value="kanban">Kanban View</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search tenders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                    <SelectItem value="ENGINEERING">Engineering</SelectItem>
                    <SelectItem value="SUPPLY">Supply</SelectItem>
                    <SelectItem value="CONSULTING">Consulting</SelectItem>
                    <SelectItem value="INSTALLATION">Installation</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="WON">Won</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content Views */}
        {view === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {columns.map((column) => (
              <Card key={column.id} className={`${column.color}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {column.count}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {column.tenders
                    .filter(tender => {
                      return filteredTenders.includes(tender)
                    })
                    .map((tender) => (
                    <div 
                      key={tender.id} 
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleTenderClick(tender.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm line-clamp-2">{tender.title}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTenderClick(tender.id)}>
                              <Eye className="mr-2 h-3 w-3" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-3 w-3" />
                              Edit Tender
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Change Status</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          <span className="truncate">{tender.clientName}</span>
                        </div>
                        {tender.estimatedValue && (
                          <div className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            <span>${tender.estimatedValue.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span 
                            className={`${
                              isOverdue(tender.submissionDeadline, tender.status) ? "text-red-600 font-medium" :
                              isDeadlineNear(tender.submissionDeadline) ? "text-orange-600 font-medium" : ""
                            }`}
                          >
                            Due: {format(new Date(tender.submissionDeadline), "MMM dd")}
                          </span>
                        </div>
                        {tender.assignedTo && (
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            <span className="truncate">{tender.assignedTo}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(tender.priority)}`}
                        >
                          {tender.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {tender.tenderNumber}
                        </span>
                      </div>

                      {(isOverdue(tender.submissionDeadline, tender.status) || isDeadlineNear(tender.submissionDeadline)) && (
                        <div className={`mt-2 text-xs font-medium flex items-center ${
                          isOverdue(tender.submissionDeadline, tender.status) ? "text-red-600" : "text-orange-600"
                        }`}>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {isOverdue(tender.submissionDeadline, tender.status) ? "Overdue!" : "Due Soon"}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Tenders</CardTitle>
              <CardDescription>Complete list of tender opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                        <div className="flex items-center">
                          Tender Title
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("clientName")}>
                        <div className="flex items-center">
                          Client
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("estimatedValue")}>
                        <div className="flex items-center">
                          Value
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("submissionDeadline")}>
                        <div className="flex items-center">
                          Deadline
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                        <div className="flex items-center">
                          Status
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTenders.map((tender) => (
                      <TableRow 
                        key={tender.id} 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleTenderClick(tender.id)}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <Briefcase className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium">{tender.title}</div>
                              <div className="text-sm text-muted-foreground">{tender.tenderNumber}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{tender.clientName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tender.estimatedValue ? (
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">${tender.estimatedValue.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className={`text-sm ${
                                isOverdue(tender.submissionDeadline, tender.status) ? "text-red-600 font-medium" :
                                isDeadlineNear(tender.submissionDeadline) ? "text-orange-600 font-medium" : ""
                              }`}>
                                {format(new Date(tender.submissionDeadline), "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(tender.submissionDeadline), "HH:mm")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(tender.status)}>
                            {getStatusIcon(tender.status)}
                            <span className="ml-1">{tender.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityColor(tender.priority)}>
                            {tender.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{tender.category.replace('_', ' ')}</span>
                        </TableCell>
                        <TableCell>
                          {tender.location && (
                            <div className="flex items-center space-x-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate max-w-32">{tender.location}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {tender.assignedTo && (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{tender.assignedTo}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {tender.nasDocumentPath && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation() // Prevent row click
                                try {
                                  if (tender.nasDocumentPath!.startsWith('\\\\')) {
                                    window.open(`file:///${tender.nasDocumentPath!.replace(/\\/g, '/')}`, '_blank')
                                  } else if (tender.nasDocumentPath!.startsWith('smb://')) {
                                    window.open(tender.nasDocumentPath!, '_blank')
                                  } else {
                                    window.open(`file:///${tender.nasDocumentPath!}`, '_blank')
                                  }
                                } catch (error) {
                                  navigator.clipboard.writeText(tender.nasDocumentPath!)
                                  alert('Path copied to clipboard. Please open manually.')
                                }
                              }}
                              title={`Open: ${tender.nasDocumentPath}`}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {(isOverdue(tender.submissionDeadline, tender.status) || isDeadlineNear(tender.submissionDeadline)) && (
                              <div className={`text-xs font-medium flex items-center ${
                                isOverdue(tender.submissionDeadline, tender.status) ? "text-red-600" : "text-orange-600"
                              }`}>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                              </div>
                            )}
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
                                <DropdownMenuItem onClick={() => handleTenderClick(tender.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Tender
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Create Quotation
                                </DropdownMenuItem>
                                <DropdownMenuItem>Change Status</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {sortedTenders.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tenders found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search criteria or add a new tender opportunity.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
