import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const authHeader = request.headers.get('authorization')
    const tenantId = request.headers.get('x-tenant-id')

    const response = await fetch(`${API_URL}/api/pharma/products/?${searchParams}`, {
      headers: {
        'Authorization': authHeader || '',
        'X-Tenant-ID': tenantId || '',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch drug products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const tenantId = request.headers.get('x-tenant-id')
    const body = await request.json()

    const response = await fetch(`${API_URL}/api/pharma/products/`, {
      method: 'POST',
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
    return NextResponse.json({ error: 'Failed to create drug product' }, { status: 500 })
  }
}

