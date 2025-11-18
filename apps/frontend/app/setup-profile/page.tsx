"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, Upload, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"

const industries = [
  "Manufacturing",
  "Retail",
  "Wholesale",
  "E-commerce",
  "Logistics",
  "Healthcare",
  "Food & Beverage",
  "Technology",
  "Automotive",
  "Other",
]

const timezones = [
  "UTC-12:00 - Baker Island",
  "UTC-11:00 - American Samoa",
  "UTC-10:00 - Hawaii",
  "UTC-09:00 - Alaska",
  "UTC-08:00 - Pacific Time",
  "UTC-07:00 - Mountain Time",
  "UTC-06:00 - Central Time",
  "UTC-05:00 - Eastern Time",
  "UTC-04:00 - Atlantic Time",
  "UTC-03:00 - Buenos Aires",
  "UTC-02:00 - Mid-Atlantic",
  "UTC-01:00 - Azores",
  "UTC+00:00 - London, Dublin",
  "UTC+01:00 - Paris, Berlin",
  "UTC+02:00 - Cairo, Athens",
  "UTC+03:00 - Moscow, Istanbul",
  "UTC+04:00 - Dubai",
  "UTC+05:00 - Karachi",
  "UTC+05:30 - Mumbai, Delhi",
  "UTC+06:00 - Dhaka",
  "UTC+07:00 - Bangkok, Jakarta",
  "UTC+08:00 - Singapore, Beijing",
  "UTC+09:00 - Tokyo, Seoul",
  "UTC+10:00 - Sydney",
  "UTC+11:00 - Solomon Islands",
  "UTC+12:00 - Auckland",
]

const currencies = [
  { code: "USD", name: "US Dollar ($)" },
  { code: "EUR", name: "Euro (€)" },
  { code: "GBP", name: "British Pound (£)" },
  { code: "JPY", name: "Japanese Yen (¥)" },
  { code: "CNY", name: "Chinese Yuan (¥)" },
  { code: "INR", name: "Indian Rupee (₹)" },
  { code: "AUD", name: "Australian Dollar (A$)" },
  { code: "CAD", name: "Canadian Dollar (C$)" },
  { code: "CHF", name: "Swiss Franc (CHF)" },
  { code: "SGD", name: "Singapore Dollar (S$)" },
]

export default function SetupProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    timezone: "UTC+00:00 - London, Dublin",
    currency: "USD",
  })

  useEffect(() => {
    const companyName = user?.name || localStorage.getItem("companyName") || ""
    setFormData((prev) => ({ ...prev, companyName }))
  }, [user])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Logo must be less than 5MB",
          variant: "destructive",
        })
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setLogoFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName || !formData.industry) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let logoUrl = null
      if (logoFile) {
        logoUrl = logoPreview
      }

      const response = await fetch("/api/settings/general/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("invpro_token")}`,
        },
        body: JSON.stringify({
          ...formData,
          logo: logoUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save profile")
      }

      localStorage.setItem("profileCompleted", "true")

      toast({
        title: "Profile saved successfully",
        description: "Your company profile has been set up",
      })

      setTimeout(() => {
        router.push("/subscription")
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl bg-background/95 backdrop-blur-sm shadow-2xl">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Step 2 of 4</span>
              <span className="text-sm font-medium text-primary">50%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/2 transition-all duration-300" />
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
            <p className="text-muted-foreground">Set up your company information and preferences</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-4 block">Company Logo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    {logoPreview ? (
                      <div className="relative">
                        <div className="relative w-48 h-48 mx-auto mb-4">
                          <Image
                            src={logoPreview || "/placeholder.svg"}
                            alt="Logo preview"
                            fill
                            className="object-contain rounded-lg"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="mx-auto bg-transparent"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove Logo
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload your company logo
                          <br />
                          <span className="text-xs">PNG, JPG up to 5MB</span>
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Label htmlFor="logo-upload">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("logo-upload")?.click()}
                          >
                            Choose File
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your logo will be displayed on invoices and reports
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="industry">
                    Industry <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">
                    Timezone <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">
                    Currency <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.push("/login")} disabled={loading}>
                Back
              </Button>
              <Button type="submit" disabled={loading} className="min-w-32">
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    Continue
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
