import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { requests } = body

  // Simulate batch processing
  const delay = 50 + Math.random() * 50 // 50-100ms latency

  await new Promise((resolve) => setTimeout(resolve, delay))

  const results = requests.map((req: any, index: number) => ({
    id: req.id || index,
    status: 'completed',
    processedAt: Date.now(),
    data: req.data || {},
  }))

  return Response.json({
    batchId: `batch-${Date.now()}`,
    results,
    processedAt: Date.now(),
    count: results.length,
  })
}

