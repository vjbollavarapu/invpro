import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

// Types
export interface Supplier {
  id: number
  supplier_code: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  rating: number
  total_orders: number
  active_orders: number
  created_at: string
  updated_at: string
}

export interface PurchaseRequest {
  id: number
  request_number: string
  item: number
  item_name: string
  item_code: string
  quantity: number
  status: 'pending' | 'approved' | 'rejected'
  requested_by: number
  requested_by_name: string
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: number
  po_number: string
  supplier: number
  supplier_name: string
  supplier_code: string
  total_amount: number
  expected_delivery_date: string | null
  status: 'draft' | 'pending' | 'processing' | 'in-transit' | 'delivered' | 'cancelled'
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

// Supplier hooks
export function useSuppliers(options: { search?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["suppliers", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.search) params.append("search", options.search)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const url = `/api/procurement/suppliers${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch suppliers")
      }

      const data: PaginatedResponse<Supplier> = await response.json()
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateSupplier() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (supplierData: Partial<Supplier>) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/procurement/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
        body: JSON.stringify(supplierData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create supplier")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      toast({
        title: "Success",
        description: "Supplier created successfully",
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

// Purchase Request hooks
export function usePurchaseRequests(options: { 
  status?: string; 
  search?: string; 
  page?: number; 
  pageSize?: number 
} = {}) {
  return useQuery({
    queryKey: ["purchase-requests", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.status) params.append("status", options.status)
      if (options.search) params.append("search", options.search)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const url = `/api/procurement/requests${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch purchase requests")
      }

      const data: PaginatedResponse<PurchaseRequest> = await response.json()
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreatePurchaseRequest() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (requestData: Partial<PurchaseRequest>) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/procurement/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create purchase request")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] })
      toast({
        title: "Success",
        description: "Purchase request created successfully",
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

// Purchase Order hooks
export function usePurchaseOrders(options: { 
  status?: string; 
  supplier?: string; 
  search?: string; 
  page?: number; 
  pageSize?: number 
} = {}) {
  return useQuery({
    queryKey: ["purchase-orders", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.status) params.append("status", options.status)
      if (options.supplier) params.append("supplier", options.supplier)
      if (options.search) params.append("search", options.search)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const url = `/api/procurement/orders${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch purchase orders")
      }

      const data: PaginatedResponse<PurchaseOrder> = await response.json()
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreatePurchaseOrder() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData: Partial<PurchaseOrder>) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/procurement/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create purchase order")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })
      toast({
        title: "Success",
        description: "Purchase order created successfully",
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
