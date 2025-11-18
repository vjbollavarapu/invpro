import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const tenantId = request.headers.get('x-tenant-id')

    const response = await fetch(`${API_URL}/api/pharma/packaging-levels/${params.id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader || '',
        'X-Tenant-ID': tenantId || '',
      },
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete packaging level' }, { status: 500 })
  }
}

