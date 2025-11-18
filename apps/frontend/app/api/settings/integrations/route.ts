import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Helper function to get auth headers from request
function getAuthHeaders(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  const tenantId = request.headers.get('x-tenant-id') || request.cookies.get('tenant_id')?.value

  return {
    'Content-Type': 'application/json',
    ...(authorization && { 'Authorization': authorization }),
    ...(tenantId && { 'X-Tenant-ID': tenantId }),
  }
}

// GET /api/settings/integrations - Fetch integration settings
export async function GET(request: NextRequest) {
  try {
    const backendResponse = await fetch(
      `${API_URL}/settings/integrations/`,
      {
        headers: getAuthHeaders(request),
      }
    )

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: "Failed to fetch integrations" }))
      return NextResponse.json({ success: false, error: error.error || error.detail }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error("Integrations fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch integrations" }, { status: 500 })
  }
}

// POST /api/settings/integrations - Create or update integration settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(
      `${API_URL}/settings/integrations/`,
      {
        method: 'POST',
        headers: getAuthHeaders(request),
        body: JSON.stringify(body),
      }
    )

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: "Failed to save integrations" }))
      return NextResponse.json({ success: false, error: error.error || error.detail }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Integrations save error:", error)
    return NextResponse.json({ success: false, error: "Failed to save integrations" }, { status: 500 })
  }
}
