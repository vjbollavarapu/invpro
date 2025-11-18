import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

// Types
export interface CostCenter {
  id: number
  name: string
  budget: number
  actual_cost: number
  variance: number
  description: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: number
  date: string
  description: string
  category: string
  amount: number
  linked_to: string | null
  cost_center: number | null
  cost_center_name: string | null
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

// Cost Center hooks
export function useCostCenters(options: { search?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["cost-centers", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.search) params.append("search", options.search)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const url = `/api/finance/cost-centers${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch cost centers")
      }

      const data: PaginatedResponse<CostCenter> = await response.json()
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateCostCenter() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (costCenterData: Partial<CostCenter>) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/finance/cost-centers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
        body: JSON.stringify(costCenterData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create cost center")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] })
      toast({
        title: "Success",
        description: "Cost center created successfully",
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

// Expense hooks
export function useExpenses(options: { 
  search?: string; 
  category?: string; 
  cost_center?: string; 
  page?: number; 
  pageSize?: number 
} = {}) {
  return useQuery({
    queryKey: ["expenses", options],
    queryFn: async () => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (options.search) params.append("search", options.search)
      if (options.category) params.append("category", options.category)
      if (options.cost_center) params.append("cost_center", options.cost_center)
      if (options.page) params.append("page", options.page.toString())
      if (options.pageSize) params.append("page_size", options.pageSize.toString())

      const url = `/api/finance/expenses${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch expenses")
      }

      const data: PaginatedResponse<Expense> = await response.json()
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateExpense() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expenseData: Partial<Expense>) => {
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenant?.id || "",
        },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create expense")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      toast({
        title: "Success",
        description: "Expense created successfully",
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
