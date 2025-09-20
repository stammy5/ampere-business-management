
'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Calculator, 
  Search, 
  Plus, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Edit,
  FileDown,
  Copy,
  GitBranch,
  Briefcase,
  Building2,
  User,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ArrowUpDown,
  Trash2
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

interface Quotation {
  id: string
  quotationNumber: string
  version: number
  title: string
  clientName: string
  clientId: string
  tenderNumber?: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  status: string
  validUntil: string
  salesperson: string
  requiresApproval: boolean
  approvalValue?: number
  createdAt: string
  approvedAt?: string
  isSuperseded: boolean
}

interface QuotationColumn {
  id: string
  title: string
  count: number
  quotations: Quotation[]
  color: string
}

interface Client {
  id: string
  clientNumber?: string
  name: string
}

interface Tender {
  id: string
  tenderNumber: string
  title: string
  clientId: string
  client: { name: string }
}

interface User {
  id: string
  firstName: string
  lastName: string
  role: string
}

export default function QuotationsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterClient, setFilterClient] = useState("all")
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [columns, setColumns] = useState<QuotationColumn[]>([])
  const [showNewQuotationDialog, setShowNewQuotationDialog] = useState(false)
  const [sortField, setSortField] = useState<keyof Quotation>("title")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; quotation: Quotation | null }>({
    open: false,
    quotation: null
  })

  // Form data and dropdown options
  const [clients, setClients] = useState<Client[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    clientId: "",
    tenderId: "no-tender",
    title: "",
    salespersonId: "",
    validUntil: ""
  })

  const userRole = session?.user?.role

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const response = await fetch('/api/quotations')
        if (!response.ok) {
          throw new Error('Failed to fetch quotations')
        }
        const data = await response.json()

        // Organize quotations into kanban columns
        const statusColumns = {
          DRAFT: { title: "Draft", color: "bg-gray-50 border-gray-200", quotations: [] as Quotation[] },
          SUBMITTED: { title: "Submitted", color: "bg-blue-50 border-blue-200", quotations: [] as Quotation[] },
          UNDER_REVIEW: { title: "Under Review", color: "bg-yellow-50 border-yellow-200", quotations: [] as Quotation[] },
          APPROVED: { title: "Approved", color: "bg-purple-50 border-purple-200", quotations: [] as Quotation[] },
          SENT: { title: "Sent to Client", color: "bg-indigo-50 border-indigo-200", quotations: [] as Quotation[] },
          ACCEPTED: { title: "Accepted", color: "bg-green-50 border-green-200", quotations: [] as Quotation[] },
          REJECTED: { title: "Rejected", color: "bg-red-50 border-red-200", quotations: [] as Quotation[] },
          CONVERTED: { title: "Converted", color: "bg-emerald-50 border-emerald-200", quotations: [] as Quotation[] }
        }

        data.forEach((quotation: Quotation) => {
          if (statusColumns[quotation.status as keyof typeof statusColumns]) {
            statusColumns[quotation.status as keyof typeof statusColumns].quotations.push(quotation)
          }
        })

        const kanbanColumns: QuotationColumn[] = Object.entries(statusColumns).map(([status, data]) => ({
          id: status,
          title: data.title,
          count: data.quotations.length,
          quotations: data.quotations,
          color: data.color
        }))

        setQuotations(data.filter((q: Quotation) => !q.isSuperseded))
        setColumns(kanbanColumns)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching quotations:', error)
        setQuotations([])
        setColumns([])
        setLoading(false)
      }
    }

    fetchQuotations()
  }, [])

  // Fetch clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients || [])
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
        setClients([])
      }
    }

    fetchClients()
  }, [])

  // Fetch tenders for dropdown
  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const response = await fetch('/api/tenders?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setTenders(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Error fetching tenders:', error)
        setTenders([])
      }
    }

    fetchTenders()
  }, [])

  // Fetch users for salesperson dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        setUsers([])
      }
    }

    fetchUsers()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "APPROVED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "SENT":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      case "ACCEPTED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "CONVERTED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      case "EXPIRED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "SUPERSEDED":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Edit className="w-3 h-3" />
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return <Clock className="w-3 h-3" />
      case "APPROVED":
      case "SENT":
      case "ACCEPTED":
      case "CONVERTED":
        return <CheckCircle className="w-3 h-3" />
      case "REJECTED":
        return <XCircle className="w-3 h-3" />
      case "EXPIRED":
        return <AlertTriangle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const isExpired = (validUntil: string, status: string) => {
    const validDate = new Date(validUntil)
    return isBefore(validDate, new Date()) && !["ACCEPTED", "CONVERTED", "REJECTED"].includes(status)
  }

  const isExpiringSoon = (validUntil: string, status: string) => {
    const validDate = new Date(validUntil)
    const sevenDaysFromNow = addDays(new Date(), 7)
    return isBefore(validDate, sevenDaysFromNow) && isAfter(validDate, new Date()) && !["ACCEPTED", "CONVERTED", "REJECTED"].includes(status)
  }

  const handleSort = (field: keyof Quotation) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = quotation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || quotation.status === filterStatus
    const matchesClient = filterClient === "all" || quotation.clientId === filterClient
    
    return matchesSearch && matchesStatus && matchesClient
  })

  const sortedQuotations = filteredQuotations.sort((a, b) => {
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
      title: "Total Quotations",
      value: quotations.length,
      description: "Active quotations",
      icon: Calculator,
      color: "text-blue-600"
    },
    {
      title: "Success Rate",
      value: `${quotations.filter(q => q.status === "ACCEPTED" || q.status === "CONVERTED").length > 0 
        ? Math.round((quotations.filter(q => q.status === "ACCEPTED" || q.status === "CONVERTED").length / quotations.filter(q => ["ACCEPTED", "CONVERTED", "REJECTED"].includes(q.status)).length) * 100) 
        : 0}%`,
      description: "Acceptance rate",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Pending Approval",
      value: quotations.filter(q => q.status === "UNDER_REVIEW").length,
      description: "Awaiting approval",
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      title: "Pipeline Value",
      value: `$${(quotations.filter(q => !["REJECTED", "EXPIRED", "CONVERTED"].includes(q.status))
        .reduce((sum, q) => sum + q.totalAmount, 0)).toLocaleString()}`,
      description: "Potential revenue",
      icon: DollarSign,
      color: "text-green-600"
    }
  ]

  const canCreateQuotation = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER"].includes(userRole || "")
  const canApprove = ["SUPERADMIN", "ADMIN", "PROJECT_MANAGER"].includes(userRole || "")

  const handleCreateQuotation = async () => {
    try {
      if (!formData.clientId || !formData.title) {
        alert('Please fill in required fields: Client and Quotation Title')
        return
      }

      const quotationData = {
        clientId: formData.clientId,
        tenderId: formData.tenderId && formData.tenderId !== "no-tender" ? formData.tenderId : null,
        title: formData.title,
        salespersonId: formData.salespersonId,
        validUntil: formData.validUntil,
      }

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      })

      if (response.ok) {
        // Reset form
        setFormData({
          clientId: "",
          tenderId: "no-tender",
          title: "",
          salespersonId: "",
          validUntil: ""
        })
        setShowNewQuotationDialog(false)
        
        // Refresh quotations list
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Failed to create quotation: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating quotation:', error)
      alert('Failed to create quotation. Please try again.')
    }
  }

  const handleQuotationClick = (quotationId: string) => {
    router.push(`/quotations/${quotationId}`)
  }

  const handleDeleteQuotation = async (quotation: Quotation) => {
    try {
      const response = await fetch(`/api/quotations/${quotation.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to delete quotation')
        return
      }

      // Remove quotation from state
      setQuotations(prevQuotations => prevQuotations.filter(q => q.id !== quotation.id))
      
      // Close dialog
      setDeleteConfirmDialog({ open: false, quotation: null })
      
      alert('Quotation deleted successfully')
    } catch (error) {
      console.error('Error deleting quotation:', error)
      alert('Failed to delete quotation')
    }
  }

  const openDeleteDialog = (quotation: Quotation) => {
    setDeleteConfirmDialog({ open: true, quotation })
  }

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quotation Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Create, track, and manage quotations from draft to project conversion
              </p>
            </div>
            {canCreateQuotation && (
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Templates
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => router.push('/quotations/create')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Quotation
                </Button>
                <Dialog open={showNewQuotationDialog} onOpenChange={(open) => {
                  setShowNewQuotationDialog(open)
                  if (!open) {
                    // Reset form when dialog closes
                    setFormData({
                      clientId: "",
                      tenderId: "no-tender",
                      title: "",
                      salespersonId: "",
                      validUntil: ""
                    })
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Quick Create
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Quotation</DialogTitle>
                      <DialogDescription>
                        Start a new quotation from scratch or link to an existing tender.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Client</label>
                          <Select value={formData.clientId} onValueChange={(value) => setFormData({...formData, clientId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.length === 0 ? (
                                <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                              ) : (
                                clients.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.clientNumber ? `${client.clientNumber} - ` : ''}{client.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Linked Tender (Optional)</label>
                          <Select value={formData.tenderId} onValueChange={(value) => setFormData({...formData, tenderId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-tender">No tender</SelectItem>
                              {tenders.length === 0 ? (
                                <SelectItem value="no-tenders" disabled>No tenders available</SelectItem>
                              ) : (
                                tenders.map((tender) => (
                                  <SelectItem key={tender.id} value={tender.id}>
                                    {tender.tenderNumber} - {tender.title}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Quotation Title</label>
                        <Input 
                          placeholder="Enter quotation title" 
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Salesperson</label>
                          <Select value={formData.salespersonId} onValueChange={(value) => setFormData({...formData, salespersonId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign salesperson" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.length === 0 ? (
                                <SelectItem value="no-users" disabled>No users available</SelectItem>
                              ) : (
                                users.filter(user => ['SUPERADMIN', 'PROJECT_MANAGER'].includes(user.role)).map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Valid Until</label>
                          <Input 
                            type="date" 
                            value={formData.validUntil}
                            onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => setShowNewQuotationDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleCreateQuotation}
                          disabled={!formData.clientId || !formData.title}
                        >
                          Create Quotation
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
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
                    <TabsTrigger value="kanban">Pipeline View</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search quotations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CONVERTED">Converted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.clientNumber ? `${client.clientNumber} - ` : ''}{client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content Views */}
        {view === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
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
                  {column.quotations
                    .filter(quotation => {
                      return filteredQuotations.includes(quotation)
                    })
                    .map((quotation) => (
                    <div 
                      key={quotation.id} 
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleQuotationClick(quotation.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-1 mb-1">
                            <h4 className="font-medium text-sm line-clamp-2">{quotation.title}</h4>
                            {quotation.version > 1 && (
                              <Badge variant="outline" className="text-xs">
                                v{quotation.version}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{quotation.quotationNumber}</p>
                        </div>
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
                            <DropdownMenuItem onClick={() => handleQuotationClick(quotation.id)}>
                              <Eye className="mr-2 h-3 w-3" />
                              View Details
                            </DropdownMenuItem>
                            {(quotation.status === "DRAFT" && canCreateQuotation) && (
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-3 w-3" />
                                Edit Quotation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <FileDown className="mr-2 h-3 w-3" />
                              Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(quotation.status === "DRAFT" && canCreateQuotation) && (
                              <DropdownMenuItem 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openDeleteDialog(quotation)}
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Delete Quotation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {canCreateQuotation && (
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-3 w-3" />
                                Duplicate
                              </DropdownMenuItem>
                            )}
                            {(quotation.status === "APPROVED" && canCreateQuotation) && (
                              <DropdownMenuItem>
                                <GitBranch className="mr-2 h-3 w-3" />
                                Create Revision
                              </DropdownMenuItem>
                            )}
                            {(quotation.status === "ACCEPTED" && canCreateQuotation) && (
                              <DropdownMenuItem className="text-green-600">
                                <RefreshCw className="mr-2 h-3 w-3" />
                                Convert to Project
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          <span className="truncate">{quotation.clientName}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          <span>${quotation.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span 
                            className={`${
                              isExpired(quotation.validUntil, quotation.status) ? "text-red-600 font-medium" :
                              isExpiringsSoon(quotation.validUntil, quotation.status) ? "text-orange-600 font-medium" : ""
                            }`}
                          >
                            Valid: {format(new Date(quotation.validUntil), "MMM dd")}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          <span className="truncate">{quotation.salesperson}</span>
                        </div>
                        {quotation.tenderNumber && (
                          <div className="flex items-center">
                            <Briefcase className="w-3 h-3 mr-1" />
                            <span className="truncate">{quotation.tenderNumber}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {quotation.requiresApproval && quotation.status === "DRAFT" && (
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Approval Required
                          </Badge>
                        )}
                        {(isExpired(quotation.validUntil, quotation.status) || isExpiringsSoon(quotation.validUntil, quotation.status)) && (
                          <div className={`text-xs font-medium flex items-center ${
                            isExpired(quotation.validUntil, quotation.status) ? "text-red-600" : "text-orange-600"
                          }`}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {isExpired(quotation.validUntil, quotation.status) ? "Expired!" : "Expiring Soon"}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Quotations</CardTitle>
              <CardDescription>Complete list of quotations and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                        <div className="flex items-center">
                          Quotation Title
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("quotationNumber")}>
                        <div className="flex items-center">
                          Quotation No.
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("clientName")}>
                        <div className="flex items-center">
                          Client
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("totalAmount")}>
                        <div className="flex items-center">
                          Value
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("validUntil")}>
                        <div className="flex items-center">
                          Valid Until
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                        <div className="flex items-center">
                          Status
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Salesperson</TableHead>
                      <TableHead>Tender</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedQuotations.map((quotation) => (
                      <TableRow 
                        key={quotation.id} 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleQuotationClick(quotation.id)}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <Calculator className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium">{quotation.title}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-medium">{quotation.quotationNumber}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{quotation.clientName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">${quotation.totalAmount.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className={`text-sm ${
                                isExpired(quotation.validUntil, quotation.status) ? "text-red-600 font-medium" :
                                isExpiringSoon(quotation.validUntil, quotation.status) ? "text-orange-600 font-medium" : ""
                              }`}>
                                {format(new Date(quotation.validUntil), "MMM dd, yyyy")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(quotation.status)}>
                            {getStatusIcon(quotation.status)}
                            <span className="ml-1">{quotation.status.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {quotation.version > 1 && (
                            <Badge variant="outline" className="text-xs">
                              v{quotation.version}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{quotation.salesperson}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {quotation.tenderNumber && (
                            <div className="flex items-center space-x-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate max-w-32">{quotation.tenderNumber}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{format(new Date(quotation.createdAt), "MMM dd, yyyy")}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {quotation.requiresApproval && quotation.status === "DRAFT" && (
                              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                                <Clock className="w-3 h-3 mr-1" />
                              </Badge>
                            )}
                            {(isExpired(quotation.validUntil, quotation.status) || isExpiringSoon(quotation.validUntil, quotation.status)) && (
                              <div className={`text-xs font-medium flex items-center ${
                                isExpired(quotation.validUntil, quotation.status) ? "text-red-600" : "text-orange-600"
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
                                <DropdownMenuItem onClick={() => handleQuotationClick(quotation.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {(quotation.status === "DRAFT" && canCreateQuotation) && (
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Quotation
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <FileDown className="mr-2 h-4 w-4" />
                                  Export PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(quotation.status === "DRAFT" && canCreateQuotation) && (
                                  <DropdownMenuItem 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => openDeleteDialog(quotation)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Quotation
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {canCreateQuotation && (
                                  <DropdownMenuItem>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                )}
                                {(quotation.status === "APPROVED" && canCreateQuotation) && (
                                  <DropdownMenuItem>
                                    <GitBranch className="mr-2 h-4 w-4" />
                                    Create Revision
                                  </DropdownMenuItem>
                                )}
                                {(quotation.status === "ACCEPTED" && canCreateQuotation) && (
                                  <DropdownMenuItem className="text-green-600">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Convert to Project
                                  </DropdownMenuItem>
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
              
              {sortedQuotations.length === 0 && (
                <div className="text-center py-12">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No quotations found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search criteria or create a new quotation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.open} onOpenChange={(open) => setDeleteConfirmDialog({ open, quotation: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Delete Quotation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quotation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteConfirmDialog.quotation && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 my-4">
              <div className="space-y-2">
                <p className="font-medium">{deleteConfirmDialog.quotation.quotationNumber}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{deleteConfirmDialog.quotation.title}</p>
                <p className="text-xs text-gray-500">
                  Client: {deleteConfirmDialog.quotation.clientName} • 
                  Status: {deleteConfirmDialog.quotation.status} • 
                  Amount: SGD {typeof deleteConfirmDialog.quotation.totalAmount === 'number' 
                    ? deleteConfirmDialog.quotation.totalAmount.toFixed(2) 
                    : parseFloat(deleteConfirmDialog.quotation.totalAmount || '0').toFixed(2)}
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmDialog({ open: false, quotation: null })}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmDialog.quotation && handleDeleteQuotation(deleteConfirmDialog.quotation)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Quotation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

// Helper function - defined at component level to avoid undefined error
function isExpiringsSoon(validUntil: string, status: string) {
  const validDate = new Date(validUntil)
  const sevenDaysFromNow = addDays(new Date(), 7)
  return isBefore(validDate, sevenDaysFromNow) && isAfter(validDate, new Date()) && !["ACCEPTED", "CONVERTED", "REJECTED"].includes(status)
}
