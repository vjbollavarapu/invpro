import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const tenantId = request.headers.get('x-tenant-id')

    const response = await fetch(`${API_URL}/api/tenant/industry/`, {
      headers: {
        'Authorization': authHeader || '',
        'X-Tenant-ID': tenantId || '',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tenant industry' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const tenantId = request.headers.get('x-tenant-id')
    const body = await request.json()

    const response = await fetch(`${API_URL}/api/tenant/industry/`, {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader || '',
        'X-Tenant-ID': tenantId || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tenant industry' }, { status: 500 })
  }
}

