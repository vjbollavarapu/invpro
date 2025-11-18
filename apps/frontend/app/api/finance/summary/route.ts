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

// GET /api/finance/summary - Fetch financial summary and KPIs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month"

    // Fetch data from backend
    const [costCenterSummary, costCenters, expensesByCategory] = await Promise.all([
      fetch(`${API_URL}/finance/cost-centers/summary/`, { headers: getAuthHeaders(request) }),
      fetch(`${API_URL}/finance/cost-centers/`, { headers: getAuthHeaders(request) }),
      fetch(`${API_URL}/finance/expenses/by_category/`, { headers: getAuthHeaders(request) }),
    ])

    let summaryData = {}
    let costCentersData = []
    let expensesData = []

    if (costCenterSummary.ok) {
      summaryData = await costCenterSummary.json()
    }

    if (costCenters.ok) {
      const data = await costCenters.json()
      costCentersData = data.results || data || []
    }

    if (expensesByCategory.ok) {
      expensesData = await expensesByCategory.json()
    }

    // Combine data for frontend
    const summary = {
      totalCost: summaryData.total_actual_cost || 0,
      totalBudget: summaryData.total_budget || 0,
      budgetVariance: summaryData.total_variance || 0,
      period,
      costCenters: costCentersData,
      expensesByCategory: expensesData,
      // TODO: Add profitability data from sales
      profitabilityData: [],
    }

    return NextResponse.json({
      success: true,
      data: summary,
    })
  } catch (error) {
    console.error("Error fetching financial summary:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch financial summary" }, { status: 500 })
  }
}
