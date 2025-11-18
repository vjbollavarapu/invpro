"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  RefreshCw,
  Settings,
  X,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StripeIntegrationPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [credentials, setCredentials] = useState({
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
  })
  const [settings, setSettings] = useState({
    autoCapture: true,
    enableWebhooks: true,
  })

  // Fetch status on mount
  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/stripe/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Failed to fetch Stripe status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/stripe/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publishableKey: credentials.publishableKey,
          secretKey: credentials.secretKey,
          webhookSecret: credentials.webhookSecret,
          autoCapture: settings.autoCapture,
          enableWebhooks: settings.enableWebhooks,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Successfully connected to Stripe",
        })
        setCredentials({ publishableKey: "", secretKey: "", webhookSecret: "" })
        fetchStatus()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to connect to Stripe",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect to Stripe",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/stripe/connect", {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Successfully disconnected from Stripe",
        })
        fetchStatus()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect from Stripe",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONNECTED: { variant: "default" as const, icon: CheckCircle, text: "Connected" },
      DISCONNECTED: { variant: "secondary" as const, icon: X, text: "Disconnected" },
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

  if (isLoading && !status) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stripe Integration</h1>
            <p className="text-muted-foreground">Connect and manage your Stripe payment gateway</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Stripe Integration</h1>
          <p className="text-muted-foreground">Connect and manage your Stripe payment gateway</p>
        </div>
        {status?.connected ? (
          <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
            Disconnect
          </Button>
        ) : (
          <Button onClick={() => {}} disabled>
            Connect Stripe
          </Button>
        )}
      </div>

      {/* Connection Form Card - Always Visible When Not Connected */}
      {!status?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Stripe Account</CardTitle>
            <CardDescription>
              Enter your Stripe API keys to enable payment processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publishableKey">Publishable Key</Label>
              <Input
                id="publishableKey"
                placeholder="pk_test_..."
                value={credentials.publishableKey}
                onChange={(e) => setCredentials({ ...credentials, publishableKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your Stripe publishable key (starts with pk_test_ or pk_live_)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="sk_test_..."
                value={credentials.secretKey}
                onChange={(e) => setCredentials({ ...credentials, secretKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your Stripe secret key (starts with sk_test_ or sk_live_)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="whsec_..."
                value={credentials.webhookSecret}
                onChange={(e) => setCredentials({ ...credentials, webhookSecret: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Stripe webhook signing secret for verifying webhook events
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Capture</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically capture payments when authorized
                  </p>
                </div>
                <Switch
                  checked={settings.autoCapture}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoCapture: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Webhooks</Label>
                  <p className="text-xs text-muted-foreground">
                    Process Stripe webhook events for real-time updates
                  </p>
                </div>
                <Switch
                  checked={settings.enableWebhooks}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableWebhooks: checked })}
                />
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isLoading || !credentials.publishableKey || !credentials.secretKey}
              className="w-full"
            >
              {isLoading ? "Connecting..." : "Connect Stripe"}
            </Button>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">How to get your Stripe keys:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Stripe Dashboard</a></li>
                <li>Navigate to Developers → API keys</li>
                <li>Copy your Publishable key and Secret key</li>
                <li>For webhooks, go to Developers → Webhooks to get your signing secret</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      {status?.connected && (
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
              {getStatusBadge(status.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mode</span>
              <Badge variant={status.test_mode ? "secondary" : "default"}>
                {status.test_mode ? "Test Mode" : "Live Mode"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto Capture</span>
              <span className="text-sm">{status.auto_capture ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Webhooks</span>
              <span className="text-sm">{status.enable_webhooks ? "Enabled" : "Disabled"}</span>
            </div>
            {status.last_test_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Test</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(status.last_test_at).toLocaleString()}
                </span>
              </div>
            )}
            {status.error_count > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Count</span>
                <span className="text-sm text-destructive">{status.error_count}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {status?.last_error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Last error: {status.last_error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

