'use client'

import { useState, useRef, useEffect } from 'react'
import { DemoLayout } from '@/components/demos/DemoLayout'
import { ControlPanel, Toggle, Button } from '@/components/demos/ControlPanel'
import { MetricCard } from '@/components/shared/MetricCard'
import { LineChart } from '@/components/shared/LineChart'
import { Sparkles, Gauge, Layers, Zap } from 'lucide-react'

interface AnimatedBox {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  opacity: number
  vx: number
  vy: number
  vr: number
  vs: number
}

export default function HardwareAccelerationDemo() {
  const [useHardwareAcceleration, setUseHardwareAcceleration] = useState(false)
  const [elementCount, setElementCount] = useState(40)
  const [isAnimating, setIsAnimating] = useState(false)
  const [fpsData, setFpsData] = useState<Array<{ time: number; value: number }>>([])
  const [metrics, setMetrics] = useState({
    fps: 60,
    frameTime: 0,
    layoutCount: 0,
    paintCount: 0,
    compositeCount: 0,
  })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const boxesRef = useRef<Map<number, HTMLDivElement>>(new Map())
  
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())
  const animationFrameRef = useRef<number | null>(null)
  const animateFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)
  
  const boxesDataRef = useRef<AnimatedBox[]>([])
  const lastFrameTimeRef = useRef(performance.now())
  const layoutCountRef = useRef(0)
  const paintCountRef = useRef(0)
  const compositeCountRef = useRef(0)

  // Initialize boxes
  useEffect(() => {
    boxesDataRef.current = Array.from({ length: elementCount }, (_, i) => ({
      id: i,
      x: Math.random() * 600,
      y: Math.random() * 400,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      opacity: 0.5 + Math.random() * 0.5,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      vr: (Math.random() - 0.5) * 180,
      vs: (Math.random() - 0.5) * 0.5,
    }))
    
    // Reset metrics when element count changes
    if (!isAnimating) {
      setFpsData([])
      layoutCountRef.current = 0
      paintCountRef.current = 0
      compositeCountRef.current = 0
    }
  }, [elementCount, isAnimating])

  // FPS tracking
  useEffect(() => {
    if (!isAnimating) return

    const measureFPS = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      const elapsed = currentTime - lastFpsTimeRef.current

      if (elapsed >= 200) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed)
        setFpsData((prev) => [...prev, { time: prev.length * 0.2, value: fps }].slice(-100))
        setMetrics((prev) => ({
          ...prev,
          fps,
          layoutCount: layoutCountRef.current,
          paintCount: paintCountRef.current,
          compositeCount: compositeCountRef.current,
        }))
        frameCountRef.current = 0
        lastFpsTimeRef.current = currentTime
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS)
    }

    animationFrameRef.current = requestAnimationFrame(measureFPS)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isAnimating])

  // Animation loop
  useEffect(() => {
    isAnimatingRef.current = isAnimating
    
    if (!isAnimating) {
      // Clean up animation frame when stopped
      if (animateFrameRef.current) {
        cancelAnimationFrame(animateFrameRef.current)
        animateFrameRef.current = null
      }
      return
    }

    const animate = () => {
      // Check if still animating at the start of each frame
      if (!isAnimatingRef.current) {
        animateFrameRef.current = null
        return
      }

      const currentTime = performance.now()
      const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000
      lastFrameTimeRef.current = currentTime

      // Update box positions
      boxesDataRef.current.forEach((box) => {
        // Update position
        box.x += box.vx * deltaTime
        box.y += box.vy * deltaTime
        box.rotation += box.vr * deltaTime
        box.scale += box.vs * deltaTime
        box.opacity = 0.3 + (Math.sin(currentTime / 500 + box.id) + 1) * 0.35

        // Bounce off walls
        if (box.x < 0 || box.x > 600) {
          box.vx *= -1
          box.x = Math.max(0, Math.min(600, box.x))
        }
        if (box.y < 0 || box.y > 400) {
          box.vy *= -1
          box.y = Math.max(0, Math.min(400, box.y))
        }

        // Bounce scale
        if (box.scale < 0.3 || box.scale > 1.2) {
          box.vs *= -1
          box.scale = Math.max(0.3, Math.min(1.2, box.scale))
        }

        // Apply animation based on acceleration mode
        const boxElement = boxesRef.current.get(box.id)
        if (boxElement) {
          const frameStart = performance.now()
          
          if (useHardwareAcceleration) {
            // Hardware accelerated: transform and opacity only (GPU composited)
            boxElement.style.transform = `translate(${box.x}px, ${box.y}px) rotate(${box.rotation}deg) scale(${box.scale})`
            boxElement.style.opacity = `${box.opacity}`
            compositeCountRef.current++
          } else {
            // Non-accelerated: force layout recalculation with left/top/width/height
            // Changing these properties triggers layout recalculation (reflow) and repaint
            boxElement.style.left = `${box.x}px`
            boxElement.style.top = `${box.y}px`
            boxElement.style.width = `${48 * box.scale}px`
            boxElement.style.height = `${48 * box.scale}px`
            boxElement.style.opacity = `${box.opacity}`
            // Add shadow that changes with position to trigger more repaints
            const shadowX = Math.round((box.x / 600) * 10)
            const shadowY = Math.round((box.y / 400) * 10)
            boxElement.style.boxShadow = `${shadowX}px ${shadowY}px ${10 * box.scale}px rgba(0, 0, 0, ${0.3 * box.opacity})`
            // Force layout synchronization - this makes the browser recalculate layout immediately
            void boxElement.offsetWidth
            layoutCountRef.current++
            paintCountRef.current++
          }
          
          const frameTime = performance.now() - frameStart
          setMetrics((prev) => ({
            ...prev,
            frameTime: frameTime,
          }))
        }
      })

      animateFrameRef.current = requestAnimationFrame(animate)
    }

    lastFrameTimeRef.current = performance.now()
    lastFpsTimeRef.current = performance.now()
    animateFrameRef.current = requestAnimationFrame(animate)

    return () => {
      isAnimatingRef.current = false
      if (animateFrameRef.current) {
        cancelAnimationFrame(animateFrameRef.current)
        animateFrameRef.current = null
      }
    }
  }, [isAnimating, useHardwareAcceleration, elementCount])

  const handleStart = () => {
    setIsAnimating(true)
    setFpsData([])
    layoutCountRef.current = 0
    paintCountRef.current = 0
    compositeCountRef.current = 0
    frameCountRef.current = 0
    lastFpsTimeRef.current = performance.now()
    lastFrameTimeRef.current = performance.now()
  }

  const handleStop = () => {
    setIsAnimating(false)
    // Reset frame time when stopping
    setMetrics((prev) => ({
      ...prev,
      frameTime: 0,
    }))
  }

  const performanceData = [
    { name: 'Layout', value: metrics.layoutCount, color: '#ef4444' },
    { name: 'Paint', value: metrics.paintCount, color: '#f59e0b' },
    { name: 'Composite', value: metrics.compositeCount, color: '#10b981' },
  ]

  return (
    <DemoLayout
      title="Hardware Acceleration"
      description="Compare GPU-accelerated (transform) vs CPU-based (top/left) animations by toggling hardware acceleration"
    >
      <ControlPanel title="Controls">
        <Toggle
          label="Hardware Acceleration"
          checked={useHardwareAcceleration}
          onCheckedChange={setUseHardwareAcceleration}
        />
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Element Count: {elementCount}</label>
          <input
            type="range"
            min="10"
            max="100"
            value={elementCount}
            onChange={(e) => setElementCount(Number(e.target.value))}
            disabled={isAnimating}
            className="flex-1"
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>
        <Button onClick={handleStart} disabled={isAnimating}>
          Start Animation
        </Button>
        <Button onClick={handleStop} disabled={!isAnimating} variant="secondary">
          Stop Animation
        </Button>
      </ControlPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          title="FPS"
          value={metrics.fps}
          unit="fps"
          icon={useHardwareAcceleration ? <Zap className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}
          trend={metrics.fps >= 55 ? 'up' : metrics.fps >= 30 ? 'neutral' : 'down'}
        />
        <MetricCard
          title="Frame Time"
          value={metrics.frameTime.toFixed(2)}
          unit="ms"
          icon={<Layers className="h-4 w-4" />}
          trend={metrics.frameTime < 16 ? 'up' : metrics.frameTime < 33 ? 'neutral' : 'down'}
        />
        <MetricCard
          title="Layout Operations"
          value={metrics.layoutCount}
          icon={<Layers className="h-4 w-4" />}
        />
        <MetricCard
          title="Paint Operations"
          value={metrics.paintCount}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          title="Composite Operations"
          value={metrics.compositeCount}
          icon={<Sparkles className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-4">FPS Over Time</h3>
          <LineChart 
            data={fpsData} 
            dataKey="value" 
            color={useHardwareAcceleration ? '#3b82f6' : '#ef4444'} 
          />
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-4">Rendering Pipeline</h3>
          <div className="space-y-3">
            {performanceData.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm font-mono">{item.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.min((item.value / (elementCount * 100)) * 100, 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-foreground/60">
            {useHardwareAcceleration 
              ? 'Hardware acceleration uses only composite operations (GPU-accelerated)'
              : 'Non-accelerated mode triggers layout and paint operations on every frame'}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Animation Preview</h3>
          <span className={`text-xs px-2 py-1 rounded ${
            useHardwareAcceleration 
              ? 'bg-blue-500/20 text-blue-500' 
              : 'bg-red-500/20 text-red-500'
          }`}>
            {useHardwareAcceleration ? 'GPU Accelerated' : 'CPU Based'}
          </span>
        </div>
        <div 
          ref={containerRef}
          className="relative h-96 bg-muted rounded-lg overflow-hidden"
        >
          {boxesDataRef.current.map((box) => (
            <div
              key={box.id}
              ref={(el) => {
                if (el) boxesRef.current.set(box.id, el)
                else boxesRef.current.delete(box.id)
              }}
              className={`absolute w-12 h-12 rounded-lg ${
                useHardwareAcceleration ? 'bg-blue-500 shadow-lg' : 'bg-red-500'
              }`}
              style={{
                willChange: useHardwareAcceleration ? 'transform, opacity' : 'left, top, width, height, opacity',
                left: useHardwareAcceleration ? '0' : `${box.x}px`,
                top: useHardwareAcceleration ? '0' : `${box.y}px`,
                width: useHardwareAcceleration ? '48px' : `${48 * box.scale}px`,
                height: useHardwareAcceleration ? '48px' : `${48 * box.scale}px`,
                transform: useHardwareAcceleration 
                  ? `translate(${box.x}px, ${box.y}px) rotate(${box.rotation}deg) scale(${box.scale})`
                  : `rotate(${box.rotation}deg)`,
                opacity: box.opacity,
              }}
            />
          ))}
        </div>
        <p className="mt-4 text-sm text-foreground/60">
          {useHardwareAcceleration ? (
            <>
              <strong>Hardware Accelerated:</strong> Using <code className="px-1 py-0.5 bg-muted rounded">transform</code> and <code className="px-1 py-0.5 bg-muted rounded">opacity</code> - 
              GPU handles compositing, no layout recalculation needed. Should maintain smooth 60 FPS even with many elements.
            </>
          ) : (
            <>
              <strong>Non-Accelerated:</strong> Using <code className="px-1 py-0.5 bg-muted rounded">top</code> and <code className="px-1 py-0.5 bg-muted rounded">left</code> - 
              Triggers layout recalculation and repaint on every frame. Performance degrades significantly with more elements.
            </>
          )}
        </p>
      </div>
    </DemoLayout>
  )
}
