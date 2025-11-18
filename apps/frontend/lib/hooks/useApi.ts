import { useAuth } from '@/components/auth-provider';

export function useApi() {
  const { user } = useAuth();

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('invpro_token');
    const tenantData = localStorage.getItem('invpro_current_tenant');
    const tenant = tenantData ? JSON.parse(tenantData) : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(tenant?.id && { 'X-Tenant-ID': tenant.id }),
      ...options.headers,
    };

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.detail || 'Request failed');
    }

    return response.json();
  };

  return { apiCall };
}

