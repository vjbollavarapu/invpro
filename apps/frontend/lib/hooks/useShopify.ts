import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

// Types
export interface ShopifyIntegration {
  id: number
  store_url: string
  status: 'DISCONNECTED' | 'CONNECTED' | 'SYNCING' | 'ERROR' | 'PAUSED'
  shop_name?: string
  shop_domain?: string
  last_sync?: string
  last_error?: string
  error_count: number
  auto_sync_enabled: boolean
  sync_settings: {
    products: boolean
    orders: boolean
    customers: boolean
    inventory: boolean
  }
}

export interface ShopifySyncLog {
  id: number
  sync_type: 'FULL' | 'PRODUCTS' | 'ORDERS' | 'CUSTOMERS' | 'INVENTORY'
  status: 'STARTED' | 'SUCCESS' | 'ERROR' | 'PARTIAL'
  started_at: string
  completed_at?: string
  duration?: number
  items_processed: number
  items_created: number
  items_updated: number
  items_failed: number
  error_message?: string
}

export interface ShopifySyncResult {
  success: boolean
  message: string
  data?: any
  sync_log_id?: number
}

export interface ShopifyProduct {
  id: number
  shopify_product_id: string
  title: string
  status: string
  product_type?: string
  vendor?: string
  tags?: string
  handle?: string
  price_min?: string
  price_max?: string
  variants?: any[]
  images?: any[]
  synced_at?: string
  published_at?: string
  created_at: string
  updated_at: string
}

// Helper function to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("invpro_token")
  const tenantData = localStorage.getItem("invpro_current_tenant")
  const tenant = tenantData ? JSON.parse(tenantData) : null

  if (!token) {
    // No token, redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(tenant && { 'X-Tenant-ID': tenant.id }),
  }
}

// Shopify Status Hook
export function useShopifyStatus() {
  return useQuery({
    queryKey: ["shopify", "status"],
    queryFn: async (): Promise<ShopifyIntegration> => {
      const response = await fetch("/api/integrations/shopify/status", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to fetch Shopify status")
      }

      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Shopify Connect Hook
export function useShopifyConnect() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: {
      storeUrl: string
      apiKey: string
      apiSecret: string
      accessToken: string
    }) => {
      const headers = getAuthHeaders()
      
      try {
        const response = await fetch("/api/integrations/shopify/connect", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            storeUrl: credentials.storeUrl,
            apiKey: credentials.apiKey,
            apiSecret: credentials.apiSecret,
            accessToken: credentials.accessToken,
          }),
        })

        // Get response text first to handle both JSON and non-JSON responses
        const responseText = await response.text()
        let errorData = {}
        
        try {
          errorData = responseText ? JSON.parse(responseText) : {}
        } catch (e) {
          // If not JSON, use the text as error message
          errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` }
        }

        if (!response.ok) {
          console.error("Shopify connect error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            responseText: responseText,
            hasAuth: !!headers['Authorization'],
            hasTenant: !!headers['X-Tenant-ID'],
          })
          
          // Build error message from various possible fields
          const errorMessage = 
            errorData.error || 
            errorData.detail || 
            errorData.message ||
            (response.status === 401 ? "Authentication failed. Please log in again." :
             response.status === 403 ? "Access denied. Please check your permissions." :
             response.status === 404 ? "API endpoint not found. Please check the configuration." :
             response.status >= 500 ? "Server error. Please try again later." :
             `Failed to connect to Shopify (${response.status})`)
          
          throw new Error(errorMessage)
        }

        // Parse successful response
        return responseText ? JSON.parse(responseText) : {}
      } catch (error) {
        // Handle network errors or other exceptions
        if (error instanceof Error) {
          console.error("Shopify connect exception:", error)
          throw error
        }
        throw new Error("Failed to connect to Shopify: " + String(error))
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shopify"] })
      toast({
        title: "Success",
        description: data.message || "Successfully connected to Shopify",
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

// Shopify Disconnect Hook
export function useShopifyDisconnect() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/integrations/shopify/connect", {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to disconnect from Shopify")
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shopify"] })
      toast({
        title: "Success",
        description: data.message || "Successfully disconnected from Shopify",
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

// Shopify Sync Hook
export function useShopifySync() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (options: { type?: string; limit?: number } = {}) => {
      const response = await fetch("/api/integrations/shopify/sync", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: options.type || "full",
          limit: options.limit,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to sync Shopify data")
      }

      return response.json()
    },
    onSuccess: (data: ShopifySyncResult) => {
      queryClient.invalidateQueries({ queryKey: ["shopify"] })
      queryClient.invalidateQueries({ queryKey: ["shopify", "logs"] })  // Refresh sync logs
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      
      toast({
        title: data.success ? "Success" : "Warning",
        description: data.message,
        variant: data.success ? "default" : "destructive",
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

// Shopify Sync Logs Hook
export function useShopifySyncLogs() {
  return useQuery({
    queryKey: ["shopify", "logs"],
    queryFn: async (): Promise<{ logs: ShopifySyncLog[] }> => {
      const response = await fetch("/api/integrations/shopify/logs", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to fetch sync logs")
      }

      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Specific sync hooks for convenience
export function useShopifySyncProducts(limit?: number) {
  const sync = useShopifySync()
  return {
    ...sync,
    mutate: () => sync.mutate({ type: "products", limit }),
  }
}

export function useShopifySyncOrders(limit?: number) {
  const sync = useShopifySync()
  return {
    ...sync,
    mutate: () => sync.mutate({ type: "orders", limit }),
  }
}

export function useShopifySyncCustomers(limit?: number) {
  const sync = useShopifySync()
  return {
    ...sync,
    mutate: () => sync.mutate({ type: "customers", limit }),
  }
}

export function useShopifySyncInventory() {
  const sync = useShopifySync()
  return {
    ...sync,
    mutate: () => sync.mutate({ type: "inventory" }),
  }
}

// Shopify Products Hook
export function useShopifyProducts(options: {
  search?: string
  status?: string
  vendor?: string
  product_type?: string
  ordering?: string
  page?: number
  pageSize?: number
} = {}) {
  return useQuery({
    queryKey: ["shopify", "products", options],
    queryFn: async (): Promise<{ results: ShopifyProduct[]; count: number; next?: string; previous?: string }> => {
      const params = new URLSearchParams()
      if (options.search) params.append("search", options.search)
      if (options.status) params.append("status", options.status)
      if (options.vendor) params.append("vendor", options.vendor)
      if (options.product_type) params.append("product_type", options.product_type)
      if (options.ordering) params.append("ordering", options.ordering)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const response = await fetch(`/api/integrations/shopify/products?${params.toString()}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to fetch Shopify products")
      }

      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Shopify Import Hook - Import synced data to common tables
export function useShopifyImport() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (options: {
      entity_type: 'products' | 'orders' | 'customers'
      product_ids?: number[]
      order_ids?: number[]
      customer_ids?: number[]
      merge_strategy?: 'last_write_wins' | 'skip' | 'overwrite'
    }) => {
      const response = await fetch("/api/integrations/shopify/import", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          entity_type: options.entity_type,
          product_ids: options.product_ids,
          order_ids: options.order_ids,
          customer_ids: options.customer_ids,
          merge_strategy: options.merge_strategy || 'last_write_wins',
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to import Shopify data")
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shopify"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      
      toast({
        title: data.success ? "Success" : "Warning",
        description: data.message || `Imported ${data.created || 0} items`,
        variant: data.success ? "default" : "destructive",
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
