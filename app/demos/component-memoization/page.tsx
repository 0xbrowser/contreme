'use client'

import { useState, useMemo, memo, useEffect, useRef } from 'react'
import { DemoLayout } from '@/components/demos/DemoLayout'
import { ControlPanel, Toggle, Button } from '@/components/demos/ControlPanel'
import { MetricCard } from '@/components/shared/MetricCard'
import { BarChart } from '@/components/shared/BarChart'
import { Layers, RefreshCw, Clock } from 'lucide-react'

interface ChildComponentProps {
  id: number
  value: number
  renderCount: { current: number }
}

// Regular component
function RegularChild({ id, value, renderCount }: ChildComponentProps) {
  renderCount.current++
  return (
    <div className="p-3 rounded border border-border bg-muted/50">
      <div className="text-sm font-semibold">Item {id}</div>
      <div className="text-xs text-foreground/60">Value: {value}</div>
      <div className="text-xs text-foreground/60">
        Renders: {renderCount.current}
      </div>
    </div>
  )
}

// Memoized component
const MemoizedChild = memo(function MemoizedChild({
  id,
  value,
  renderCount,
}: ChildComponentProps) {
  renderCount.current++
  return (
    <div className="p-3 rounded border border-border bg-muted/50">
      <div className="text-sm font-semibold">Item {id}</div>
      <div className="text-xs text-foreground/60">Value: {value}</div>
      <div className="text-xs text-foreground/60">
        Renders: {renderCount.current}
      </div>
    </div>
  )
})

export default function ComponentMemoizationDemo() {
  const [useMemoization, setUseMemoization] = useState(false)
  const [parentCounter, setParentCounter] = useState(0)
  const [childValues, setChildValues] = useState<number[]>(
    Array.from({ length: 20 }, () => Math.random() * 100)
  )
  const [metrics, setMetrics] = useState({
    totalRenders: 0,
    skippedRenders: 0,
    diffTime: 0,
  })

  const renderCountsRef = useRef<{ [key: number]: number }>({})
  const renderCountObjectsRef = useRef<{ [key: number]: { current: number } }>({})
  const skippedRendersRef = useRef(0)
  const lastTotalRendersRef = useRef(0)
  const renderStartTimeRef = useRef<number | null>(null)

  // Initialize render counts
  useEffect(() => {
    childValues.forEach((_, i) => {
      if (!renderCountsRef.current[i]) {
        renderCountsRef.current[i] = 0
      }
      if (!renderCountObjectsRef.current[i]) {
        renderCountObjectsRef.current[i] = { current: 0 }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childValues.length])

  const handleUpdateParent = () => {
    // Record start time before state update
    renderStartTimeRef.current = performance.now()
    setParentCounter((prev) => prev + 1)
  }

  const handleUpdateChild = (index: number) => {
    setChildValues((prev) => {
      const newValues = [...prev]
      newValues[index] = Math.random() * 100
      return newValues
    })
  }

  // Track baseline renders when memoization is enabled
  const memoizationBaselineRef = useRef<{ totalRenders: number; parentCounter: number } | null>(null)
  const prevMemoizationRef = useRef(useMemoization)

  // Calculate metrics
  useEffect(() => {
    // Sync renderCountObjectsRef values to renderCountsRef for metrics
    Object.keys(renderCountObjectsRef.current).forEach((key) => {
      const index = Number(key)
      renderCountsRef.current[index] = renderCountObjectsRef.current[index].current
    })
    
    const totalRenders = Object.values(renderCountsRef.current).reduce(
      (sum, count) => sum + count,
      0
    )
    
    // Measure render time if we have a start time
    if (renderStartTimeRef.current !== null) {
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const renderTime = performance.now() - renderStartTimeRef.current!
          setMetrics((prev) => ({
            ...prev,
            diffTime: renderTime,
          }))
          renderStartTimeRef.current = null
        })
      })
    }
    
    // Handle memoization state changes
    const memoizationJustEnabled = useMemoization && !prevMemoizationRef.current
    const memoizationJustDisabled = !useMemoization && prevMemoizationRef.current
    
    if (memoizationJustEnabled) {
      // Record baseline after memoization is enabled (after component type switch render completes)
      memoizationBaselineRef.current = {
        totalRenders,
        parentCounter,
      }
    } else if (memoizationJustDisabled) {
      // Reset baseline when memoization is disabled
      memoizationBaselineRef.current = null
    }
    
    prevMemoizationRef.current = useMemoization
    
    // Calculate skipped renders: compare with what would happen without memoization
    let skipped = 0
    if (useMemoization && memoizationBaselineRef.current && !memoizationJustEnabled) {
      const baseline = memoizationBaselineRef.current
      const parentCounterSinceBaseline = parentCounter - baseline.parentCounter
      
      if (parentCounterSinceBaseline > 0) {
        // Without memoization: each component would render parentCounterSinceBaseline times
        // (once for each parent update after baseline)
        const expectedAdditionalRenders = childValues.length * parentCounterSinceBaseline
        const actualAdditionalRenders = totalRenders - baseline.totalRenders
        skipped = Math.max(0, expectedAdditionalRenders - actualAdditionalRenders)
      }
    }
    
    skippedRendersRef.current = skipped
    lastTotalRendersRef.current = totalRenders
    
    setMetrics((prev) => ({
      ...prev,
      totalRenders,
      skippedRenders: skipped,
    }))
  }, [parentCounter, childValues, useMemoization])

  const renderData = useMemo(() => {
    return childValues.map((_, i) => ({
      name: `Item ${i + 1}`,
      value: renderCountObjectsRef.current[i]?.current || 0,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childValues.length, metrics.totalRenders])

  const ChildComponent = useMemoization ? MemoizedChild : RegularChild

  return (
    <DemoLayout
      title="Component Memoization"
      description="Compare normal component rendering vs memoized components to prevent unnecessary re-renders"
    >
      <ControlPanel title="Controls">
        <Toggle
          label="Use Memoization"
          checked={useMemoization}
          onCheckedChange={setUseMemoization}
        />
        <Button onClick={handleUpdateParent}>Update Parent State</Button>
      </ControlPanel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Total Renders"
          value={metrics.totalRenders}
          icon={<RefreshCw className="h-4 w-4" />}
        />
        <MetricCard
          title="Skipped Renders"
          value={metrics.skippedRenders}
          icon={<Layers className="h-4 w-4" />}
        />
        <MetricCard
          title="Diff Time"
          value={metrics.diffTime.toFixed(2)}
          unit="ms"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="rounded-lg border border-border bg-background p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Render Count by Component</h3>
        <BarChart data={renderData} color="#f59e0b" height={300} />
      </div>

      <div className="rounded-lg border border-border bg-background p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Child Components</h3>
          <div className="text-sm text-foreground/60">
            Parent Counter: {parentCounter}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {childValues.map((value, index) => {
            const renderCount = renderCountObjectsRef.current[index] || { current: 0 }
            return (
              <div key={index}>
                <ChildComponent
                  id={index + 1}
                  value={value}
                  renderCount={renderCount}
                />
                <button
                  onClick={() => handleUpdateChild(index)}
                  className="mt-2 w-full px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90"
                >
                  Update
                </button>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-sm text-foreground/60">
          {useMemoization
            ? 'Memoized: Only components with changed props will re-render when parent updates'
            : 'Regular: All components re-render when parent updates'}
        </p>
      </div>
    </DemoLayout>
  )
}

