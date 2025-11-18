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

    // TODO: Implement sync endpoint in backend or trigger Celery task directly
    // For now, return a placeholder response
    return NextResponse.json(
      { message: "Sync endpoint not yet implemented. Use Celery tasks directly." },
      { status: 501 }
    )
  } catch (error) {
    console.error("Shopify sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync Shopify data" },
      { status: 500 }
    )
  }
}
