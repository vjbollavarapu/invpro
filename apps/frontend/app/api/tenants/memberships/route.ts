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

// GET /api/tenants/memberships - Get user's tenant memberships
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${API_URL}/multi-tenant/my_tenants/`,
      { headers: getAuthHeaders(request) }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to fetch tenant memberships" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      tenants: data.tenants || [],
      count: data.count || 0,
      currentTenantId: data.current_tenant_id,
    })
  } catch (error) {
    console.error("Tenant membership fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch tenant memberships" }, { status: 500 })
  }
}

// POST /api/tenants/memberships - Switch tenant context
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId } = body

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 })
    }

    const response = await fetch(
      `${API_URL}/multi-tenant/switch_tenant/`,
      {
        method: 'POST',
        headers: getAuthHeaders(request),
        body: JSON.stringify({ tenant_id: tenantId }),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to switch tenant" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      tenant: data.tenant,
      role: data.role,
    })
  } catch (error) {
    console.error("Tenant switch error:", error)
    return NextResponse.json({ error: "Failed to switch tenant" }, { status: 500 })
  }
}
