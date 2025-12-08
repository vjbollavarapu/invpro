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

// POST /api/integrations/shopify/import - Import Shopify data to common tables
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entity_type = 'products', product_ids, order_ids, customer_ids, merge_strategy = 'last_write_wins' } = body

    // Validate entity type
    const validTypes = ['products', 'orders', 'customers']
    if (!validTypes.includes(entity_type)) {
      return NextResponse.json(
        { error: `Invalid entity type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const headers = getAuthHeaders(request)

    console.log('Shopify import request:', {
      url: `${API_URL}/shopify/import/${entity_type}/`,
      entity_type,
      hasAuth: !!headers['Authorization'],
      hasTenant: !!headers['X-Tenant-ID'],
    })

    const requestBody: any = { merge_strategy }
    if (entity_type === 'products' && product_ids) {
      requestBody.product_ids = product_ids
    } else if (entity_type === 'orders' && order_ids) {
      requestBody.order_ids = order_ids
    } else if (entity_type === 'customers' && customer_ids) {
      requestBody.customer_ids = customer_ids
    }

    const response = await fetch(`${API_URL}/shopify/import/${entity_type}/`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Shopify import error:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
      })

      let errorMessage = "Failed to import Shopify data"
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
    console.error("Shopify import error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to import Shopify data"
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}

