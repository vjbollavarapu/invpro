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

// GET /api/integrations/shopify/status - Get Shopify integration status
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/shopify/status/`, {
      headers: getAuthHeaders(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to fetch Shopify status" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Shopify status error:", error)
    return NextResponse.json(
      { error: "Failed to fetch Shopify status" },
      { status: 500 }
    )
  }
}