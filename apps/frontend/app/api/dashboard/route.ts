import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

function getAuthHeaders(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  const tenantId = request.headers.get('x-tenant-id') || request.cookies.get('tenant_id')?.value

  return {
    'Content-Type': 'application/json',
    ...(authorization && { 'Authorization': authorization }),
    ...(tenantId && { 'X-Tenant-ID': tenantId }),
  }
}

// GET /api/dashboard - Get overall dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const stat_type = searchParams.get('type') || 'overview'

    // Map to appropriate backend endpoint
    const endpointMap: Record<string, string> = {
      'overview': '/dashboard/overview/',
      'inventory': '/dashboard/inventory_stats/',
      'sales': '/dashboard/sales_stats/',
      'procurement': '/dashboard/procurement_stats/',
      'warehouse': '/dashboard/warehouse_stats/',
      'finance': '/dashboard/finance_stats/',
    }

    const backendEndpoint = endpointMap[stat_type] || endpointMap['overview']

    const response = await fetch(
      `${API_URL}${backendEndpoint}`,
      { headers: getAuthHeaders(request) }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to fetch dashboard data" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Dashboard fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

