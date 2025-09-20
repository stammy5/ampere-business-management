
'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Download,
  Building2,
  Calendar,
  Wrench
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface ServiceContract {
  id: string
  contractNo: string
  serviceType: string
  frequency: string
  startDate: string
  endDate: string
  filePath?: string
  createdAt: string
  client: {
    id: string
    name: string
    clientNumber: string
    email: string
    phone: string
  }
  project?: {
    id: string
    projectNumber: string
    name: string
    status: string
  }
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  _count: {
    jobs: number
  }
}

export default function ServiceContractsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [contracts, setContracts] = useState<ServiceContract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")

  useEffect(() => {
    fetchContracts()
  }, [serviceTypeFilter, clientFilter])

  const fetchContracts = async () => {
    try {
      const params = new URLSearchParams()
      if (serviceTypeFilter !== "all") params.append('serviceType', serviceTypeFilter)
      if (clientFilter !== "all") params.append('clientId', clientFilter)

      const response = await fetch(`/api/servicing/contracts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      } else {
        console.error('Failed to fetch contracts')
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Are you sure you want to delete this service contract? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/servicing/contracts/${contractId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setContracts(contracts.filter(contract => contract.id !== contractId))
      } else {
        alert('Failed to delete contract')
      }
    } catch (error) {
      console.error('Error deleting contract:', error)
      alert('Error deleting contract')
    }
  }

  const filteredContracts = contracts.filter(contract =>
    contract.contractNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'Electrical': return 'bg-yellow-100 text-yellow-800'
      case 'Mechanical': return 'bg-blue-100 text-blue-800'
      case 'Plumbing': return 'bg-cyan-100 text-cyan-800'
      case 'Sanitary': return 'bg-green-100 text-green-800'
      case 'Other': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'Monthly': return 'bg-red-100 text-red-800'
      case 'Quarterly': return 'bg-orange-100 text-orange-800'
      case 'BiAnnual': return 'bg-blue-100 text-blue-800'
      case 'Annual': return 'bg-green-100 text-green-800'
      case 'Custom': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const userRole = session?.user?.role
  const canCreate = ["SUPERADMIN", "PROJECT_MANAGER"].includes(userRole || "")
  const canEdit = ["SUPERADMIN", "PROJECT_MANAGER"].includes(userRole || "")
  const canDelete = ["SUPERADMIN"].includes(userRole || "")

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Service Contracts
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage ongoing service contracts and maintenance schedules
            </p>
          </div>
          {canCreate && (
            <Link href="/servicing/contracts/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Contract
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Service Types</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Sanitary">Sanitary</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {/* In a real app, you'd populate this with actual clients */}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setServiceTypeFilter("all")
                  setClientFilter("all")
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Service Contracts ({filteredContracts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract No.</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-mono font-medium">
                        {contract.contractNo}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.client.name}</p>
                          <p className="text-sm text-gray-500">{contract.client.clientNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.project ? (
                          <div>
                            <p className="font-medium">{contract.project.name}</p>
                            <p className="text-sm text-gray-500">{contract.project.projectNumber}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">No Project</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getServiceTypeColor(contract.serviceType)}>
                          {contract.serviceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getFrequencyColor(contract.frequency)}>
                          {contract.frequency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(contract.startDate), 'MMM dd, yyyy')}</p>
                          <p className="text-gray-500">
                            to {format(new Date(contract.endDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {contract._count.jobs} jobs
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {contract.createdBy.firstName} {contract.createdBy.lastName}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/servicing/contracts/${contract.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem onClick={() => router.push(`/servicing/contracts/${contract.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Contract
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/servicing/jobs?contractId=${contract.id}`)}>
                              <Wrench className="mr-2 h-4 w-4" />
                              View Jobs
                            </DropdownMenuItem>
                            {contract.filePath && (
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download Contract
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteContract(contract.id)}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete Contract
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredContracts.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No service contracts found</p>
                  {canCreate && (
                    <Link href="/servicing/contracts/create">
                      <Button className="mt-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Contract
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
