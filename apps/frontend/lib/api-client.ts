/**
 * API Client Configuration for Backend Integration
 * 
 * This module handles all communication with the Django backend API.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface ApiError {
  error?: string
  detail?: string
  [key: string]: any
}

/**
 * Get authentication token from storage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

/**
 * Get refresh token from storage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

/**
 * Get current tenant ID from storage
 */
export function getTenantId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('tenant_id')
}

/**
 * Set authentication tokens in storage
 */
export function setAuthTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

/**
 * Set tenant ID in storage
 */
export function setTenantId(tenantId: string) {
  localStorage.setItem('tenant_id', tenantId)
}

/**
 * Clear all auth data from storage
 */
export function clearAuth() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('tenant_id')
  localStorage.removeItem('user')
}

/**
 * Make an API request to the backend
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  const tenantId = getTenantId()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  // Add authentication header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Add tenant ID header if exists (required for most endpoints)
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${getAuthToken()}`
        const retryResponse = await fetch(url, { ...options, headers })
        
        if (!retryResponse.ok) {
          throw new Error(`API Error: ${retryResponse.status}`)
        }
        
        return retryResponse.json()
      } else {
        // Refresh failed, redirect to login
        clearAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error('Authentication failed')
      }
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({}))
      throw new Error(error.error || error.detail || `API Error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('API Request Error:', error)
    throw error
  }
}

/**
 * Refresh the access token using refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (response.ok) {
      const data = await response.json()
      localStorage.setItem('access_token', data.access)
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * API Client Methods
 */
export const api = {
  // GET request
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),

  // POST request
  post: <T = any>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // PUT request
  put: <T = any>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // PATCH request
  patch: <T = any>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // DELETE request
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
}

export default api

