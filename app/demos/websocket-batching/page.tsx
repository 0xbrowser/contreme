'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DemoLayout } from '@/components/demos/DemoLayout'
import { ControlPanel, Toggle, Button } from '@/components/demos/ControlPanel'
import { MetricCard } from '@/components/shared/MetricCard'
import { LineChart } from '@/components/shared/LineChart'
import { Activity, Database, Clock, Layers } from 'lucide-react'

interface Message {
  id: string
  price: number
  timestamp: number
}

export default function WebSocketBatchingDemo() {
  const [isRunning, setIsRunning] = useState(false)
  const [isBatched, setIsBatched] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [metrics, setMetrics] = useState({
    totalUpdates: 0,
    renderedRows: 0,
    queueLength: 0,
    setStateCalls: 0,
    batchTime: 0,
  })
  const [fpsData, setFpsData] = useState<Array<{ time: number; value: number }>>([])
  
  const queueRef = useRef<Message[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())
  const setStateCountRef = useRef(0)

  const processBatch = useCallback(() => {
    if (queueRef.current.length === 0) return

    const batchStart = performance.now()
    const batch = [...queueRef.current]
    queueRef.current = []

    setMessages((prev) => {
      const newMessages = [...prev, ...batch].slice(-1000) // Keep last 1000
      setStateCountRef.current++
      return newMessages
    })

    const batchTime = performance.now() - batchStart
    setMetrics((prev) => ({
      ...prev,
      queueLength: 0,
      batchTime,
      setStateCalls: setStateCountRef.current,
    }))
  }, [])

  const addMessage = useCallback((message: Message) => {
    if (isBatched) {
      queueRef.current.push(message)
      setMetrics((prev) => ({
        ...prev,
        queueLength: queueRef.current.length,
        totalUpdates: prev.totalUpdates + 1,
      }))
    } else {
      setMessages((prev) => {
        const newMessages = [...prev, message].slice(-1000)
        setStateCountRef.current++
        return newMessages
      })
      setMetrics((prev) => ({
        ...prev,
        totalUpdates: prev.totalUpdates + 1,
        setStateCalls: setStateCountRef.current,
      }))
    }
  }, [isBatched])

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current)
      return
    }

    startTimeRef.current = performance.now()

    // Generate messages at high frequency
    intervalRef.current = setInterval(() => {
      for (let i = 0; i < 100; i++) {
        addMessage({
          id: `${Date.now()}-${i}`,
          price: 100 + Math.random() * 10,
          timestamp: Date.now(),
        })
      }
    }, 50) // 100 messages every 50ms = ~2000 messages/sec

    // Batch processing
    if (isBatched) {
      const processBatchInterval = () => {
        processBatch()
        batchTimeoutRef.current = setTimeout(processBatchInterval, 100) // Process every 100ms
      }
      processBatchInterval()
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current)
    }
  }, [isRunning, isBatched, addMessage, processBatch])

  // FPS tracking
  useEffect(() => {
    if (!isRunning) return

    let animationFrameId: number
    const measureFPS = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      const elapsed = currentTime - lastFpsTimeRef.current

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed)
        setFpsData((prev) => [...prev, { time: prev.length, value: fps }].slice(-60))
        frameCountRef.current = 0
        lastFpsTimeRef.current = currentTime
      }

      animationFrameId = requestAnimationFrame(measureFPS)
    }

    animationFrameId = requestAnimationFrame(measureFPS)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [isRunning])

  useEffect(() => {
    setMetrics((prev) => ({
      ...prev,
      renderedRows: messages.length,
    }))
  }, [messages.length])

  const handleStart = () => {
    setIsRunning(true)
    setMessages([])
    setMetrics({
      totalUpdates: 0,
      renderedRows: 0,
      queueLength: 0,
      setStateCalls: 0,
      batchTime: 0,
    })
    setFpsData([])
    setStateCountRef.current = 0
  }

  const handleStop = () => {
    setIsRunning(false)
    if (isBatched) {
      processBatch() // Process remaining messages
    }
  }

  return (
    <DemoLayout
      title="WebSocket Batching"
      description="Compare immediate WebSocket updates vs batched updates for high-frequency data streams"
    >
      <ControlPanel title="Controls">
        <Toggle
          label="Batched Updates"
          checked={isBatched}
          onCheckedChange={setIsBatched}
        />
        <Button onClick={handleStart} disabled={isRunning}>
          Start
        </Button>
        <Button onClick={handleStop} disabled={!isRunning} variant="secondary">
          Stop
        </Button>
      </ControlPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Updates"
          value={metrics.totalUpdates.toLocaleString()}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          title="Rendered Rows"
          value={metrics.renderedRows.toLocaleString()}
          icon={<Database className="h-4 w-4" />}
        />
        <MetricCard
          title="Queue Length"
          value={metrics.queueLength}
          icon={<Layers className="h-4 w-4" />}
        />
        <MetricCard
          title="setState Calls"
          value={metrics.setStateCalls.toLocaleString()}
          icon={<Clock className="h-4 w-4" />}
        />
        {isBatched && (
          <MetricCard
            title="Batch Time"
            value={metrics.batchTime.toFixed(2)}
            unit="ms"
            icon={<Clock className="h-4 w-4" />}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-4">FPS Over Time</h3>
          <LineChart data={fpsData} dataKey="value" color="#f59e0b" />
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-4">Message Queue</h3>
          <LineChart
            data={[{ time: 0, value: metrics.queueLength }]}
            dataKey="value"
            color="#10b981"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <h3 className="text-lg font-semibold mb-4">Message Stream (Last 100)</h3>
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-1">
            {messages.slice(-100).map((msg) => (
              <div
                key={msg.id}
                className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
              >
                <span>ID: {msg.id.slice(-8)}</span>
                <span className="font-mono">${msg.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoLayout>
  )
}

