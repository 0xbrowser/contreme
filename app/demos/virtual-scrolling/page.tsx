'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { DemoLayout } from '@/components/demos/DemoLayout'
import { ControlPanel, Toggle } from '@/components/demos/ControlPanel'
import { MetricCard } from '@/components/shared/MetricCard'
import { LineChart } from '@/components/shared/LineChart'
import { Database, Gauge, Clock } from 'lucide-react'

const ITEM_HEIGHT = 50
const CONTAINER_HEIGHT = 600
const VISIBLE_ITEMS = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT)
const DEFAULT_ITEM_COUNT = 1000

interface ListItem {
  id: number
  symbol: string
  price: number
  change: number
}

export default function VirtualScrollingDemo() {
  const [isVirtualized, setIsVirtualized] = useState(false)
  const [itemCount, setItemCount] = useState(DEFAULT_ITEM_COUNT)
  const [scrollTop, setScrollTop] = useState(0)
  const [fpsData, setFpsData] = useState<Array<{ time: number; value: number }>>([])
  const [domNodes, setDomNodes] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())

  // Generate items based on itemCount
  const items = useMemo(() => {
    return Array.from({ length: itemCount }, (_, i) => ({
      id: i,
      symbol: `STOCK${String(i).padStart(5, '0')}`,
      price: 100 + Math.random() * 50,
      change: (Math.random() - 0.5) * 10,
    }))
  }, [itemCount])

  // Virtual scrolling calculations
  const virtualizedRange = useMemo(() => {
    const start = Math.floor(scrollTop / ITEM_HEIGHT)
    const end = Math.min(start + VISIBLE_ITEMS + 5, items.length) // +5 for buffer
    return { start, end }
  }, [scrollTop, items.length])

  const visibleItems = useMemo(() => {
    if (isVirtualized) {
      return items.slice(virtualizedRange.start, virtualizedRange.end)
    }
    return items
  }, [isVirtualized, items, virtualizedRange])

  // DOM node counting
  useEffect(() => {
    if (containerRef.current) {
      const count = containerRef.current.querySelectorAll('*').length
      setDomNodes(count)
    }
  }, [visibleItems.length, isVirtualized])

  // FPS tracking
  useEffect(() => {
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
  }, [])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  const totalHeight = items.length * ITEM_HEIGHT
  const offsetY = virtualizedRange.start * ITEM_HEIGHT

  return (
    <DemoLayout
      title="Virtual Scrolling"
      description="Compare regular list rendering vs virtualized rendering for large datasets"
    >
      <ControlPanel title="Controls">
        <Toggle
          label="Virtual Scrolling"
          checked={isVirtualized}
          onCheckedChange={setIsVirtualized}
        />
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Item Count:</label>
          <input
            type="number"
            min="100"
            max="100000"
            step="100"
            value={itemCount}
            onChange={(e) => setItemCount(Math.max(100, Math.min(100000, parseInt(e.target.value) || 100)))}
            className="px-3 py-1.5 border border-border rounded-lg bg-background text-foreground w-32 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground/60">
          <button
            onClick={() => setItemCount(1000)}
            className="px-2 py-1 hover:bg-muted rounded"
          >
            1K
          </button>
          <button
            onClick={() => setItemCount(10000)}
            className="px-2 py-1 hover:bg-muted rounded"
          >
            10K
          </button>
          <button
            onClick={() => setItemCount(50000)}
            className="px-2 py-1 hover:bg-muted rounded"
          >
            50K
          </button>
          <button
            onClick={() => setItemCount(100000)}
            className="px-2 py-1 hover:bg-muted rounded"
          >
            100K
          </button>
        </div>
      </ControlPanel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Total Items"
          value={items.length.toLocaleString()}
          icon={<Database className="h-4 w-4" />}
        />
        <MetricCard
          title="DOM Nodes"
          value={domNodes.toLocaleString()}
          icon={<Database className="h-4 w-4" />}
        />
        <MetricCard
          title="Visible Items"
          value={visibleItems.length.toLocaleString()}
          icon={<Gauge className="h-4 w-4" />}
        />
      </div>

      <div className="rounded-lg border border-border bg-background p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">FPS Over Time</h3>
        <LineChart data={fpsData} dataKey="value" color="#f59e0b" />
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <h3 className="text-lg font-semibold mb-4">Scrollable List</h3>
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-auto border border-border rounded"
          style={{ height: CONTAINER_HEIGHT }}
        >
          <div
            style={{
              height: isVirtualized ? totalHeight : 'auto',
              position: 'relative',
            }}
          >
            <div
              style={{
                transform: isVirtualized ? `translateY(${offsetY}px)` : 'none',
              }}
            >
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border-b border-border hover:bg-muted/50"
                  style={{ height: ITEM_HEIGHT }}
                >
                  <div>
                    <div className="font-semibold">{item.symbol}</div>
                    <div className="text-sm text-foreground/60">ID: {item.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">${item.price.toFixed(2)}</div>
                    <div
                      className={`text-sm ${
                        item.change >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {item.change >= 0 ? '+' : ''}
                      {item.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoLayout>
  )
}

