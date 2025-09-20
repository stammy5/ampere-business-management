
'use client'

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SalesPersonnelSelect } from "@/components/ui/sales-personnel-select"
import { NASLinkInput } from "@/components/ui/nas-link"
import { CalendarIcon, ArrowLeft, Save, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Client {
  id: string
  name: string
  email?: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface TenderFormData {
  title: string
  description?: string
  clientId: string
  estimatedValue?: number
  submissionDeadline: Date
  openDate: Date
  closeDate?: Date
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  requirements?: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  location?: string
  category: 'CONSTRUCTION' | 'ENGINEERING' | 'SUPPLY' | 'CONSULTING' | 'MAINTENANCE' | 'INSTALLATION' | 'GENERAL'
  nasDocumentPath?: string
  assignedToId?: string
  salespersonId?: string
}

export default function NewTenderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [openDateOpen, setOpenDateOpen] = useState(false)
  const [submissionDateOpen, setSubmissionDateOpen] = useState(false)
  const [closeDateOpen, setCloseDateOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TenderFormData>({
    defaultValues: {
      priority: 'MEDIUM',
      category: 'GENERAL',
      openDate: new Date(),
      submissionDeadline: new Date()
    }
  })

  // Register required fields that are controlled by Select components
  register("clientId", { required: "Client selection is required" })
  register("submissionDeadline", { required: "Submission deadline is required" })

  const openDate = watch('openDate')
  const submissionDeadline = watch('submissionDeadline')
  const closeDate = watch('closeDate')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const clientsResponse = await fetch('/api/clients?limit=100')
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          setClients(clientsData.clients || [])
        }

        // Fetch users for assignment
        const usersResponse = await fetch('/api/users')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const onSubmit = async (data: TenderFormData) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/tenders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue.toString()) : null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create tender')
      }

      const tender = await response.json()
      toast.success('Tender created successfully!')
      router.push('/tenders')
    } catch (error) {
      console.error('Error creating tender:', error)
      toast.error('Failed to create tender. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tenders
            </Button>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Tender</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Add a new tender opportunity to track and manage
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tender Information</CardTitle>
                  <CardDescription>
                    Enter the basic details of the tender opportunity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Tender Title *</Label>
                    <Input
                      id="title"
                      {...register("title", { required: "Title is required" })}
                      placeholder="Enter tender title"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Enter tender description and overview"
                      rows={4}
                    />
                  </div>

                  {/* Client */}
                  <div className="space-y-2">
                    <Label>Client *</Label>
                    <Select onValueChange={(value) => setValue("clientId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.clientId && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Client selection is required
                      </p>
                    )}
                  </div>

                  {/* Estimated Value */}
                  <div className="space-y-2">
                    <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                    <Input
                      id="estimatedValue"
                      type="number"
                      step="0.01"
                      {...register("estimatedValue", { 
                        min: { value: 0, message: "Value must be positive" }
                      })}
                      placeholder="Enter estimated project value"
                    />
                    {errors.estimatedValue && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.estimatedValue.message}
                      </p>
                    )}
                  </div>

                  {/* Category and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        defaultValue="GENERAL"
                        onValueChange={(value) => setValue("category", value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GENERAL">General</SelectItem>
                          <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                          <SelectItem value="ENGINEERING">Engineering</SelectItem>
                          <SelectItem value="SUPPLY">Supply</SelectItem>
                          <SelectItem value="CONSULTING">Consulting</SelectItem>
                          <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                          <SelectItem value="INSTALLATION">Installation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select 
                        defaultValue="MEDIUM"
                        onValueChange={(value) => setValue("priority", value as any)}
                      >
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
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      {...register("location")}
                      placeholder="Enter project location"
                    />
                  </div>

                  {/* Requirements */}
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements & Specifications</Label>
                    <Textarea
                      id="requirements"
                      {...register("requirements")}
                      placeholder="Enter detailed requirements and specifications"
                      rows={4}
                    />
                  </div>

                  {/* NAS Document Path */}
                  <NASLinkInput
                    value={watch("nasDocumentPath") || ""}
                    onChange={(value) => setValue("nasDocumentPath", value)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Dates Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Important Dates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Open Date */}
                  <div className="space-y-2">
                    <Label>Open Date *</Label>
                    <Popover open={openDateOpen} onOpenChange={setOpenDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !openDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {openDate ? format(openDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={openDate}
                          onSelect={(date) => {
                            setValue("openDate", date || new Date())
                            setOpenDateOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Submission Deadline */}
                  <div className="space-y-2">
                    <Label>Submission Deadline *</Label>
                    <Popover open={submissionDateOpen} onOpenChange={setSubmissionDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !submissionDeadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {submissionDeadline ? format(submissionDeadline, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={submissionDeadline}
                          onSelect={(date) => {
                            setValue("submissionDeadline", date || new Date())
                            setSubmissionDateOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.submissionDeadline && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Submission deadline is required
                      </p>
                    )}
                  </div>

                  {/* Close Date */}
                  <div className="space-y-2">
                    <Label>Close Date (Optional)</Label>
                    <Popover open={closeDateOpen} onOpenChange={setCloseDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !closeDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {closeDate ? format(closeDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={closeDate}
                          onSelect={(date) => {
                            setValue("closeDate", date)
                            setCloseDateOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      {...register("contactPerson")}
                      placeholder="Primary contact name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...register("contactEmail")}
                      placeholder="contact@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      {...register("contactPhone")}
                      placeholder="+65 1234 5678"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assigned To</Label>
                    <Select onValueChange={(value) => setValue("assignedToId", value === "unassigned" ? undefined : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <SalesPersonnelSelect
                      value={watch("salespersonId") || ""}
                      onValueChange={(value) => setValue("salespersonId", value || undefined)}
                      label="Sales Personnel"
                      placeholder="Select sales personnel"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col space-y-3">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || loading}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting || loading ? 'Creating...' : 'Create Tender'}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.back()}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
