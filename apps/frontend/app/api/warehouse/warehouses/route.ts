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

// GET /api/warehouse/warehouses - Fetch all warehouses
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const page = searchParams.get("page") || "1"
    const pageSize = searchParams.get("page_size") || "20"

    // Build query string for backend
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (status) params.append("status", status)
    params.append("page", page)
    params.append("page_size", pageSize)

    // Call Django backend API
    const backendResponse = await fetch(
      `${API_URL}/warehouse/warehouses/?${params.toString()}`,
      {
        headers: getAuthHeaders(request),
      }
    )

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: "Failed to fetch warehouses" }))
      return NextResponse.json({ success: false, error: error.error || error.detail }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()

    // Calculate pagination info
    const currentPageSize = parseInt(pageSize) || 20
    const currentPage = parseInt(page) || 1
    const totalItems = data.count || 0
    const totalPages = Math.ceil(totalItems / currentPageSize)

    return NextResponse.json({
      success: true,
      data: data.results || [],
      total: totalItems,
      count: totalItems,
      next: data.next,
      previous: data.previous,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: totalPages,
    })
  } catch (error) {
    console.error("Warehouses fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch warehouses" }, { status: 500 })
  }
}

// POST /api/warehouse/warehouses - Create new warehouse
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(
      `${API_URL}/warehouse/warehouses/`,
      {
        method: 'POST',
        headers: getAuthHeaders(request),
        body: JSON.stringify(body),
      }
    )

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: "Failed to create warehouse" }))
      return NextResponse.json({ success: false, error: error.error || error.detail }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Warehouse creation error:", error)
    return NextResponse.json({ success: false, error: "Failed to create warehouse" }, { status: 500 })
  }
}
