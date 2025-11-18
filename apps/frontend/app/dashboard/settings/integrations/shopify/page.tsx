"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Settings,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  Zap,
  X,
} from "lucide-react"
import { useShopifyStatus, useShopifyConnect, useShopifyDisconnect, useShopifySync, useShopifySyncLogs } from "@/lib/hooks/useShopify"

export default function ShopifyIntegrationPage() {
  const [isConnectOpen, setIsConnectOpen] = useState(false)
  const [credentials, setCredentials] = useState({
    storeUrl: "",
    apiKey: "",
    apiSecret: "",
    accessToken: "",
  })

  // Hooks
  const { data: status, isLoading: statusLoading, error: statusError } = useShopifyStatus()
  const { data: logs, isLoading: logsLoading } = useShopifySyncLogs()
  const connectMutation = useShopifyConnect()
  const disconnectMutation = useShopifyDisconnect()
  const syncMutation = useShopifySync()

  const handleConnect = async () => {
    try {
      await connectMutation.mutateAsync(credentials)
      setIsConnectOpen(false)
      setCredentials({ storeUrl: "", apiKey: "", apiSecret: "", accessToken: "" })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleSync = async (type: string = "full") => {
    try {
      await syncMutation.mutateAsync({ type })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONNECTED: { variant: "default" as const, icon: CheckCircle, text: "Connected" },
      DISCONNECTED: { variant: "secondary" as const, icon: X, text: "Disconnected" },
      SYNCING: { variant: "default" as const, icon: RefreshCw, text: "Syncing" },
      ERROR: { variant: "destructive" as const, icon: AlertCircle, text: "Error" },
      PAUSED: { variant: "secondary" as const, icon: Clock, text: "Paused" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DISCONNECTED
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A"
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  if (statusLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shopify Integration</h1>
            <p className="text-muted-foreground">Connect and sync with your Shopify store</p>
          </div>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopify Integration</h1>
          <p className="text-muted-foreground">Connect and sync with your Shopify store</p>
        </div>
        {status?.connected ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSync("full")}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? "Syncing..." : "Sync All"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsConnectOpen(true)}>
            <Zap className="mr-2 h-4 w-4" />
            Connect Shopify
          </Button>
        )}
      </div>

      {/* Connection Form Dialog */}
      <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to Shopify</DialogTitle>
            <DialogDescription>
              Enter your Shopify store credentials to start syncing data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeUrl">Store URL</Label>
              <Input
                id="storeUrl"
                placeholder="mystore.myshopify.com"
                value={credentials.storeUrl}
                onChange={(e) => setCredentials({ ...credentials, storeUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your Shopify store URL (e.g., mystore.myshopify.com)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder="Your API key"
                value={credentials.apiKey}
                onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your Shopify API key (Client ID)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Your API secret"
                value={credentials.apiSecret}
                onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your Shopify API secret (Client Secret)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Your access token"
                value={credentials.accessToken}
                onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your Shopify Admin API access token
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={connectMutation.isPending || !credentials.storeUrl || !credentials.apiKey || !credentials.apiSecret || !credentials.accessToken}
            >
              {connectMutation.isPending ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status and Error Alerts */}
      {statusError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load Shopify status: {statusError.message}
          </AlertDescription>
        </Alert>
      )}

      {status?.last_error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Last error: {status.last_error}
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Form Card - Always Visible When Not Connected */}
      {!status?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Shopify Store</CardTitle>
            <CardDescription>
              Enter your Shopify credentials to start syncing products, orders, customers, and inventory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-storeUrl">Store URL</Label>
              <Input
                id="card-storeUrl"
                placeholder="mystore.myshopify.com"
                value={credentials.storeUrl}
                onChange={(e) => setCredentials({ ...credentials, storeUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-apiKey">API Key</Label>
              <Input
                id="card-apiKey"
                placeholder="Your API key"
                value={credentials.apiKey}
                onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-apiSecret">API Secret</Label>
              <Input
                id="card-apiSecret"
                type="password"
                placeholder="Your API secret"
                value={credentials.apiSecret}
                onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-accessToken">Access Token</Label>
              <Input
                id="card-accessToken"
                type="password"
                placeholder="Your access token"
                value={credentials.accessToken}
                onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
              />
            </div>
            <Button
              onClick={handleConnect}
              disabled={connectMutation.isPending || !credentials.storeUrl || !credentials.apiKey || !credentials.apiSecret || !credentials.accessToken}
              className="w-full"
            >
              {connectMutation.isPending ? "Connecting..." : "Connect Shopify"}
            </Button>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">How to get your credentials:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to Shopify Admin → Settings → Apps and sales channels</li>
                <li>Click "Develop apps" → "Create an app"</li>
                <li>Configure API scopes and install the app</li>
                <li>Copy your API key, API secret, and access token</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {getStatusBadge(status?.status || "DISCONNECTED")}
              </div>
              {status?.connected && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Store</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{status.shop_name || status.store_url}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`https://${status.store_url}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Sync</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(status.last_sync)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Error Count</span>
                    <span className="text-sm">{status.error_count}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sync Settings */}
          {status?.connected && (
            <Card>
              <CardHeader>
                <CardTitle>Sync Settings</CardTitle>
                <CardDescription>
                  Configure what data to sync from Shopify
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Products</p>
                      <p className="text-xs text-muted-foreground">
                        {status.sync_settings?.products ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Orders</p>
                      <p className="text-xs text-muted-foreground">
                        {status.sync_settings?.orders ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Customers</p>
                      <p className="text-xs text-muted-foreground">
                        {status.sync_settings?.customers ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Inventory</p>
                      <p className="text-xs text-muted-foreground">
                        {status.sync_settings?.inventory ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          {status?.connected ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Full Sync</CardTitle>
                  <CardDescription>Sync all data from Shopify</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => handleSync("full")}
                    disabled={syncMutation.isPending}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    Sync All
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <CardDescription>Sync products and variants</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleSync("products")}
                    disabled={syncMutation.isPending}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Sync Products
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <CardDescription>Sync orders and line items</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleSync("orders")}
                    disabled={syncMutation.isPending}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Sync Orders
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Customers</CardTitle>
                  <CardDescription>Sync customer data</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleSync("customers")}
                    disabled={syncMutation.isPending}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Sync Customers
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Shopify Connection</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Connect to your Shopify store to start syncing data
                </p>
                <Button onClick={() => setIsConnectOpen(true)}>
                  <Zap className="mr-2 h-4 w-4" />
                  Connect Shopify
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Logs</CardTitle>
              <CardDescription>
                View recent synchronization activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : logs?.logs?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Failed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.sync_type}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.status === "SUCCESS"
                                ? "default"
                                : log.status === "ERROR"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(log.started_at)}</TableCell>
                        <TableCell>{formatDuration(log.duration)}</TableCell>
                        <TableCell>{log.items_processed}</TableCell>
                        <TableCell>{log.items_created}</TableCell>
                        <TableCell>{log.items_updated}</TableCell>
                        <TableCell>{log.items_failed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No sync logs found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
