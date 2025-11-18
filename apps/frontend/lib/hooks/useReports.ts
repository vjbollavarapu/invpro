import { useQuery, useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

// Types
export interface ReportData {
  success: boolean
  data: any
  reportType: string
  period: string
}

export interface ExportOptions {
  reportType: string
  format?: 'json' | 'csv' | 'pdf'
  filters?: {
    period?: string
    dateFrom?: string
    dateTo?: string
  }
}

// Reports hooks
export function useReports(options: { 
  reportType?: string; 
  period?: string 
} = {}) {
  return useQuery({
    queryKey: ["reports", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.reportType) params.append("type", options.reportType)
      if (options.period) params.append("period", options.period)

      const url = `/api/reports${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch reports")
      }

      const data: ReportData = await response.json()
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - reports can be slightly stale
  })
}

export function useExportReport() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (options: ExportOptions) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to export report")
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report exported successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Specific report hooks for convenience
export function useInventoryReport(period?: string) {
  return useReports({ reportType: "inventory", period })
}

export function useSalesReport(period?: string) {
  return useReports({ reportType: "sales", period })
}

export function useProcurementReport(period?: string) {
  return useReports({ reportType: "procurement", period })
}

export function useWarehouseReport(period?: string) {
  return useReports({ reportType: "warehouse", period })
}

export function useFinanceReport(period?: string) {
  return useReports({ reportType: "finance", period })
}

export function useOverviewReport(period?: string) {
  return useReports({ reportType: "overview", period })
}
