import { type NextRequest, NextResponse } from "next/server"

// Mock subscription plans data
const mockPlans = [
  {
    id: 1,
    name: "Starter",
    price: 49,
    features: ["1 Warehouse", "Basic Reports", "Email Support"],
    description: "Perfect for small businesses getting started",
  },
  {
    id: 2,
    name: "Pro",
    price: 99,
    features: ["5 Warehouses", "AI Forecasting", "Priority Support"],
    description: "Ideal for growing businesses",
  },
  {
    id: 3,
    name: "Enterprise",
    price: 199,
    features: ["Unlimited", "Automation Rules", "Dedicated Manager"],
    description: "For large-scale operations",
  },
]

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    // const plans = await db.query('SELECT * FROM subscription_plans WHERE active = true')

    return NextResponse.json({
      success: true,
      plans: mockPlans,
    })
  } catch (error) {
    console.error("Error fetching subscription plans:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch subscription plans",
      },
      { status: 500 },
    )
  }
}
