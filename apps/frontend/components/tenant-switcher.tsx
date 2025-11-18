"use client"

import { Building2, Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { useState, useEffect } from "react"

interface TenantMembership {
  tenantId: string
  tenantName: string
  role: string
}

export function TenantSwitcher() {
  const { currentTenant, switchTenant } = useAuth()
  const [memberships, setMemberships] = useState<TenantMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMemberships()
  }, [])

  const fetchMemberships = async () => {
    try {
      const token = localStorage.getItem("invpro_token")
      const response = await fetch("/api/tenants/memberships/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Transform tenants array to memberships format
        const tenants = data.tenants || []
        const transformedMemberships = tenants.map((tenant: any) => ({
          tenantId: tenant.tenant_id || tenant.id,
          tenantName: tenant.tenant_name || tenant.name,
          role: tenant.role || 'member',
        }))
        setMemberships(transformedMemberships)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch memberships:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTenantSwitch = async (tenantId: string, tenantName: string) => {
    await switchTenant(tenantId, tenantName)
  }

  if (isLoading || memberships.length <= 1) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 px-3 bg-transparent">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline-block max-w-[150px] truncate">
            {currentTenant?.name || "Select Tenant"}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch Tenant</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.tenantId}
            onClick={() => handleTenantSwitch(membership.tenantId, membership.tenantName)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="font-medium">{membership.tenantName}</span>
                <span className="text-xs text-muted-foreground">{membership.role}</span>
              </div>
              {currentTenant?.id === membership.tenantId && <Check className="h-4 w-4 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
