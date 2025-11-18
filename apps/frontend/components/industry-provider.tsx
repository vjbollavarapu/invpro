"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Industry, IndustryUIRegistry, IndustryUIConfig } from '@/lib/industry-registry'
import { useAuth } from './auth-provider'

interface IndustryContextType {
  industry: Industry
  config: IndustryUIConfig
  loading: boolean
  updateIndustry: (industry: Industry) => Promise<boolean>
}

const IndustryContext = createContext<IndustryContextType | undefined>(undefined)

export function IndustryProvider({ children }: { children: ReactNode }) {
  const [industry, setIndustry] = useState<Industry>('general')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchTenantIndustry()
  }, [user])

  const fetchTenantIndustry = async () => {
    if (!user) {
      setIndustry('general')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      // Check local storage first
      if (tenant?.industry) {
        setIndustry(tenant.industry as Industry)
        setLoading(false)
        return
      }

      // Fetch from API
      const response = await fetch('/api/industry/tenant', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const tenantIndustry = data.industry || 'general'
        setIndustry(tenantIndustry as Industry)

        // Cache in localStorage
        if (tenant) {
          tenant.industry = tenantIndustry
          localStorage.setItem('invpro_current_tenant', JSON.stringify(tenant))
        }
      }
    } catch (error) {
      console.error('Failed to fetch tenant industry:', error)
      setIndustry('general')
    } finally {
      setLoading(false)
    }
  }

  const updateIndustry = async (newIndustry: Industry): Promise<boolean> => {
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch('/api/industry/tenant', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ industry: newIndustry }),
      })

      if (response.ok) {
        setIndustry(newIndustry)

        // Update localStorage
        if (tenant) {
          tenant.industry = newIndustry
          localStorage.setItem('invpro_current_tenant', JSON.stringify(tenant))
        }

        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update industry:', error)
      return false
    }
  }

  const config = IndustryUIRegistry.getConfig(industry)

  return (
    <IndustryContext.Provider value={{ industry, config, loading, updateIndustry }}>
      {children}
    </IndustryContext.Provider>
  )
}

export function useIndustryContext() {
  const context = useContext(IndustryContext)
  if (context === undefined) {
    throw new Error('useIndustryContext must be used within IndustryProvider')
  }
  return context
}

