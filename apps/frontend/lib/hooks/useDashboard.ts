import { useQuery } from "@tanstack/react-query"
import { DashboardData } from "@/types"

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const data: DashboardData = await response.json()
      return data
    },
    staleTime: 60 * 1000, // 1 minute - dashboard data can be slightly stale
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })
}

export function useDashboardStats(type: "inventory" | "sales" | "procurement" | "warehouse" | "finance") {
  return useQuery({
    queryKey: ["dashboard", type],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch(`/api/dashboard?type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} stats`)
      }

      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

