import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { DrugProduct, DrugProductFormValues } from '@/types/pharmacy'

interface DrugProductsResponse {
  count: number
  next: string | null
  previous: string | null
  results: DrugProduct[]
}

interface DrugProductQueryParams {
  search?: string
  dosage_form?: string
  therapeutic_class?: string
  status?: string
  page?: number
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('invpro_token')
  const tenantData = localStorage.getItem('invpro_current_tenant')
  const tenant = tenantData ? JSON.parse(tenantData) : null

  return {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenant?.id || '',
    'Content-Type': 'application/json',
  }
}

const fetchDrugProducts = async (params: DrugProductQueryParams): Promise<DrugProductsResponse> => {
  const query = new URLSearchParams()
  if (params.search) query.append('search', params.search)
  if (params.dosage_form) query.append('dosage_form', params.dosage_form)
  if (params.therapeutic_class) query.append('therapeutic_class', params.therapeutic_class)
  if (params.status) query.append('status', params.status)
  if (params.page) query.append('page', String(params.page))

  const response = await fetch(`/api/pharma/products?${query.toString()}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch drug products')
  }

  return response.json()
}

const createDrugProduct = async (data: DrugProductFormValues): Promise<DrugProduct> => {
  const response = await fetch('/api/pharma/products', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to create drug product')
  }

  return response.json()
}

const updateDrugProduct = async ({ id, data }: { id: number; data: Partial<DrugProductFormValues> }): Promise<DrugProduct> => {
  const response = await fetch(`/api/pharma/products/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update drug product')
  }

  return response.json()
}

const deleteDrugProduct = async (id: number): Promise<void> => {
  const response = await fetch(`/api/pharma/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to delete drug product')
  }
}

export const useDrugProducts = (params: DrugProductQueryParams = {}) => {
  return useQuery({
    queryKey: ['drugProducts', params],
    queryFn: () => fetchDrugProducts(params),
  })
}

export const useDrugProduct = (id: number) => {
  return useQuery({
    queryKey: ['drugProduct', id],
    queryFn: async () => {
      const response = await fetch(`/api/pharma/products/${id}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch drug product')
      return response.json()
    },
    enabled: !!id,
  })
}

export const useCreateDrugProduct = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDrugProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drugProducts'] })
      toast({
        title: 'Success',
        description: 'Drug product created successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export const useUpdateDrugProduct = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDrugProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drugProducts'] })
      toast({
        title: 'Success',
        description: 'Drug product updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export const useDeleteDrugProduct = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDrugProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drugProducts'] })
      toast({
        title: 'Success',
        description: 'Drug product deleted successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export const useLowStockDrugs = () => {
  return useQuery({
    queryKey: ['drugProducts', 'lowStock'],
    queryFn: async () => {
      const response = await fetch('/api/pharma/products/low_stock/', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch low stock drugs')
      return response.json()
    },
  })
}

export const useExpiringDrugs = (days: number = 90) => {
  return useQuery({
    queryKey: ['drugProducts', 'expiring', days],
    queryFn: async () => {
      const response = await fetch(`/api/pharma/products/expiring_soon/?days=${days}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch expiring drugs')
      return response.json()
    },
  })
}

