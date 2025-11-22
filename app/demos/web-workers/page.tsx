'use client'

import { useState, useRef, useEffect } from 'react'
import { DemoLayout } from '@/components/demos/DemoLayout'
import { ControlPanel, Toggle, Button } from '@/components/demos/ControlPanel'
import { MetricCard } from '@/components/shared/MetricCard'
import { LineChart } from '@/components/shared/LineChart'
import { Cpu, Clock, Zap } from 'lucide-react'

// Heavy computation function
function heavyComputation(size: number): number {
  let result = 0
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result += Math.sqrt(i * j)
    }
  }
  return result
}

export default function WebWorkersDemo() {
  const [useWorker, setUseWorker] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [metrics, setMetrics] = useState({
    executionTime: 0,
    uiResponseTime: 0,
    mainThreadBlocked: false,
  })
  const [fpsData, setFpsData] = useState<Array<{ time: number; value: number }>>([])
  const [cpuData, setCpuData] = useState<Array<{ time: number; value: number }>>([])
  const workerRef = useRef<Worker | null>(null)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())
  const animationFrameRef = useRef<number | null>(null)

  // Create worker
  useEffect(() => {
    const workerCode = `
      self.onmessage = function(e) {
        const { size } = e.data;
        const startTime = performance.now();
        
        let result = 0;
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            result += Math.sqrt(i * j);
          }
        }
        
        const executionTime = performance.now() - startTime;
        self.postMessage({ executionTime, result });
      };
    `
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    workerRef.current = new Worker(URL.createObjectURL(blob))

    workerRef.current.onmessage = (e) => {
      const { executionTime } = e.data
      const uiResponseTime = performance.now() - (window as any).__taskStartTime
      setMetrics({
        executionTime,
        uiResponseTime,
        mainThreadBlocked: false,
      })
      setIsRunning(false)
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  // FPS tracking
  useEffect(() => {
    if (!isRunning) return

    const measureFPS = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      const elapsed = currentTime - lastFpsTimeRef.current

      if (elapsed >= 100) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed)
        setFpsData((prev) => [...prev, { time: prev.length * 0.1, value: fps }].slice(-100))
        frameCountRef.current = 0
        lastFpsTimeRef.current = currentTime
      }

      // Simulate CPU usage
      const cpuUsage = useWorker ? 20 : 95
      setCpuData((prev) => [...prev, { time: prev.length * 0.1, value: cpuUsage }].slice(-100))

      animationFrameRef.current = requestAnimationFrame(measureFPS)
    }

    animationFrameRef.current = requestAnimationFrame(measureFPS)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRunning, useWorker])

  const handleStart = () => {
    setIsRunning(true)
    setMetrics({
      executionTime: 0,
      uiResponseTime: 0,
      mainThreadBlocked: !useWorker,
    })
    setFpsData([])
    setCpuData([])

    const size = 2000 // Computation size

    if (useWorker && workerRef.current) {
      ;(window as any).__taskStartTime = performance.now()
      workerRef.current.postMessage({ size })
    } else {
      // Main thread computation
      const startTime = performance.now()
      ;(window as any).__taskStartTime = startTime
      const result = heavyComputation(size)
      const executionTime = performance.now() - startTime
      const uiResponseTime = executionTime

      setMetrics({
        executionTime,
        uiResponseTime,
        mainThreadBlocked: true,
      })
      setIsRunning(false)
    }
  }

  return (
    <DemoLayout
      title="Web Workers"
      description="Compare heavy computation on main thread vs Web Worker for non-blocking UI"
    >
      <ControlPanel title="Controls">
        <Toggle
          label="Use Web Worker"
          checked={useWorker}
          onCheckedChange={setUseWorker}
        />
        <Button onClick={handleStart} disabled={isRunning}>
          Start Computation
        </Button>
      </ControlPanel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Execution Time"
          value={metrics.executionTime.toFixed(2)}
          unit="ms"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          title="UI Response Time"
          value={metrics.uiResponseTime.toFixed(2)}
          unit="ms"
          icon={<Zap className="h-4 w-4" />}
        />
        <MetricCard
          title="Main Thread"
          value={metrics.mainThreadBlocked ? 'Blocked' : 'Free'}
          icon={<Cpu className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-4">FPS During Computation</h3>
          <LineChart data={fpsData} dataKey="value" color="#f59e0b" />
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-4">CPU Usage</h3>
          <LineChart data={cpuData} dataKey="value" color="#ef4444" />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/70">Interactive UI Test:</span>
            <button
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              onClick={() => alert('UI is responsive!')}
              disabled={isRunning && !useWorker}
            >
              Click Me
            </button>
          </div>
          <p className="text-xs text-foreground/60">
            {isRunning && !useWorker
              ? 'UI is blocked - button may not respond immediately'
              : 'UI is responsive - button responds instantly'}
          </p>
        </div>
      </div>
    </DemoLayout>
  )
}

