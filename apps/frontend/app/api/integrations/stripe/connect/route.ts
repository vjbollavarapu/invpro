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

// POST /api/integrations/stripe/connect - Connect to Stripe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { publishableKey, secretKey, webhookSecret, autoCapture, enableWebhooks } = body

    // Validate required fields
    if (!publishableKey || !secretKey) {
      return NextResponse.json(
        { error: "Missing required fields: publishableKey, secretKey" },
        { status: 400 }
      )
    }

    // Validate key formats
    if (!publishableKey.startsWith('pk_')) {
      return NextResponse.json(
        { error: "Invalid publishable key format. Must start with pk_test_ or pk_live_" },
        { status: 400 }
      )
    }

    if (!secretKey.startsWith('sk_')) {
      return NextResponse.json(
        { error: "Invalid secret key format. Must start with sk_test_ or sk_live_" },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_URL}/integrations/stripe/connect/`, {
      method: 'POST',
      headers: getAuthHeaders(request),
      body: JSON.stringify({
        publishable_key: publishableKey,
        secret_key: secretKey,
        webhook_secret: webhookSecret || '',
        auto_capture: autoCapture !== undefined ? autoCapture : true,
        enable_webhooks: enableWebhooks !== undefined ? enableWebhooks : true,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to connect to Stripe" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Stripe connection error:", error)
    return NextResponse.json(
      { error: "Failed to connect to Stripe" },
      { status: 500 }
    )
  }
}

// DELETE /api/integrations/stripe/connect - Disconnect from Stripe
export async function DELETE(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/integrations/stripe/connect/`, {
      method: 'DELETE',
      headers: getAuthHeaders(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to disconnect from Stripe" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Stripe disconnection error:", error)
    return NextResponse.json(
      { error: "Failed to disconnect from Stripe" },
      { status: 500 }
    )
  }
}

