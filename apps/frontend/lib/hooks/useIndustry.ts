import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Industry, IndustryUIRegistry } from '@/lib/industry-registry'

export function useIndustry() {
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

      // First check if industry is stored in tenant data
      if (tenant?.industry) {
        setIndustry(tenant.industry as Industry)
        setLoading(false)
        return
      }

      // Fetch from backend
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

        // Update local storage
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

  const updateIndustry = async (newIndustry: Industry) => {
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

        // Update local storage
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

  return {
    industry,
    loading,
    updateIndustry,
    config: IndustryUIRegistry.getConfig(industry),
    getFormConfig: (formName: string) => IndustryUIRegistry.getFormConfig(industry, formName),
    getDashboardConfig: () => IndustryUIRegistry.getDashboardConfig(industry),
    getNavigationItems: () => IndustryUIRegistry.getNavigationItems(industry),
    isFieldVisible: (formName: string, fieldName: string) => 
      IndustryUIRegistry.isFieldVisible(industry, formName, fieldName),
  }
}

