import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

// Types
export interface Customer {
  id: number
  customer_code: string
  name: string
  email: string
  phone: string
  address: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  product: number
  product_name: string
  product_sku: string
  quantity: number
  price: number
  total: number
}

export interface Order {
  id: number
  order_number: string
  customer: number
  customer_name: string
  customer_code: string
  channel: 'manual' | 'shopify'
  total_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  fulfilled_at: string | null
  items_count: number
  items: OrderItem[]
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

// Customer hooks
export function useCustomers(options: { search?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["customers", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.search) params.append("search", options.search)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const url = `/api/sales/customers${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }

      const data: PaginatedResponse<Customer> = await response.json()
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateCustomer() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/sales/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create customer")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast({
        title: "Success",
        description: "Customer created successfully",
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

// Order hooks
export function useOrders(options: { 
  status?: string; 
  channel?: string; 
  customer?: string; 
  search?: string; 
  page?: number; 
  pageSize?: number 
} = {}) {
  return useQuery({
    queryKey: ["orders", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.status) params.append("status", options.status)
      if (options.channel) params.append("channel", options.channel)
      if (options.customer) params.append("customer", options.customer)
      if (options.search) params.append("search", options.search)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const url = `/api/sales/orders${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }

      const data: PaginatedResponse<Order> = await response.json()
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateOrder() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/sales/orders", {
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
        throw new Error(error.error || "Failed to create order")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      toast({
        title: "Success",
        description: "Order created successfully",
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

// Shopify sync hook (placeholder)
export function useShopifySync() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/shopify/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to sync with Shopify")
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shopify orders synced successfully",
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
