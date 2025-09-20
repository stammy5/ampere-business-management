
'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  CreditCard, 
  FileText, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  PieChart,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ArrowUpDown,
  MoreHorizontal
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
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface FinancialKPI {
  title: string
  value: string
  change: number
  trend: "up" | "down" | "neutral"
  description: string
  icon: any
  color: string
}

interface OutstandingItem {
  id: string
  type: "client" | "vendor"
  reference: string
  entity: string
  amount: number
  dueDate: string
  overdue: boolean
  daysPastDue?: number
  status: string
}

interface RecentTransaction {
  id: string
  type: "payment_received" | "payment_sent" | "invoice_created" | "po_issued"
  reference: string
  entity: string
  amount: number
  date: string
  status: string
}

export default function FinancePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("current_month")
  const [kpis, setKpis] = useState<FinancialKPI[]>([])
  const [outstandingReceivables, setOutstandingReceivables] = useState<OutstandingItem[]>([])
  const [outstandingPayables, setOutstandingPayables] = useState<OutstandingItem[]>([])
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [sortField, setSortField] = useState<string>("reference")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const userRole = session?.user?.role

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        // Initialize with empty data - replace with actual API calls when endpoints are ready
        setKpis([])
        setOutstandingReceivables([])
        setOutstandingPayables([])
        setRecentTransactions([])
        setLoading(false)
      } catch (error) {
        console.error('Error fetching financial data:', error)
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [selectedPeriod])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortData = <T extends Record<string, any>>(data: T[]) => {
    return data.sort((a, b) => {
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
  }

  const getStatusColor = (status: string, type?: string) => {
    switch (status) {
      case "SENT":
      case "ISSUED":
      case "APPROVED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "PAID":
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "OVERDUE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "PENDING_FINANCE_APPROVAL":
      case "PENDING_PROJECT_APPROVAL":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "payment_received":
        return <ArrowDownRight className="w-4 h-4 text-green-600" />
      case "payment_sent":
        return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case "invoice_created":
        return <FileText className="w-4 h-4 text-blue-600" />
      case "po_issued":
        return <ShoppingCart className="w-4 h-4 text-purple-600" />
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />
    }
  }

  const canAccessFinance = ["SUPERADMIN", "FINANCE", "PROJECT_MANAGER"].includes(userRole || "")
  const canApprove = ["SUPERADMIN", "FINANCE"].includes(userRole || "")

  const handleReceivableClick = (item: OutstandingItem) => {
    if (item.type === "client") {
      router.push(`/finance/client-invoices/${item.id}`)
    }
  }

  const handlePayableClick = (item: OutstandingItem) => {
    if (item.type === "vendor") {
      router.push(`/finance/vendor-invoices/${item.id}`)
    }
  }

  const handleTransactionClick = (transaction: RecentTransaction) => {
    switch (transaction.type) {
      case "payment_received":
      case "payment_sent":
        router.push(`/finance/payments/${transaction.id}`)
        break
      case "invoice_created":
        router.push(`/finance/client-invoices/${transaction.id}`)
        break
      case "po_issued":
        router.push(`/finance/purchase-orders/${transaction.id}`)
        break
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
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

  if (!canAccessFinance) {
    return (
      <MainLayout>
        <div className="p-6">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You don't have permission to access the Finance module.
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Comprehensive financial management, invoicing, and payment tracking
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="current_quarter">Current Quarter</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Xero
              </Button>
            </div>
          </div>
        </div>

        {/* Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {kpis.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className={`flex items-center text-xs ${
                  kpi.trend === "up" ? "text-green-600" : 
                  kpi.trend === "down" ? "text-red-600" : "text-gray-600"
                }`}>
                  {kpi.trend === "up" ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : kpi.trend === "down" ? (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  ) : null}
                  {Math.abs(kpi.change)}% from last period
                </div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/finance/client-invoices/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center p-4">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium">Create Invoice</div>
                  <div className="text-sm text-gray-500">Bill clients for work done</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/finance/purchase-orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center p-4">
                <ShoppingCart className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className="font-medium">Purchase Orders</div>
                  <div className="text-sm text-gray-500">Manage vendor orders</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/finance/vendor-invoices">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center p-4">
                <Upload className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="font-medium">Process Bills</div>
                  <div className="text-sm text-gray-500">Review vendor invoices</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/finance/payments">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center p-4">
                <CreditCard className="h-8 w-8 text-indigo-600 mr-3" />
                <div>
                  <div className="font-medium">Payments</div>
                  <div className="text-sm text-gray-500">Process payments</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="receivables">Receivables</TabsTrigger>
            <TabsTrigger value="payables">Payables</TabsTrigger>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cash Flow Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Cash Flow Trend
                  </CardTitle>
                  <CardDescription>
                    Monthly cash inflow vs outflow for the last 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Cash Flow Chart</p>
                    <p className="text-sm">Integration with charts library required</p>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="mr-2 h-5 w-5" />
                    Revenue by Client
                  </CardTitle>
                  <CardDescription>
                    Revenue distribution across major clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Revenue Breakdown Chart</p>
                    <p className="text-sm">Integration with charts library required</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Financial Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Financial Activity</CardTitle>
                <CardDescription>Latest transactions and financial events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="font-medium">{transaction.reference}</div>
                          <div className="text-sm text-gray-500">{transaction.entity}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${transaction.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(transaction.date), "MMM dd, HH:mm")}
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receivables" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Outstanding Receivables</CardTitle>
                    <CardDescription>
                      Client invoices pending payment
                    </CardDescription>
                  </div>
                  <Link href="/finance/client-invoices">
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outstandingReceivables.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleReceivableClick(item)}
                    >
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="font-medium">{item.reference}</div>
                          <div className="text-sm text-gray-500">{item.entity}</div>
                          <div className="text-xs text-gray-400">
                            Due: {format(new Date(item.dueDate), "MMM dd, yyyy")}
                            {item.overdue && (
                              <span className="text-red-600 ml-2">
                                ({item.daysPastDue} days overdue)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-lg">
                          ${item.amount.toLocaleString()}
                        </div>
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payables" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Outstanding Payables</CardTitle>
                    <CardDescription>
                      Vendor invoices pending payment
                    </CardDescription>
                  </div>
                  <Link href="/finance/vendor-invoices">
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outstandingPayables.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handlePayableClick(item)}
                    >
                      <div className="flex items-center space-x-3">
                        <Users className="h-8 w-8 text-green-600" />
                        <div>
                          <div className="font-medium">{item.reference}</div>
                          <div className="text-sm text-gray-500">{item.entity}</div>
                          <div className="text-xs text-gray-400">
                            Due: {format(new Date(item.dueDate), "MMM dd, yyyy")}
                            {item.overdue && (
                              <span className="text-red-600 ml-2">
                                ({item.daysPastDue} days overdue)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-lg">
                          ${item.amount.toLocaleString()}
                        </div>
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase-orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Purchase Orders</CardTitle>
                    <CardDescription>
                      Latest purchase orders and their status
                    </CardDescription>
                  </div>
                  <Link href="/finance/purchase-orders">
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders</h3>
                  <p className="text-gray-500 text-center mb-6">
                    You haven't created any purchase orders yet.<br />
                    Start by creating your first purchase order.
                  </p>
                  <Link href="/finance/purchase-orders/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Purchase Order
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      All financial transactions and activities
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.reference}</div>
                          <div className="text-sm text-gray-500">{transaction.entity}</div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(transaction.date), "MMM dd, yyyy HH:mm")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-lg">
                          {transaction.type.includes('sent') ? '-' : '+'}${transaction.amount.toLocaleString()}
                        </div>
                        <Badge variant="outline" className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            {canApprove ? (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Financial Approvals</CardTitle>
                  <CardDescription>
                    Items requiring your approval before processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12">
                    <CheckCircle className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
                    <p className="text-gray-500 text-center">
                      All items have been processed. New requests will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Approval Access</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You don't have permission to approve financial items.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
