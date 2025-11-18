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

// Helper function to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("invpro_token")
  const tenantData = localStorage.getItem("invpro_current_tenant")
  const tenant = tenantData ? JSON.parse(tenantData) : null

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
      const response = await fetch("/api/integrations/shopify/connect", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          storeUrl: credentials.storeUrl,
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          accessToken: credentials.accessToken,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to connect to Shopify")
      }

      return response.json()
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
