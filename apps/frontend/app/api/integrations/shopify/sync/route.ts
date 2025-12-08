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

// POST /api/integrations/shopify/sync - Trigger Shopify synchronization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = 'full', limit } = body

    // Validate sync type
    const validTypes = ['full', 'products', 'orders', 'customers', 'inventory']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid sync type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const headers = getAuthHeaders(request)

    console.log('Shopify sync request:', {
      url: `${API_URL}/shopify/sync/`,
      type: type,
      hasAuth: !!headers['Authorization'],
      hasTenant: !!headers['X-Tenant-ID'],
    })

    const response = await fetch(`${API_URL}/shopify/sync/`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        type: type,
        ...(limit && { limit }),
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Shopify sync error:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
      })

      let errorMessage = "Failed to sync Shopify data"
      if (error.error) {
        errorMessage = error.error
      } else if (error.detail) {
        errorMessage = error.detail
      } else if (error.message) {
        errorMessage = error.message
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: error,
          status: response.status
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Shopify sync error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to sync Shopify data"
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}
