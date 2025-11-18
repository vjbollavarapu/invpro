"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useIndustry } from "@/lib/hooks/useIndustry"
import { useToast } from "@/hooks/use-toast"
import { Industry, INDUSTRY_UI_REGISTRY } from "@/lib/industry-registry"
import { Pill, Store, Truck, Factory, Box, Check } from "lucide-react"

const industryIcons: Record<Industry, any> = {
  pharmacy: Pill,
  retail: Store,
  logistics: Truck,
  manufacturing: Factory,
  general: Box,
}

export function IndustrySelector() {
  const { industry: currentIndustry, updateIndustry, loading } = useIndustry()
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  const handleSelectIndustry = async (industry: Industry) => {
    if (industry === currentIndustry) return

    setUpdating(true)
    try {
      const success = await updateIndustry(industry)
      
      if (success) {
        toast({
          title: "Industry Updated",
          description: `Switched to ${INDUSTRY_UI_REGISTRY[industry].displayName} mode. Page will reload.`,
        })
        
        // Reload page to apply new industry configuration
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        toast({
          title: "Error",
          description: "Failed to update industry",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update industry",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Industry Type</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Industry Type</CardTitle>
        <CardDescription>
          Select your business industry. This determines which features and fields are available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(INDUSTRY_UI_REGISTRY).map(([key, config]) => {
            const Icon = industryIcons[key as Industry]
            const isSelected = key === currentIndustry
            const industryKey = key as Industry

            return (
              <Card
                key={key}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected && "border-primary border-2"
                )}
                onClick={() => !updating && handleSelectIndustry(industryKey)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className={cn("h-8 w-8", isSelected ? "text-primary" : "text-muted-foreground")} />
                    {isSelected && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-1">{config.displayName}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {config.navigation.filter(n => n.enabled).length} modules available
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {config.navigation.filter(n => n.enabled).slice(0, 4).map((nav) => (
                      <Badge key={nav.path} variant="secondary" className="text-xs">
                        {nav.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {updating && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
            Updating industry settings... Page will reload shortly.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

