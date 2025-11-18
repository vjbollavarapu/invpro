import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

// Types
export interface Warehouse {
  id: number
  warehouse_code: string
  name: string
  location: string
  max_capacity: number
  current_utilization: number
  active_clients: number
  total_skus: number
  status: 'active' | 'inactive' | 'maintenance'
  capacity_percentage: number
  created_at: string
  updated_at: string
}

export interface Transfer {
  id: number
  transfer_number: string
  from_warehouse: number
  from_warehouse_name: string
  to_warehouse: number
  to_warehouse_name: string
  product: number
  product_name: string
  product_sku: string
  quantity: number
  status: 'pending' | 'in-transit' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  count: number
  next?: string | null
  previous?: string | null
  page?: number
  pageSize?: number
  totalPages?: number
}

// Warehouse hooks
export function useWarehouses(options: { 
  search?: string; 
  status?: string; 
  page?: number; 
  pageSize?: number 
} = {}) {
  return useQuery({
    queryKey: ["warehouses", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.search) params.append("search", options.search)
      if (options.status) params.append("status", options.status)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const url = `/api/warehouse/warehouses${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch warehouses")
      }

      const data: PaginatedResponse<Warehouse> = await response.json()
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateWarehouse() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (warehouseData: Partial<Warehouse>) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/warehouse/warehouses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
        body: JSON.stringify(warehouseData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create warehouse")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      toast({
        title: "Success",
        description: "Warehouse created successfully",
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

// Transfer hooks
export function useTransfers(options: { 
  status?: string; 
  search?: string; 
  page?: number; 
  pageSize?: number 
} = {}) {
  return useQuery({
    queryKey: ["transfers", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.status) params.append("status", options.status)
      if (options.search) params.append("search", options.search)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const url = `/api/warehouse/transfers${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch transfers")
      }

      const data: PaginatedResponse<Transfer> = await response.json()
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateTransfer() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transferData: Partial<Transfer>) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/warehouse/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
        body: JSON.stringify(transferData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create transfer")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] })
      toast({
        title: "Success",
        description: "Transfer created successfully",
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
