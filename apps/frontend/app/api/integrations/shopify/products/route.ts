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

// GET /api/integrations/shopify/products - Fetch Shopify products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = new URLSearchParams()
    
    // Forward query parameters
    if (searchParams.get('search')) params.append('search', searchParams.get('search')!)
    if (searchParams.get('status')) params.append('status', searchParams.get('status')!)
    if (searchParams.get('vendor')) params.append('vendor', searchParams.get('vendor')!)
    if (searchParams.get('product_type')) params.append('product_type', searchParams.get('product_type')!)
    if (searchParams.get('ordering')) params.append('ordering', searchParams.get('ordering')!)
    if (searchParams.get('page')) params.append('page', searchParams.get('page')!)
    if (searchParams.get('page_size')) params.append('page_size', searchParams.get('page_size')!)

    const headers = getAuthHeaders(request)

    const response = await fetch(`${API_URL}/shopify/products/?${params.toString()}`, {
      headers: headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to fetch Shopify products" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Shopify products fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch Shopify products" },
      { status: 500 }
    )
  }
}

