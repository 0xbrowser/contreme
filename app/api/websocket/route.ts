import { NextRequest } from 'next/server'

// Note: Next.js doesn't support WebSocket in API routes by default
// This is a mock HTTP endpoint that simulates WebSocket behavior
// For real WebSocket support, you'd need a separate WebSocket server

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const count = parseInt(searchParams.get('count') || '10', 10)
  const interval = parseInt(searchParams.get('interval') || '100', 10)

  const messages = Array.from({ length: count }, (_, i) => ({
    id: `ws-${Date.now()}-${i}`,
    price: 100 + Math.random() * 10,
    timestamp: Date.now() + i * interval,
  }))

  return Response.json({ messages })
}

export async function POST(request: NextRequest) {
  // Simulate WebSocket message handling
  const body = await request.json()
  
  // Echo back with timestamp
  return Response.json({
    ...body,
    receivedAt: Date.now(),
    status: 'ok',
  })
}

