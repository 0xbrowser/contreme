'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { DemoLayout } from '@/components/demos/DemoLayout'
import { ControlPanel, Toggle } from '@/components/demos/ControlPanel'
import { MetricCard } from '@/components/shared/MetricCard'
import { BarChart } from '@/components/shared/BarChart'
import { Gauge, Keyboard, Clock, X } from 'lucide-react'

function useThrottle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  const lastRunRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()

      if (now - lastRunRef.current >= delay) {
        lastRunRef.current = now
        func(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now()
          func(...args)
        }, delay - (now - lastRunRef.current))
      }
    }) as T,
    [func, delay]
  )
}

export default function ThrottleDemo() {
  const [useThrottleEnabled, setUseThrottleEnabled] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [requestCount, setRequestCount] = useState(0)
  const [droppedEvents, setDroppedEvents] = useState(0)
  const [requestFrequency, setRequestFrequency] = useState<
    Array<{ name: string; value: number }>
  >([])
  const triggerCountRef = useRef(0)
  const lastRequestTimeRef = useRef<number>(0)

  const handleSearch = useCallback((value: string) => {
    const now = performance.now()
    const timeSinceLastRequest = lastRequestTimeRef.current
      ? now - lastRequestTimeRef.current
      : 0

    setRequestCount((prev) => {
      const newCount = prev + 1
      setRequestFrequency((prevFreq) => {
        const window = Math.floor(timeSinceLastRequest / 100)
        const windowName = `${window * 100}ms`
        const existing = prevFreq.find((f) => f.name === windowName)
        if (existing) {
          existing.value++
        } else {
          prevFreq.push({ name: windowName, value: 1 })
        }
        return prevFreq.slice(-20)
      })
      lastRequestTimeRef.current = now
      return newCount
    })
  }, [])

  const throttledHandleSearch = useThrottle(handleSearch, 1000)

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)
      triggerCountRef.current++

      if (useThrottleEnabled) {
        throttledHandleSearch(value)
      } else {
        handleSearch(value)
      }
    },
    [useThrottleEnabled, throttledHandleSearch, handleSearch]
  )

  useEffect(() => {
    if (useThrottleEnabled) {
      const dropped = Math.max(0, triggerCountRef.current - requestCount)
      setDroppedEvents(dropped)
    } else {
      setDroppedEvents(0)
    }
  }, [useThrottleEnabled, requestCount])

  useEffect(() => {
    if (!useThrottleEnabled) {
      setDroppedEvents(0)
    }
  }, [useThrottleEnabled])

  return (
    <DemoLayout
      title="Throttle"
      description="Compare immediate event handling vs throttled event handling to limit function execution rate"
    >
      <ControlPanel title="Controls">
        <Toggle
          label="Throttle Enabled"
          checked={useThrottleEnabled}
          onCheckedChange={setUseThrottleEnabled}
        />
      </ControlPanel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Input Events"
          value={triggerCountRef.current}
          icon={<Keyboard className="h-4 w-4" />}
        />
        <MetricCard
          title="Request Count"
          value={requestCount}
          icon={<Gauge className="h-4 w-4" />}
        />
        <MetricCard
          title="Dropped Events"
          value={droppedEvents}
          icon={<X className="h-4 w-4" />}
        />
        <MetricCard
          title="Throttle Window"
          value={useThrottleEnabled ? '1000ms' : '0ms'}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="rounded-lg border border-border bg-background p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Request Frequency</h3>
        <BarChart data={requestFrequency} color="#f59e0b" height={300} />
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Search Input</h3>
            <p className="text-sm text-foreground/60 mb-4">
              Type rapidly to see the difference between throttled and immediate
              execution
            </p>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type here to search..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="text-sm text-foreground/60">
            {useThrottleEnabled
              ? 'Throttled: Function executes at most once every 1000ms'
              : 'Immediate: Function executes on every keystroke'}
          </div>
          {inputValue && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-semibold mb-2">Search Results:</div>
              <div className="text-sm text-foreground/70">
                Searching for: &quot;{inputValue}&quot;
              </div>
            </div>
          )}
        </div>
      </div>
    </DemoLayout>
  )
}

