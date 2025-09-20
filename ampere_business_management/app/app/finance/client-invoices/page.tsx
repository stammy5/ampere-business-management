
'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  FileText,
  Building2,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Plus,
  Download,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Send,
  Edit
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
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ClientInvoice {
  id: string
  invoiceNumber: string
  client: {
    id: string
    name: string
    companyName: string
    email?: string
  }
  project: {
    id: string
    name: string
    projectNumber: string
  } | null
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  issueDate: string
  dueDate: string
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentTerms?: string
  description: string
  notes?: string
  lastSentDate?: string
  paidDate?: string
  isOverdue: boolean
  daysPastDue?: number
  createdAt: string
}

const statusConfig = {
  DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Edit, label: 'Draft' },
  SENT: { color: 'bg-blue-100 text-blue-700', icon: Send, label: 'Sent' },
  VIEWED: { color: 'bg-purple-100 text-purple-700', icon: Eye, label: 'Viewed' },
  PAID: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Paid' },
  OVERDUE: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Overdue' },
  CANCELLED: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Cancelled' },
}

export default function ClientInvoicesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterClient, setFilterClient] = useState("all")
  const [sortField, setSortField] = useState("issueDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>([])

  const userRole = session?.user?.role
  const canAccessFinance = ["SUPERADMIN", "FINANCE", "PROJECT_MANAGER"].includes(userRole || "")
  const canCreateInvoices = ["SUPERADMIN", "PROJECT_MANAGER"].includes(userRole || "")

  useEffect(() => {
    setLoading(false)
    // TODO: Fetch client invoices from API when endpoint is ready
    setClientInvoices([])
  }, [])

  const handleInvoiceClick = (invoiceId: string) => {
    router.push(`/finance/client-invoices/${invoiceId}`)
  }

  const handleCreateInvoice = () => {
    router.push('/finance/client-invoices/new')
  }

  if (!canAccessFinance) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600 mt-2">You don't have permission to access client invoices.</p>
          </div>
        </div>
      </MainLayout>
    )
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

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null
    const Icon = config.icon
    return <Icon className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    return config?.color || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    return config?.label || status
  }

  const totalAmount = clientInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const outstandingAmount = clientInvoices
    .filter(invoice => ['SENT', 'VIEWED', 'OVERDUE'].includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0)

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/finance">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Finance
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Invoices</h1>
              <p className="text-gray-600">Create, send and track client invoices</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {canCreateInvoices && (
              <Button onClick={handleCreateInvoice}>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold">{clientInvoices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">${totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding</p>
                  <p className="text-2xl font-bold">${outstandingAmount.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">
                    {clientInvoices.filter(invoice => invoice.status === 'OVERDUE').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search invoices, clients..."
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
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="VIEWED">Viewed</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Client Invoices Content */}
        <Card>
          <CardHeader>
            <CardTitle>Client Invoices ({clientInvoices.length})</CardTitle>
            <CardDescription>
              Create, send and track invoices to clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Client Invoices</h3>
                <p className="text-gray-500 mb-4">
                  You haven't created any client invoices yet.<br />
                  Start by creating your first invoice.
                </p>
                {canCreateInvoices && (
                  <Button onClick={handleCreateInvoice}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Invoice rows would go here when data is available */}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
