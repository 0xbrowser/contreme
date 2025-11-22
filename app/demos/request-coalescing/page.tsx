'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { DemoLayout } from '@/components/demos/DemoLayout'
import { ControlPanel, Toggle, Button } from '@/components/demos/ControlPanel'
import { MetricCard } from '@/components/shared/MetricCard'
import { BarChart } from '@/components/shared/BarChart'
import { Network, Clock, Zap, Package } from 'lucide-react'

interface ClientRequest {
  id: number
  timestamp: number
  status: 'pending' | 'completed'
  batchId?: number // Which server request batch this belongs to
}

interface ServerRequest {
  id: number
  timestamp: number
  status: 'pending' | 'completed'
  clientRequestIds: number[] // Which client requests are in this batch
}

export default function RequestCoalescingDemo() {
  const [useBatching, setUseBatching] = useState(false)
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([])
  const [serverRequests, setServerRequests] = useState<ServerRequest[]>([])
  const [metrics, setMetrics] = useState({
    clientRequestCount: 0,
    serverRequestCount: 0,
    savedRequests: 0,
    reductionRate: 0,
    totalTime: 0,
    serverQPS: 0,
  })
  const [requestChart, setRequestChart] = useState<
    Array<{ name: string; clientRequests: number; serverRequests: number }>
  >([])
  const pendingClientRequestsRef = useRef<ClientRequest[]>([])
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const serverRequestIdRef = useRef(0)
  const serverRequestCountRef = useRef(0)

  // Simulate sending a batch of requests to server
  const sendBatchToServer = useCallback(async (clientRequestIds: number[]) => {
    // Simulate network latency for batch request
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 50))
    return clientRequestIds
  }, [])

  const processBatch = useCallback(async () => {
    if (pendingClientRequestsRef.current.length === 0) return

    const batch = [...pendingClientRequestsRef.current]
    pendingClientRequestsRef.current = []
    const batchStart = performance.now()

    // Create a server request for this batch
    const serverRequestId = ++serverRequestIdRef.current
    const clientRequestIds = batch.map((r) => r.id)

    const serverRequest: ServerRequest = {
      id: serverRequestId,
      timestamp: performance.now(),
      status: 'pending',
      clientRequestIds,
    }

    setServerRequests((prev) => [...prev, serverRequest])

    // Send batch to server (simulate)
    const completedClientIds = await sendBatchToServer(clientRequestIds)
    const batchTime = performance.now() - batchStart

    // Update server request status
    setServerRequests((prev) =>
      prev.map((r) =>
        r.id === serverRequestId ? { ...r, status: 'completed' as const } : r
      )
    )

    // Update all client requests in this batch
    setClientRequests((prev) =>
      prev.map((r) =>
        completedClientIds.includes(r.id)
          ? { ...r, status: 'completed' as const, batchId: serverRequestId }
          : r
      )
    )

    // Update metrics
    serverRequestCountRef.current++
    const elapsed = (performance.now() - startTimeRef.current) / 1000
    const serverQPS = serverRequestCountRef.current / elapsed

    setMetrics((prev) => ({
      ...prev,
      serverRequestCount: serverRequestCountRef.current,
      savedRequests: prev.clientRequestCount - serverRequestCountRef.current,
      reductionRate:
        prev.clientRequestCount > 0
          ? ((prev.clientRequestCount - serverRequestCountRef.current) /
              prev.clientRequestCount) *
            100
          : 0,
      totalTime: elapsed * 1000,
      serverQPS: Math.max(prev.serverQPS, serverQPS),
    }))

    // Update chart
    setRequestChart((prev) => {
      const newEntry = {
        name: `Batch ${serverRequestId}`,
        clientRequests: batch.length,
        serverRequests: 1,
      }
      return [...prev, newEntry].slice(-20)
    })

    // If there are more pending requests, schedule another batch
    if (pendingClientRequestsRef.current.length > 0) {
      batchTimeoutRef.current = setTimeout(() => {
        processBatch()
      }, 200)
    }
  }, [sendBatchToServer])

  const handleSendRequests = useCallback(() => {
    const count = 20
    startTimeRef.current = performance.now()
    setClientRequests([])
    setServerRequests([])
    setMetrics({
      clientRequestCount: 0,
      serverRequestCount: 0,
      savedRequests: 0,
      reductionRate: 0,
      totalTime: 0,
      serverQPS: 0,
    })
    setRequestChart([])
    serverRequestIdRef.current = 0
    serverRequestCountRef.current = 0

    // Clear any existing pending requests
    pendingClientRequestsRef.current = []
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
      batchTimeoutRef.current = null
    }

    // Create client requests
    const clientReqs: ClientRequest[] = []
    for (let i = 0; i < count; i++) {
      clientReqs.push({
        id: i + 1,
        timestamp: performance.now(),
        status: 'pending',
      })
    }
    setClientRequests(clientReqs)
    setMetrics((prev) => ({ ...prev, clientRequestCount: count }))

    if (useBatching) {
      // Add to pending batch queue
      pendingClientRequestsRef.current = [...clientReqs]

      // Process batch after 200ms
      batchTimeoutRef.current = setTimeout(() => {
        processBatch()
      }, 200)
    } else {
      // Send each request individually to server (1:1 mapping)
      clientReqs.forEach((clientReq) => {
        const serverRequestId = ++serverRequestIdRef.current
        const serverRequest: ServerRequest = {
          id: serverRequestId,
          timestamp: performance.now(),
          status: 'pending',
          clientRequestIds: [clientReq.id],
        }

        setServerRequests((prev) => [...prev, serverRequest])

        sendBatchToServer([clientReq.id]).then(() => {
          // Update server request
          setServerRequests((prev) =>
            prev.map((r) =>
              r.id === serverRequestId
                ? { ...r, status: 'completed' as const }
                : r
            )
          )

          // Update client request
          setClientRequests((prev) =>
            prev.map((r) =>
              r.id === clientReq.id
                ? { ...r, status: 'completed' as const, batchId: serverRequestId }
                : r
            )
          )

          // Update metrics
          serverRequestCountRef.current++
          const elapsed = (performance.now() - startTimeRef.current) / 1000
          const serverQPS = serverRequestCountRef.current / elapsed

          setMetrics((prev) => ({
            ...prev,
            serverRequestCount: serverRequestCountRef.current,
            savedRequests: 0, // No savings in individual mode
            reductionRate: 0,
            totalTime: elapsed * 1000,
            serverQPS: Math.max(prev.serverQPS, serverQPS),
          }))

          // Update chart
          setRequestChart((prev) => {
            const newEntry = {
              name: `Req ${clientReq.id}`,
              clientRequests: 1,
              serverRequests: 1,
            }
            return [...prev, newEntry].slice(-20)
          })
        })
      })
    }
  }, [useBatching, sendBatchToServer, processBatch])

  // Clear pending requests when switching modes
  useEffect(() => {
    // When switching modes, clear any existing pending requests in the batch queue
    pendingClientRequestsRef.current = []
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
      batchTimeoutRef.current = null
    }
  }, [useBatching])

  const completedClientCount = clientRequests.filter(
    (r) => r.status === 'completed'
  ).length
  const pendingClientCount = clientRequests.filter(
    (r) => r.status === 'pending'
  ).length
  const completedServerCount = serverRequests.filter(
    (r) => r.status === 'completed'
  ).length
  const pendingServerCount = serverRequests.filter(
    (r) => r.status === 'pending'
  ).length

  return (
    <DemoLayout
      title="Request Coalescing / Batching"
      description="Compare individual API requests vs batched requests to reduce network overhead"
    >
      <ControlPanel title="Controls">
        <Toggle
          label="Request Batching"
          checked={useBatching}
          onCheckedChange={setUseBatching}
        />
        <Button onClick={handleSendRequests}>Send 20 Requests</Button>
      </ControlPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Client Requests"
          value={metrics.clientRequestCount}
          icon={<Network className="h-4 w-4" />}
        />
        <MetricCard
          title="Server Requests"
          value={metrics.serverRequestCount}
          icon={<Zap className="h-4 w-4" />}
        />
        {useBatching && metrics.savedRequests > 0 && (
          <MetricCard
            title="Requests Saved"
            value={`${metrics.savedRequests} (${metrics.reductionRate.toFixed(1)}%)`}
            icon={<Package className="h-4 w-4" />}
          />
        )}
        <MetricCard
          title="Server QPS"
          value={metrics.serverQPS.toFixed(1)}
          icon={<Network className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Time"
          value={metrics.totalTime.toFixed(0)}
          unit="ms"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          title="Client Completed"
          value={completedClientCount}
          icon={<Zap className="h-4 w-4" />}
        />
      </div>

      <div className="rounded-lg border border-border bg-background p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Request Comparison</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground/60 mb-2">
              Client Requests (Blue) vs Server Requests (Green)
            </p>
            <BarChart
              data={requestChart.map((item) => ({
                name: item.name,
                value: item.clientRequests,
              }))}
              color="#f59e0b"
              height={200}
            />
          </div>
          {useBatching && (
            <div>
              <p className="text-sm text-foreground/60 mb-2">
                Server Requests (Reduced)
              </p>
              <BarChart
                data={requestChart.map((item) => ({
                  name: item.name,
                  value: item.serverRequests,
                }))}
                color="#10b981"
                height={200}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-4">Client Requests</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-96 overflow-y-auto">
            {clientRequests.map((request) => (
              <div
                key={request.id}
                className={`p-3 rounded border ${
                  request.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-yellow-500/10 border-yellow-500/20'
                }`}
              >
                <div className="text-sm font-semibold">#{request.id}</div>
                <div
                  className={`text-xs mt-1 ${
                    request.status === 'completed'
                      ? 'text-green-500'
                      : 'text-yellow-500'
                  }`}
                >
                  {request.status}
                </div>
                {request.batchId && (
                  <div className="text-xs mt-1 text-foreground/60">
                    Batch: {request.batchId}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-4">Server Requests</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            {serverRequests.map((request) => (
              <div
                key={request.id}
                className={`p-3 rounded border ${
                  request.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-yellow-500/10 border-yellow-500/20'
                }`}
              >
                <div className="text-sm font-semibold">Server #{request.id}</div>
                <div
                  className={`text-xs mt-1 ${
                    request.status === 'completed'
                      ? 'text-green-500'
                      : 'text-yellow-500'
                  }`}
                >
                  {request.status}
                </div>
                <div className="text-xs mt-1 text-foreground/60">
                  {request.clientRequestIds.length} client req
                  {request.clientRequestIds.length > 1 ? 's' : ''}
                </div>
                <div className="text-xs mt-1 text-foreground/40">
                  IDs: {request.clientRequestIds.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background p-4">
        <p className="text-sm text-foreground/60">
          {useBatching ? (
            <>
              <strong>Request Coalescing Enabled:</strong> Multiple client requests
              are merged into fewer server requests, reducing server load and network
              overhead. In this example, {metrics.clientRequestCount} client requests
              are sent as {metrics.serverRequestCount} server requests, saving{' '}
              {metrics.savedRequests} requests ({metrics.reductionRate.toFixed(1)}%
              reduction).
            </>
          ) : (
            <>
              <strong>Individual Mode:</strong> Each client request is sent as a
              separate server request (1:1 mapping). This can cause high server load
              under concurrent requests.
            </>
          )}
        </p>
      </div>
    </DemoLayout>
  )
}

