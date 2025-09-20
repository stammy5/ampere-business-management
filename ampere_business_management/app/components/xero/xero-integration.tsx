
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Download, 
  Upload,
  Loader2,
  AlertTriangle,
  Building2,
  Users,
  FileText,
  DollarSign
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface XeroStatus {
  connected: boolean
  organisation?: {
    name: string
    shortCode: string
    countryCode: string
  }
  lastSync?: string
  error?: string
}

interface SyncResult {
  success: boolean
  message: string
  results?: any[]
}

export function XeroIntegration() {
  const [status, setStatus] = useState<XeroStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  // Sync settings
  const [autoSync, setAutoSync] = useState(false)
  const [syncFrequency, setSyncFrequency] = useState('daily')

  useEffect(() => {
    fetchXeroStatus()
    // Check URL params for auth callback status
    const urlParams = new URLSearchParams(window.location.search)
    const xeroStatus = urlParams.get('xero')
    const message = urlParams.get('message')
    
    if (xeroStatus === 'success') {
      toast.success('Xero integration successful!')
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
      fetchXeroStatus()
    } else if (xeroStatus === 'error' && message) {
      toast.error(`Xero integration failed: ${decodeURIComponent(message)}`)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const fetchXeroStatus = async () => {
    try {
      const response = await fetch('/api/xero/sync')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch Xero status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setAuthLoading(true)
    try {
      const response = await fetch('/api/xero/auth')
      if (response.ok) {
        const data = await response.json()
        if (data.authUrl) {
          // Redirect to Xero authorization
          window.location.href = data.authUrl
        }
      } else {
        toast.error('Failed to start Xero authorization')
      }
    } catch (error) {
      console.error('Failed to connect to Xero:', error)
      toast.error('Failed to connect to Xero')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSync = async (syncType: string, direction: string) => {
    setSyncing(true)
    try {
      const response = await fetch('/api/xero/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType, direction }),
      })

      if (response.ok) {
        const data: SyncResult = await response.json()
        if (data.success) {
          toast.success(data.message)
          fetchXeroStatus() // Refresh status
        } else {
          toast.error(data.message)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync failed:', error)
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleTestConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/xero/test')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        if (data.connected) {
          toast.success('Xero connection is working!')
        } else {
          toast.error(data.error || 'Connection test failed')
        }
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      toast.error('Connection test failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Xero Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading Xero status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              <div>
                <CardTitle>Xero Integration</CardTitle>
                <CardDescription>
                  Sync your financial data between your business management system and Xero
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {status.connected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <XCircle className="mr-1 h-3 w-3" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status.connected ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Connect your Xero account to automatically sync clients, vendors, invoices, and payments.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleConnect}
                disabled={authLoading}
                className="w-full"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connect to Xero
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {status.organisation && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-green-900">Connected Organisation</h4>
                    <p className="text-sm text-green-700">
                      {status.organisation.name} ({status.organisation.countryCode})
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {status.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{status.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Controls Card */}
      {status.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Data Synchronization</CardTitle>
            <CardDescription>
              Sync your business data between the app and Xero
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Manual Sync Controls */}
            <div className="space-y-4">
              <h4 className="font-medium">Manual Sync</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleSync('contacts', 'from_xero')}
                  disabled={syncing}
                  className="flex items-center justify-center"
                >
                  {syncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Import Contacts from Xero
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSync('invoices', 'from_xero')}
                  disabled={syncing}
                  className="flex items-center justify-center"
                >
                  {syncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Import Invoices from Xero
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSync('contacts', 'to_xero')}
                  disabled={syncing}
                  className="flex items-center justify-center"
                >
                  {syncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Export Contacts to Xero
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSync('invoices', 'to_xero')}
                  disabled={syncing}
                  className="flex items-center justify-center"
                >
                  {syncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Export Invoices to Xero
                </Button>
              </div>

              <Button
                onClick={() => handleSync('all', 'both')}
                disabled={syncing}
                className="w-full"
              >
                {syncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Full Sync (Both Directions)
                  </>
                )}
              </Button>
            </div>

            {/* Auto Sync Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Automatic Sync Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync">Enable Auto Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync data at regular intervals
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                />
              </div>

              {autoSync && (
                <div className="space-y-2">
                  <Label>Sync Frequency</Label>
                  <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Statistics Card */}
      {status.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Integration Statistics</CardTitle>
            <CardDescription>
              Overview of your Xero integration data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">-</div>
                <div className="text-sm text-blue-700">Contacts Synced</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <FileText className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">-</div>
                <div className="text-sm text-green-700">Invoices Synced</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">-</div>
                <div className="text-sm text-purple-700">Payments Synced</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <RefreshCw className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-900">
                  {status.lastSync ? 'Today' : 'Never'}
                </div>
                <div className="text-sm text-orange-700">Last Sync</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
