"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  RefreshCw,
  Settings,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EmailServiceIntegrationPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [serviceProvider, setServiceProvider] = useState("SMTP")
  const [credentials, setCredentials] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    apiKey: "",
    apiSecret: "",
    fromEmail: "",
    fromName: "",
  })
  const [settings, setSettings] = useState({
    useTls: true,
    useSsl: false,
    enableSending: true,
    dailyLimit: 1000,
  })

  // Fetch status on mount
  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/email/status")
      const data = await response.json()
      setStatus(data)
      if (data.service_provider) {
        setServiceProvider(data.service_provider)
      }
    } catch (error) {
      console.error("Failed to fetch email service status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const payload: any = {
        service_provider: serviceProvider,
        from_email: credentials.fromEmail,
        from_name: credentials.fromName,
        enable_sending: settings.enableSending,
        daily_limit: settings.dailyLimit,
      }

      if (serviceProvider === "SMTP") {
        payload.smtp_host = credentials.smtpHost
        payload.smtp_port = parseInt(credentials.smtpPort)
        payload.smtp_username = credentials.smtpUsername
        payload.smtp_password = credentials.smtpPassword
        payload.use_tls = settings.useTls
        payload.use_ssl = settings.useSsl
      } else {
        payload.api_key = credentials.apiKey
        if (credentials.apiSecret) {
          payload.api_secret = credentials.apiSecret
        }
      }

      const response = await fetch("/api/integrations/email/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Successfully connected to email service",
        })
        setCredentials({
          smtpHost: "",
          smtpPort: "587",
          smtpUsername: "",
          smtpPassword: "",
          apiKey: "",
          apiSecret: "",
          fromEmail: "",
          fromName: "",
        })
        fetchStatus()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to connect to email service",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect to email service",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/email/connect", {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Successfully disconnected from email service",
        })
        fetchStatus()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect from email service",
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

  const isFormValid = () => {
    if (serviceProvider === "SMTP") {
      return (
        credentials.smtpHost &&
        credentials.smtpPort &&
        credentials.smtpUsername &&
        credentials.smtpPassword &&
        credentials.fromEmail
      )
    } else {
      return credentials.apiKey && credentials.fromEmail
    }
  }

  if (isLoading && !status) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Service Integration</h1>
            <p className="text-muted-foreground">Configure email delivery settings</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Email Service Integration</h1>
          <p className="text-muted-foreground">Configure email delivery settings</p>
        </div>
        {status?.connected && (
          <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
            Disconnect
          </Button>
        )}
      </div>

      {/* Connection Form Card - Always Visible When Not Connected */}
      {!status?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Email Service</CardTitle>
            <CardDescription>
              Set up your email service provider to send emails from the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceProvider">Service Provider</Label>
              <Select value={serviceProvider} onValueChange={setServiceProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMTP">SMTP</SelectItem>
                  <SelectItem value="SENDGRID">SendGrid</SelectItem>
                  <SelectItem value="MAILGUN">Mailgun</SelectItem>
                  <SelectItem value="AWS_SES">AWS SES</SelectItem>
                  <SelectItem value="GMAIL">Gmail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {serviceProvider === "SMTP" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.gmail.com"
                    value={credentials.smtpHost}
                    onChange={(e) => setCredentials({ ...credentials, smtpHost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    placeholder="587"
                    value={credentials.smtpPort}
                    onChange={(e) => setCredentials({ ...credentials, smtpPort: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input
                    id="smtpUsername"
                    placeholder="your-email@example.com"
                    value={credentials.smtpUsername}
                    onChange={(e) => setCredentials({ ...credentials, smtpUsername: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    placeholder="Your SMTP password"
                    value={credentials.smtpPassword}
                    onChange={(e) => setCredentials({ ...credentials, smtpPassword: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Use TLS</Label>
                    <p className="text-xs text-muted-foreground">Use TLS encryption</p>
                  </div>
                  <Switch
                    checked={settings.useTls}
                    onCheckedChange={(checked) => setSettings({ ...settings, useTls: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Use SSL</Label>
                    <p className="text-xs text-muted-foreground">Use SSL encryption</p>
                  </div>
                  <Switch
                    checked={settings.useSsl}
                    onCheckedChange={(checked) => setSettings({ ...settings, useSsl: checked })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Your API key"
                    value={credentials.apiKey}
                    onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                  />
                </div>
                {serviceProvider !== "SENDGRID" && (
                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">API Secret (Optional)</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      placeholder="Your API secret"
                      value={credentials.apiSecret}
                      onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="noreply@example.com"
                value={credentials.fromEmail}
                onChange={(e) => setCredentials({ ...credentials, fromEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name (Optional)</Label>
              <Input
                id="fromName"
                placeholder="Your Company Name"
                value={credentials.fromName}
                onChange={(e) => setCredentials({ ...credentials, fromName: e.target.value })}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Sending</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow emails to be sent through this service
                  </p>
                </div>
                <Switch
                  checked={settings.enableSending}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableSending: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily Email Limit</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  value={settings.dailyLimit}
                  onChange={(e) => setSettings({ ...settings, dailyLimit: parseInt(e.target.value) || 1000 })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of emails that can be sent per day
                </p>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isLoading || !isFormValid()}
              className="w-full"
            >
              {isLoading ? "Connecting..." : "Connect Email Service"}
            </Button>
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
              <span className="text-sm font-medium">Provider</span>
              <span className="text-sm">{status.service_provider}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">From Email</span>
              <span className="text-sm">{status.from_email}</span>
            </div>
            {status.from_name && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">From Name</span>
                <span className="text-sm">{status.from_name}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sending Enabled</span>
              <span className="text-sm">{status.enable_sending ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Daily Limit</span>
              <span className="text-sm">{status.daily_limit}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Emails Sent Today</span>
              <span className="text-sm">{status.emails_sent_today} / {status.daily_limit}</span>
            </div>
            {status.last_test_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Test</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(status.last_test_at).toLocaleString()}
                </span>
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

