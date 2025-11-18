import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username } = body

    // Validate input - can use either email or username
    const loginId = username || email
    if (!loginId || !password) {
      return NextResponse.json({ error: "Email/username and password are required" }, { status: 400 })
    }

    // Call Django backend login API
    const backendResponse = await fetch(`${API_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: loginId,
        password: password,
      }),
    })

    if (!backendResponse.ok) {
      const error = await backendResponse.json()
      return NextResponse.json(
        { error: error.error || error.detail || "Login failed" },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()

    // Transform backend response to match frontend expectations
    return NextResponse.json(
      {
        success: true,
        token: data.access,  // JWT access token
        refresh: data.refresh,  // JWT refresh token
        user: {
          id: data.user.id,
          email: data.user.email,
          name: `${data.user.first_name} ${data.user.last_name}`.trim() || data.user.username,
          username: data.user.username,
          tenantId: data.user.tenants[0]?.tenant_id || null,
          tenantName: data.user.tenants[0]?.tenant_name || null,
          role: data.user.tenants[0]?.role || "staff",
          tenants: data.user.tenants,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
