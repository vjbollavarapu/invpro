import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

function getAuthHeaders(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  const tenantId = request.headers.get('x-tenant-id') || request.cookies.get('tenant_id')?.value

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (authorization) {
    headers['Authorization'] = authorization
  }
  
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId
  }

  return headers
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

    const headers = getAuthHeaders(request)
    
    console.log('Shopify connect request:', {
      url: `${API_URL}/shopify/connect/`,
      hasAuth: !!headers['Authorization'],
      hasTenant: !!headers['X-Tenant-ID'],
      apiUrl: API_URL,
    })

    let response: Response
    try {
      response = await fetch(`${API_URL}/shopify/connect/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          store_url: storeUrl,
          api_key: apiKey,
          api_secret: apiSecret,
          access_token: accessToken
        }),
      })
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { 
          error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to reach backend API'}`,
          details: 'Please check that the backend API is running and accessible',
          apiUrl: API_URL
        },
        { status: 500 }
      )
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Shopify connection error:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        url: `${API_URL}/shopify/connect/`
      })
      
      // Provide more detailed error message
      let errorMessage = "Failed to connect to Shopify"
      if (error.detail) {
        errorMessage = error.detail
      } else if (error.error) {
        errorMessage = error.error
      } else if (error.message) {
        errorMessage = error.message
      } else if (response.status === 401) {
        errorMessage = "Authentication failed. Please check your login session."
      } else if (response.status === 403) {
        errorMessage = "Access denied. Please check your permissions."
      } else if (response.status === 404) {
        errorMessage = "Shopify endpoint not found. Please check the API URL configuration."
      } else if (response.status >= 500) {
        errorMessage = "Server error. Please try again later or contact support."
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
    console.error("Shopify connection error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to Shopify"
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
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