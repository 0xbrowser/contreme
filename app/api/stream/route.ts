import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let count = 0
      const interval = setInterval(() => {
        const data = {
          id: `msg-${count++}`,
          price: 100 + Math.random() * 10,
          timestamp: Date.now(),
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        )

        // Stop after 1000 messages
        if (count >= 1000) {
          clearInterval(interval)
          controller.close()
        }
      }, 50) // 50ms = ~20 messages per second
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

