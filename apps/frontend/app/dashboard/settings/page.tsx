"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Building2,
  Globe,
  Upload,
  Check,
  X,
  Mail,
  CreditCard,
  ShoppingBag,
  Download,
  FileUp,
  Bell,
  Moon,
  Languages,
  Save,
  Link as LinkIcon,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  useSystemSettings, 
  useUpdateSystemSettings, 
  useIntegrationSettings, 
  useUpdateIntegrationSettings 
} from "@/lib/hooks/useSettings"

export default function SettingsPage() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Fetch real data using hooks
  const { data: systemSettings, isLoading: systemLoading } = useSystemSettings()
  const { data: integrationSettings, isLoading: integrationLoading } = useIntegrationSettings()

  // Mutations
  const updateSystemSettings = useUpdateSystemSettings()
  const updateIntegrationSettings = useUpdateIntegrationSettings()

  // Initialize form data from API or defaults
  const [companyInfo, setCompanyInfo] = useState({
    name: "InvPro360 Inc.",
    email: "contact@invpro360.com",
    phone: "+1 (555) 123-4567",
    address: "123 Business St, Suite 100, New York, NY 10001",
    timezone: "America/New_York",
    currency: "USD",
  })

  const [integrations, setIntegrations] = useState({
    shopify: { connected: false, lastSync: "Never" },
    stripe: { connected: false, lastSync: "Never" },
    email: { connected: false, lastSync: "Never" },
  })

  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "en",
    emailNotifications: true,
    pushNotifications: true,
    lowStockAlerts: true,
    orderUpdates: true,
  })

  const handleSaveGeneral = async () => {
    setIsSaving(true)
    try {
      await updateSystemSettings.mutateAsync({
        key: "company_info",
        value: companyInfo,
      })
    } catch (error) {
      console.error("Failed to save general settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveIntegrations = async () => {
    setIsSaving(true)
    try {
      await updateIntegrationSettings.mutateAsync({
        name: "integrations",
        is_enabled: true,
        config: integrations,
      })
    } catch (error) {
      console.error("Failed to save integration settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    try {
      await updateSystemSettings.mutateAsync({
        key: "user_preferences",
        value: preferences,
      })
    } catch (error) {
      console.error("Failed to save preferences:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportConfig = async () => {
    setIsExporting(true)
    try {
      const config = {
        companyInfo,
        integrations,
        preferences,
        exportDate: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invpro360-config-${Date.now()}.json`
      a.click()

      toast({
        title: "Success",
        description: "Configuration exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export configuration",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0])
    }
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your system configuration and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportConfig} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Config"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Building2 className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <LinkIcon className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Bell className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security">
            <Globe className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {systemLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Basic information about your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        value={companyInfo.name}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-email">Email</Label>
                      <Input
                        id="company-email"
                        type="email"
                        value={companyInfo.email}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-phone">Phone</Label>
                      <Input
                        id="company-phone"
                        value={companyInfo.phone}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={companyInfo.timezone}
                        onValueChange={(value) => setCompanyInfo({ ...companyInfo, timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={companyInfo.currency}
                        onValueChange={(value) => setCompanyInfo({ ...companyInfo, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-address">Address</Label>
                    <Input
                      id="company-address"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Logo</CardTitle>
                  <CardDescription>Upload your company logo for branding</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      {logoFile ? (
                        <img
                          src={URL.createObjectURL(logoFile)}
                          alt="Company logo"
                          className="h-full w-full object-contain rounded-lg"
                        />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo-upload">Upload Logo</Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-64"
                      />
                      <p className="text-sm text-muted-foreground">
                        Recommended: 200x200px, PNG or JPG format
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {integrationLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Third-Party Integrations</CardTitle>
                  <CardDescription>Connect with external services and platforms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Link href="/dashboard/settings/integrations/shopify" className="block">
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="h-8 w-8 text-green-600" />
                        <div>
                          <h3 className="font-semibold">Shopify</h3>
                          <p className="text-sm text-muted-foreground">E-commerce platform integration</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={integrations.shopify.connected ? "default" : "secondary"}>
                          {integrations.shopify.connected ? "Connected" : "Disconnected"}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium group-hover:text-primary">
                            {integrations.shopify.connected ? "Manage" : "Connect"}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/dashboard/settings/integrations/stripe" className="block">
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">Stripe</h3>
                          <p className="text-sm text-muted-foreground">Payment processing</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={integrations.stripe.connected ? "default" : "secondary"}>
                          {integrations.stripe.connected ? "Connected" : "Disconnected"}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium group-hover:text-primary">
                            {integrations.stripe.connected ? "Manage" : "Connect"}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/dashboard/settings/integrations/email" className="block">
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <Mail className="h-8 w-8 text-purple-600" />
                        <div>
                          <h3 className="font-semibold">Email Service</h3>
                          <p className="text-sm text-muted-foreground">SMTP email delivery</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={integrations.email.connected ? "default" : "secondary"}>
                          {integrations.email.connected ? "Connected" : "Disconnected"}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium group-hover:text-primary">
                            {integrations.email.connected ? "Manage" : "Connect"}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveIntegrations} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Theme</Label>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <Select
                      value={preferences.theme}
                      onValueChange={(value) => setPreferences({ ...preferences, theme: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Language</Label>
                      <p className="text-sm text-muted-foreground">Select your preferred language</p>
                    </div>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, pushNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when inventory is low</p>
                  </div>
                  <Switch
                    checked={preferences.lowStockAlerts}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, lowStockAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
                  </div>
                  <Switch
                    checked={preferences.orderUpdates}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, orderUpdates: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSavePreferences} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Password</Label>
                <Button variant="outline">Change Password</Button>
              </div>
              <div className="space-y-2">
                <Label>Two-Factor Authentication</Label>
                <Button variant="outline">Enable 2FA</Button>
              </div>
              <div className="space-y-2">
                <Label>API Keys</Label>
                <Button variant="outline">Manage API Keys</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}