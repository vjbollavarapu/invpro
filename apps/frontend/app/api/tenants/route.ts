import { NextResponse } from "next/server"

// POST /api/tenants - Create a new tenant
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyName, companyEmail } = body

    // Validate required fields
    if (!companyName || !companyEmail) {
      return NextResponse.json({ error: "Company name and email are required" }, { status: 400 })
    }

    // TODO: Replace with actual database logic
    // Example: Create tenant in database
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const tenant = {
      tenantId,
      companyName,
      companyEmail,
      status: "pending_verification",
      createdAt: new Date().toISOString(),
      subscription: {
        plan: "trial",
        status: "active",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
      },
    }

    console.log("[v0] Created tenant:", tenant)

    return NextResponse.json(
      {
        success: true,
        tenantId: tenant.tenantId,
        message: "Tenant created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating tenant:", error)
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 })
  }
}

// GET /api/tenants - Get all tenants (admin only)
export async function GET(request: Request) {
  try {
    // TODO: Add authentication check
    // TODO: Replace with actual database query

    const mockTenants = [
      {
        tenantId: "tenant_1",
        companyName: "Acme Corporation",
        companyEmail: "contact@acme.com",
        status: "active",
        createdAt: new Date().toISOString(),
        userCount: 15,
        subscription: {
          plan: "professional",
          status: "active",
        },
      },
      {
        tenantId: "tenant_2",
        companyName: "TechStart Inc",
        companyEmail: "hello@techstart.com",
        status: "active",
        createdAt: new Date().toISOString(),
        userCount: 8,
        subscription: {
          plan: "starter",
          status: "active",
        },
      },
    ]

    return NextResponse.json({ tenants: mockTenants })
  } catch (error) {
    console.error("[v0] Error fetching tenants:", error)
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
  }
}
