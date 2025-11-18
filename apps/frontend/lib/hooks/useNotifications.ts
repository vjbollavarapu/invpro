import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

// Types
export interface Notification {
  id: number
  type: 'low_stock' | 'purchase_order' | 'sales_order' | 'system' | 'warehouse' | 'finance'
  title: string
  message: string
  read: boolean
  severity: 'info' | 'warning' | 'error' | 'success'
  metadata: any
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
  meta?: {
    total: number
    unread: number
  }
}

// Notifications hooks
export function useNotifications(options: { 
  unreadOnly?: boolean; 
  type?: string; 
  page?: number; 
  pageSize?: number 
} = {}) {
  return useQuery({
    queryKey: ["notifications", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.unreadOnly) params.append("unreadOnly", "true")
      if (options.type) params.append("type", options.type)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const url = `/api/notifications${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data: PaginatedResponse<Notification> = await response.json()
      return data
    },
    staleTime: 30 * 1000, // 30 seconds - notifications should be fresh
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export function useCreateNotification() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationData: Partial<Notification>) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
        body: JSON.stringify(notificationData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create notification")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast({
        title: "Success",
        description: "Notification created successfully",
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

export function useMarkNotificationAsRead() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to mark notification as read")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
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

export function useMarkAllAsRead() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to mark all notifications as read")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast({
        title: "Success",
        description: "All notifications marked as read",
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

// Convenience hooks
export function useUnreadNotifications() {
  return useNotifications({ unreadOnly: true, pageSize: 100 })
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ["notification-stats"],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/notifications?unreadOnly=true&page_size=1000", {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch notification stats")
      }

      const data = await response.json()
      return {
        total: data.total || 0,
        unread: data.meta?.unread || 0,
        byType: data.data?.reduce((acc: any, notif: Notification) => {
          acc[notif.type] = (acc[notif.type] || 0) + 1
          return acc
        }, {}) || {},
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}
