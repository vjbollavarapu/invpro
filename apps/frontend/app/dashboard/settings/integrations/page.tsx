"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShoppingBag,
  Package,
  ShoppingCart,
  AlertCircle,
  Clock,
  LinkIcon,
} from "lucide-react"

export default function IntegrationsPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const [credentials, setCredentials] = useState({
    storeUrl: "",
    apiKey: "",
    apiSecret: "",
    accessToken: "",
  })

  const [autoSync, setAutoSync] = useState({
    products: true,
    inventory: true,
    orders: true,
  })

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch("/api/integrations/shopify/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeUrl: credentials.storeUrl,
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          accessToken: credentials.accessToken,
        }),
      })

      if (response.ok) {
        setIsConnected(true)
        setLastSync(new Date())
      }
    } catch (error) {
      console.error("Connection failed:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setCredentials({ storeUrl: "", apiKey: "", apiSecret: "", accessToken: "" })
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/integrations/shopify/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      })

      if (response.ok) {
        setLastSync(new Date())
      }
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Never"
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">Connect and manage external platform integrations</p>
      </div>

      {/* Shopify Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#95BF47] flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Shopify
                  {isConnected ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Disconnected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Sync products, inventory, and orders from your Shopify store</CardDescription>
              </div>
            </div>
            {isConnected && (
              <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          {isConnected && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Last Sync:</span>
                  <span className="text-sm text-muted-foreground">{formatLastSync(lastSync)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{credentials.storeUrl}</span>
                </div>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeUrl">Shopify Store URL</Label>
              <Input
                id="storeUrl"
                placeholder="your-store.myshopify.com"
                value={credentials.storeUrl}
                onChange={(e) => setCredentials({ ...credentials, storeUrl: e.target.value })}
                disabled={isConnected}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Shopify API key"
                value={credentials.apiKey}
                onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                disabled={isConnected}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Enter your Shopify API secret"
                value={credentials.apiSecret}
                onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
                disabled={isConnected}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Enter your Shopify access token"
                value={credentials.accessToken}
                onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                disabled={isConnected}
              />
            </div>

            {!isConnected && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      How to get your Shopify credentials
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Go to your Shopify Admin → Apps → Develop apps → Create an app. Generate API credentials with the
                      required scopes for products, inventory, and orders.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Auto-Sync Settings */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Auto-Sync Settings</h3>
              <p className="text-sm text-muted-foreground">Enable automatic synchronization for different data types</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Products</p>
                    <p className="text-sm text-muted-foreground">Sync product catalog and details</p>
                  </div>
                </div>
                <Switch
                  checked={autoSync.products}
                  onCheckedChange={(checked) => setAutoSync({ ...autoSync, products: checked })}
                  disabled={!isConnected}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Inventory</p>
                    <p className="text-sm text-muted-foreground">Sync stock levels and availability</p>
                  </div>
                </div>
                <Switch
                  checked={autoSync.inventory}
                  onCheckedChange={(checked) => setAutoSync({ ...autoSync, inventory: checked })}
                  disabled={!isConnected}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Orders</p>
                    <p className="text-sm text-muted-foreground">Sync customer orders and fulfillment</p>
                  </div>
                </div>
                <Switch
                  checked={autoSync.orders}
                  onCheckedChange={(checked) => setAutoSync({ ...autoSync, orders: checked })}
                  disabled={!isConnected}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !credentials.storeUrl || !credentials.apiKey || !credentials.apiSecret || !credentials.accessToken}
                className="w-full sm:w-auto"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Connect Shopify
                  </>
                )}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleDisconnect} className="w-full sm:w-auto">
                <XCircle className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>Recent synchronization activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "Products", status: "success", time: "2 hours ago", count: 245 },
                { type: "Inventory", status: "success", time: "2 hours ago", count: 1203 },
                { type: "Orders", status: "success", time: "3 hours ago", count: 87 },
                { type: "Products", status: "success", time: "1 day ago", count: 240 },
              ].map((sync, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">{sync.type} Sync</p>
                      <p className="text-xs text-muted-foreground">{sync.count} items synced</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{sync.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
