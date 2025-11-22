'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { DemoLayout } from '@/components/demos/DemoLayout'
import { ControlPanel, Toggle, Button } from '@/components/demos/ControlPanel'
import { MetricCard } from '@/components/shared/MetricCard'
import { LineChart } from '@/components/shared/LineChart'
import { Timer, MousePointer, Clock } from 'lucide-react'

function useDebounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        func(...args)
      }, delay)
    }) as T,
    [func, delay]
  )
}

export default function DebounceDemo() {
  const [useDebounceEnabled, setUseDebounceEnabled] = useState(false)
  const [requestCount, setRequestCount] = useState(0)
  const [triggerCount, setTriggerCount] = useState(0)
  const [requestTimeline, setRequestTimeline] = useState<
    Array<{ time: number; value: number }>
  >([])
  const startTimeRef = useRef<number>(0)

  const handleClick = useCallback(() => {
    setTriggerCount((prev) => prev + 1)
    const now = performance.now()
    const elapsed = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0

    if (!useDebounceEnabled) {
      // Immediate execution
      setRequestCount((prev) => {
        const newCount = prev + 1
        setRequestTimeline((prevTimeline) => [
          ...prevTimeline,
          { time: elapsed, value: newCount },
        ])
        return newCount
      })
    }
  }, [useDebounceEnabled])

  const debouncedHandleClick = useDebounce(() => {
    setRequestCount((prev) => {
      const newCount = prev + 1
      const now = performance.now()
      const elapsed = startTimeRef.current
        ? (now - startTimeRef.current) / 1000
        : 0
      setRequestTimeline((prevTimeline) => [
        ...prevTimeline,
        { time: elapsed, value: newCount },
      ])
      return newCount
    })
  }, 500)

  const handleClickWithDebounce = useCallback(() => {
    setTriggerCount((prev) => prev + 1)
    debouncedHandleClick()
  }, [debouncedHandleClick])

  const handleStart = () => {
    setRequestCount(0)
    setTriggerCount(0)
    setRequestTimeline([])
    startTimeRef.current = performance.now()
  }

  return (
    <DemoLayout
      title="Debounce"
      description="Compare immediate event handling vs debounced event handling to reduce excessive function calls"
    >
      <ControlPanel title="Controls">
        <Toggle
          label="Debounce Enabled"
          checked={useDebounceEnabled}
          onCheckedChange={setUseDebounceEnabled}
        />
        <Button onClick={handleStart}>Reset</Button>
      </ControlPanel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Trigger Count"
          value={triggerCount}
          icon={<MousePointer className="h-4 w-4" />}
        />
        <MetricCard
          title="Request Count"
          value={requestCount}
          icon={<Timer className="h-4 w-4" />}
        />
        <MetricCard
          title="Debounce Delay"
          value={useDebounceEnabled ? '500ms' : '0ms'}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="rounded-lg border border-border bg-background p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Request Timeline</h3>
        <LineChart
          data={requestTimeline}
          dataKey="value"
          color="#f59e0b"
          height={300}
        />
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Test Area</h3>
            <p className="text-sm text-foreground/60 mb-4">
              Click the button rapidly to see the difference between debounced and
              immediate execution
            </p>
          </div>
          <button
            onClick={useDebounceEnabled ? handleClickWithDebounce : handleClick}
            className="w-full py-4 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-lg font-semibold"
          >
            {useDebounceEnabled
              ? 'Click Rapidly (Debounced)'
              : 'Click Rapidly (Immediate)'}
          </button>
          <div className="text-sm text-foreground/60">
            {useDebounceEnabled
              ? 'Debounced: Function executes 500ms after the last click'
              : 'Immediate: Function executes on every click'}
          </div>
        </div>
      </div>
    </DemoLayout>
  )
}

