import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const tenantId = request.headers.get('x-tenant-id')
    const body = await request.json().catch(() => ({}))

    const response = await fetch(`${API_URL}/api/pharma/batches/${params.id}/approve/`, {
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
    return NextResponse.json({ error: 'Failed to approve batch' }, { status: 500 })
  }
}

