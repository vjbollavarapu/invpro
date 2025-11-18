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

// GET /api/notifications - Fetch all notifications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const type = searchParams.get("type")
    const page = searchParams.get("page") || "1"
    const pageSize = searchParams.get("page_size") || "20"

    // Build query string for backend
    const params = new URLSearchParams()
    if (unreadOnly) params.append("unread_only", "true")
    if (type) params.append("type", type)
    params.append("page", page)
    params.append("page_size", pageSize)

    // Call Django backend API
    const backendResponse = await fetch(
      `${API_URL}/notifications/notifications/?${params.toString()}`,
      {
        headers: getAuthHeaders(request),
      }
    )

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: "Failed to fetch notifications" }))
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
      meta: {
        total: totalItems,
        unread: data.results?.filter((n: any) => !n.read).length || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(
      `${API_URL}/notifications/notifications/`,
      {
        method: 'POST',
        headers: getAuthHeaders(request),
        body: JSON.stringify(body),
      }
    )

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: "Failed to create notification" }))
      return NextResponse.json({ success: false, error: error.error || error.detail }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json({ success: true, data, message: "Notification created successfully" })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ success: false, error: "Failed to create notification" }, { status: 500 })
  }
}