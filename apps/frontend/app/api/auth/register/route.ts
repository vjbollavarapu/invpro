import { NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// POST /api/auth/register - Register a new user
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, username } = body

    // Validate required fields
    const usernameToUse = username || email.split('@')[0]
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Parse name into first_name and last_name
    const nameParts = (name || '').trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Call Django backend register API
    const backendResponse = await fetch(`${API_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: usernameToUse,
        email: email,
        password: password,
        password2: password,
        first_name: firstName,
        last_name: lastName,
      }),
    })

    if (!backendResponse.ok) {
      const error = await backendResponse.json()
      return NextResponse.json(
        { error: error.error || error.detail || "Registration failed" },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()

    return NextResponse.json(
      {
        success: true,
        message: data.message || "User registered successfully",
        token: data.access,
        refresh: data.refresh,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: `${data.user.first_name} ${data.user.last_name}`.trim() || data.user.username,
          username: data.user.username,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
