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

// POST /api/integrations/shopify/connect - Connect to Shopify store
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeUrl, apiKey, apiSecret, accessToken } = body

    // Validate required fields
    if (!storeUrl || !apiKey || !apiSecret || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields: storeUrl, apiKey, apiSecret, accessToken" },
        { status: 400 }
      )
    }

    // Validate store URL format
    if (!storeUrl.includes('.myshopify.com')) {
      return NextResponse.json(
        { error: "Invalid store URL. Must be in format: mystore.myshopify.com" },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_URL}/shopify/connect/`, {
      method: 'POST',
      headers: getAuthHeaders(request),
      body: JSON.stringify({
        store_url: storeUrl,
        api_key: apiKey,
        api_secret: apiSecret,
        access_token: accessToken
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to connect to Shopify" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Shopify connection error:", error)
    return NextResponse.json(
      { error: "Failed to connect to Shopify" },
      { status: 500 }
    )
  }
}

// DELETE /api/integrations/shopify/connect - Disconnect from Shopify store
export async function DELETE(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/shopify/connect/`, {
      method: 'DELETE',
      headers: getAuthHeaders(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to disconnect from Shopify" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Shopify disconnection error:", error)
    return NextResponse.json(
      { error: "Failed to disconnect from Shopify" },
      { status: 500 }
    )
  }
}