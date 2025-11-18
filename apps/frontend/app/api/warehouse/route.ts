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

// GET /api/warehouse - Get all warehouses
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const response = await fetch(
      `${API_URL}/warehouse/warehouses/?${searchParams}`,
      { headers: getAuthHeaders(request) }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to fetch warehouses" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      warehouses: data.results || [],
      count: data.count || 0,
    })
  } catch (error) {
    console.error("Error fetching warehouses:", error)
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 })
  }
}

// POST /api/warehouse - Create new warehouse
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${API_URL}/warehouse/warehouses/`, {
      method: 'POST',
      headers: getAuthHeaders(request),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to create warehouse" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ warehouse: data }, { status: 201 })
  } catch (error) {
    console.error("Error creating warehouse:", error)
    return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 })
  }
}

// PATCH /api/warehouse - Update warehouse
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Warehouse ID is required" }, { status: 400 })
    }

    const response = await fetch(`${API_URL}/warehouse/warehouses/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(request),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || error.detail || "Failed to update warehouse" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ warehouse: data })
  } catch (error) {
    console.error("Error updating warehouse:", error)
    return NextResponse.json({ error: "Failed to update warehouse" }, { status: 500 })
  }
}
