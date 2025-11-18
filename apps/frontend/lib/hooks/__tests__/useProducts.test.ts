import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProducts, useCreateProduct } from '../useProducts'
import React from 'react'

// Mock fetch
global.fetch = jest.fn()

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.setItem('invpro_token', 'test-token')
    localStorage.setItem('invpro_current_tenant', JSON.stringify({ id: '1', name: 'Test Tenant' }))
  })

  it('should fetch products successfully', async () => {
    const mockData = {
      success: true,
      data: [
        { id: 1, name: 'Product 1', sku: 'SKU001', quantity: 100 },
        { id: 2, name: 'Product 2', sku: 'SKU002', quantity: 50 },
      ],
      total: 2,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(() => useProducts({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toHaveLength(2)
    expect(result.current.data?.data[0].name).toBe('Product 1')
  })

  it('should handle fetch errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch' }),
    })

    const { result } = renderHook(() => useProducts({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeTruthy()
  })

  it('should pass search parameters', async () => {
    const mockData = {
      success: true,
      data: [],
      total: 0,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    renderHook(() => useProducts({ search: 'test', category: 'Electronics' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=test'),
      expect.any(Object)
    )
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('category=Electronics'),
      expect.any(Object)
    )
  })
})

describe('useCreateProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.setItem('invpro_token', 'test-token')
    localStorage.setItem('invpro_current_tenant', JSON.stringify({ id: '1', name: 'Test Tenant' }))
  })

  it('should create product successfully', async () => {
    const newProduct = {
      name: 'New Product',
      sku: 'SKU003',
      category: 'Electronics',
      quantity: 100,
      unit: 'pcs',
      unitCost: 10.5,
      sellingPrice: 15.0,
      reorderLevel: 20,
    }

    const mockResponse = {
      data: { id: 3, ...newProduct },
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(newProduct)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.id).toBe(3)
    expect(result.current.data?.name).toBe('New Product')
  })

  it('should handle creation errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Product already exists' }),
    })

    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: createWrapper(),
    })

    const newProduct = {
      name: 'Duplicate Product',
      sku: 'SKU001',
      category: 'Electronics',
      quantity: 100,
      unit: 'pcs',
      unitCost: 10.5,
      sellingPrice: 15.0,
      reorderLevel: 20,
    }

    result.current.mutate(newProduct)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeTruthy()
  })
})

