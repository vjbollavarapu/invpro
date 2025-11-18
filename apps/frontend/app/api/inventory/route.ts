import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Transform backend product data to frontend format
function transformProduct(product: any) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    category: product.category,
    quantity: product.quantity,
    unit: product.unit,
    unitCost: product.unit_cost,
    sellingPrice: product.selling_price,
    totalValue: product.total_value || (product.quantity * product.unit_cost),
    reorderLevel: product.reorder_level,
    warehouse: product.warehouse,
    supplier: product.supplier,
    status: product.status,
    stockStatus: product.stock_status || (product.quantity > product.reorder_level ? 'In Stock' : product.quantity > 0 ? 'Low Stock' : 'Out of Stock'),
    lastUpdated: product.updated_at || product.created_at,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }
}

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

// GET /api/inventory - Fetch all inventory items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = searchParams.get("page") || "1"
    const pageSize = searchParams.get("page_size") || "20"
    const stockStatus = searchParams.get("stock_status")

    // Build query string for backend
    const params = new URLSearchParams()
    if (category) params.append("category", category)
    if (status) params.append("status", status)
    if (search) params.append("search", search)
    if (stockStatus) params.append("stock_status", stockStatus)
    params.append("page", page)
    params.append("page_size", pageSize)

    // Call Django backend API
    const backendResponse = await fetch(
      `${API_URL}/inventory/products/?${params.toString()}`,
      {
        headers: getAuthHeaders(request),
      }
    )

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: "Failed to fetch inventory" }))
      return NextResponse.json({ success: false, error: error.error || error.detail }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()

    // Transform backend response to match frontend expectations
    const transformedProducts = (data.results || []).map(transformProduct)
    
    // Calculate pagination info
    const currentPageSize = parseInt(pageSize) || 20
    const currentPage = parseInt(page) || 1
    const totalItems = data.count || 0
    const totalPages = Math.ceil(totalItems / currentPageSize)
    
    return NextResponse.json({
      success: true,
      data: transformedProducts,
      total: totalItems,
      count: totalItems,
      next: data.next,
      previous: data.previous,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: totalPages,
    })
  } catch (error) {
    console.error("Inventory fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch inventory" }, { status: 500 })
  }
}

// POST /api/inventory - Add new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Call Django backend API to create product
    const backendResponse = await fetch(`${API_URL}/inventory/products/`, {
      method: 'POST',
      headers: getAuthHeaders(request),
      body: JSON.stringify({
        name: body.name,
        sku: body.sku || `SKU-${Date.now()}`,
        description: body.description || '',
        category: body.category || '',
        unit: body.unit || 'pcs',
        unit_cost: body.unitCost || body.unit_cost || 0,
        selling_price: body.sellingPrice || body.selling_price || 0,
        quantity: body.quantity || 0,
        reorder_level: body.reorderLevel || body.reorder_level || 0,
        status: 'active',
        supplier: body.supplier || null,
      }),
    })

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: "Failed to add product" }))
      return NextResponse.json(
        { success: false, error: error.error || error.detail },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
      data: data,
    })
  } catch (error) {
    console.error("Product creation error:", error)
    return NextResponse.json({ success: false, error: "Failed to add product" }, { status: 500 })
  }
}
