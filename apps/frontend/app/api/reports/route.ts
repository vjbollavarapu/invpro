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

// GET /api/reports - Get comprehensive reports data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get("type") || "overview"
    const period = searchParams.get("period") || "30" // days

    // Map report types to backend endpoints
    const endpointMap: Record<string, string> = {
      'overview': '/dashboard/overview/',
      'inventory': '/dashboard/inventory_stats/',
      'sales': '/dashboard/sales_stats/',
      'procurement': '/dashboard/procurement_stats/',
      'warehouse': '/dashboard/warehouse_stats/',
      'finance': '/dashboard/finance_stats/',
    }

    const backendEndpoint = endpointMap[reportType] || endpointMap['overview']

    // Call Django backend API
    const backendResponse = await fetch(
      `${API_URL}${backendEndpoint}`,
      {
        headers: getAuthHeaders(request),
      }
    )

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: "Failed to fetch reports data" }))
      return NextResponse.json({ success: false, error: error.error || error.detail }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()

    return NextResponse.json({
      success: true,
      data: data,
      reportType: reportType,
      period: period,
    })
  } catch (error) {
    console.error("Reports fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch reports data" }, { status: 500 })
  }
}

// POST /api/reports/export - Export reports data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportType, format = 'json', filters = {} } = body

    // Get the data first
    const searchParams = new URLSearchParams()
    searchParams.append('type', reportType)
    if (filters.period) searchParams.append('period', filters.period)

    const dataResponse = await fetch(
      `${API_URL}/dashboard/${reportType}_stats/?${searchParams.toString()}`,
      {
        headers: getAuthHeaders(request),
      }
    )

    if (!dataResponse.ok) {
      const error = await dataResponse.json().catch(() => ({ error: "Failed to fetch data for export" }))
      return NextResponse.json({ success: false, error: error.error || error.detail }, { status: dataResponse.status })
    }

    const data = await dataResponse.json()

    // For now, return JSON format
    // In a real implementation, you would generate CSV, PDF, etc.
    return NextResponse.json({
      success: true,
      data: data,
      format: format,
      exportedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Reports export error:", error)
    return NextResponse.json({ success: false, error: "Failed to export reports" }, { status: 500 })
  }
}
