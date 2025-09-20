
'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  User,
  FolderOpen,
  FileText,
  Globe,
  ArrowUpDown,
  Building2,
  CreditCard,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"

interface Client {
  id: string
  clientNumber?: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country: string
  postalCode?: string | null
  contactPerson?: string | null
  companyReg?: string | null
  website?: string | null
  notes?: string | null
  clientType: string
  // Bank Information
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountName?: string | null
  bankSwiftCode?: string | null
  bankAddress?: string | null
  isActive: boolean
  createdAt: string
  _count: {
    projects: number
    clientInvoices: number
    legacyInvoices: number
  }
}

const clientSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("Singapore"),
  postalCode: z.string().optional(),
  contactPerson: z.string().optional(),
  companyReg: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  clientType: z.string().default("ENTERPRISE"),
  // Bank Information
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankSwiftCode: z.string().optional(),
  bankAddress: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

export function ClientsClient() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [sortField, setSortField] = useState<keyof Client>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "Singapore",
      postalCode: "",
      contactPerson: "",
      companyReg: "",
      website: "",
      notes: "",
      clientType: "ENTERPRISE",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
      bankSwiftCode: "",
      bankAddress: "",
    },
  })

  const fetchClients = async () => {
    try {
      const searchParam = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""
      const response = await fetch(`/api/clients${searchParam}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch clients")
      }

      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast.error("Failed to load clients")
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [searchTerm])

  const handleSubmit = async (data: ClientFormData) => {
    try {
      const cleanedData = {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        contactPerson: data.contactPerson || null,
        companyReg: data.companyReg || null,
        website: data.website || null,
        notes: data.notes || null,
        clientType: data.clientType || "ENTERPRISE",
      }

      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients"
      const method = editingClient ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      })

      if (!response.ok) {
        let errorMessage = "Failed to save client"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          // If response is not JSON, use response text
          const errorText = await response.text()
          console.error("Non-JSON error response:", errorText)
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      toast.success(editingClient ? "Client updated successfully" : "Client created successfully")
      setIsDialogOpen(false)
      setEditingClient(null)
      form.reset()
      fetchClients()
    } catch (error) {
      console.error("Error saving client:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save client")
    }
  }

  const handleSort = (field: keyof Client) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedClients = clients
    .filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === "all" || 
                           (filterStatus === "active" && client.isActive) ||
                           (filterStatus === "inactive" && !client.isActive)
      
      const matchesType = filterType === "all" || client.clientType === filterType
      
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
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

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    form.reset({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      country: client.country,
      postalCode: client.postalCode || "",
      contactPerson: client.contactPerson || "",
      companyReg: client.companyReg || "",
      website: client.website || "",
      notes: client.notes || "",
      clientType: client.clientType,
      bankName: client.bankName || "",
      bankAccountNumber: client.bankAccountNumber || "",
      bankAccountName: client.bankAccountName || "",
      bankSwiftCode: client.bankSwiftCode || "",
      bankAddress: client.bankAddress || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) {
      return
    }

    setIsDeleting(clientId)
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete client")
      }

      toast.success("Client deleted successfully")
      fetchClients()
    } catch (error) {
      console.error("Error deleting client:", error)
      toast.error("Failed to delete client")
    } finally {
      setIsDeleting(null)
    }
  }

  const handleAddNew = () => {
    setEditingClient(null)
    form.reset()
    setIsDialogOpen(true)
  }

  const handleClientClick = (clientId: string) => {
    router.push(`/clients/${clientId}`)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statsData = [
    {
      title: "Total Clients",
      value: clients.length,
      description: "Registered clients",
      icon: Building2
    },
    {
      title: "Active Clients",
      value: clients.filter(c => c.isActive).length,
      description: "Currently active",
      icon: CheckCircle
    },
    {
      title: "Total Projects",
      value: clients.reduce((sum, c) => sum + c._count.projects, 0),
      description: "Active projects",
      icon: FolderOpen
    },
    {
      title: "Total Invoices",
      value: clients.reduce((sum, c) => sum + c._count.clientInvoices + c._count.legacyInvoices, 0),
      description: "Total invoices",
      icon: FileText
    }
  ]

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case "ENTERPRISE":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "SME":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "GOVERNMENT":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "INDIVIDUAL":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getClientTypeDisplay = (type: string) => {
    switch (type) {
      case "ENTERPRISE":
        return "Enterprise"
      case "SME":
        return "SME" 
      case "GOVERNMENT":
        return "Government"
      case "INDIVIDUAL":
        return "Individual"
      default:
        return type
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Client Management</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your client relationships and information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Edit Client" : "Add New Client"}
              </DialogTitle>
              <DialogDescription>
                {editingClient ? "Update client information." : "Create a new client profile."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="ABC Corporation"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="clientType">Client Type</Label>
                    <Select value={form.watch("clientType")} onValueChange={(value) => form.setValue("clientType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                        <SelectItem value="SME">SME</SelectItem>
                        <SelectItem value="GOVERNMENT">Government</SelectItem>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      {...form.register("contactPerson")}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyReg">Company Registration</Label>
                    <Input
                      id="companyReg"
                      {...form.register("companyReg")}
                      placeholder="201234567A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="contact@company.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      {...form.register("phone")}
                      placeholder="+65 1234 5678"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    {...form.register("website")}
                    placeholder="https://company.com"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address Information</h3>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...form.register("address")}
                    placeholder="123 Business Street"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...form.register("city")}
                      placeholder="Singapore"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      {...form.register("state")}
                      placeholder="Singapore"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      {...form.register("postalCode")}
                      placeholder="123456"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Bank Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      {...form.register("bankName")}
                      placeholder="DBS Bank Ltd"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountName">Account Name</Label>
                    <Input
                      id="bankAccountName"
                      {...form.register("bankAccountName")}
                      placeholder="ABC Corporation"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankAccountNumber">Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      {...form.register("bankAccountNumber")}
                      placeholder="123-456789-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankSwiftCode">SWIFT Code</Label>
                    <Input
                      id="bankSwiftCode"
                      {...form.register("bankSwiftCode")}
                      placeholder="DBSSSGSG"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bankAddress">Bank Address</Label>
                  <Input
                    id="bankAddress"
                    {...form.register("bankAddress")}
                    placeholder="12 Marina Boulevard, Singapore 018982"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Additional information about the client..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingClient(null)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  {editingClient ? "Update Client" : "Create Client"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <CardTitle>Clients Directory</CardTitle>
              <CardDescription>Search and manage your client relationships</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  <SelectItem value="SME">SME</SelectItem>
                  <SelectItem value="GOVERNMENT">Government</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("clientNumber")}>
                    <div className="flex items-center">
                      Client #
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Company Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("contactPerson")}>
                    <div className="flex items-center">
                      Contact Person
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                    <div className="flex items-center">
                      Email
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("clientType")}>
                    <div className="flex items-center">
                      Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Bank Info</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedClients.map((client) => (
                  <TableRow 
                    key={client.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleClientClick(client.id)}
                  >
                    <TableCell>
                      <div className="font-mono text-sm font-medium text-blue-600">
                        {client.clientNumber || 'AE-C-???'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          {client.companyReg && (
                            <div className="text-sm text-muted-foreground">{client.companyReg}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.contactPerson && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{client.contactPerson}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getClientTypeColor(client.clientType)}>
                        {getClientTypeDisplay(client.clientType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(client.city || client.country) && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {[client.city, client.country].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.bankName ? (
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Available</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-muted-foreground">Not Set</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <FolderOpen className="h-4 w-4 text-blue-600" />
                          <span>{client._count.projects}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span>{client._count.clientInvoices + client._count.legacyInvoices}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.isActive ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
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
                          <DropdownMenuItem onClick={() => handleEdit(client)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleClientClick(client.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            View Projects
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(client.id)}
                            disabled={isDeleting === client.id}
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

          {filteredAndSortedClients.length === 0 && !loading && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No clients found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filterType !== "all" || filterStatus !== "all" 
                  ? "Try adjusting your search criteria or add a new client."
                  : "Get started by adding your first client."
                }
              </p>
              {!searchTerm && filterType === "all" && filterStatus === "all" && (
                <Button onClick={handleAddNew} className="mt-4 bg-red-600 hover:bg-red-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Client
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
