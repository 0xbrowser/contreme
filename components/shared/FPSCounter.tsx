'use client'

import { useEffect, useState, useRef } from 'react'
import { Activity } from 'lucide-react'
import { MetricCard } from './MetricCard'

export function FPSCounter() {
  const [fps, setFps] = useState(60)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  useEffect(() => {
    let animationFrameId: number

    const measureFPS = () => {
      frameCount.current++
      const currentTime = performance.now()
      const elapsed = currentTime - lastTime.current

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed))
        frameCount.current = 0
        lastTime.current = currentTime
      }

      animationFrameId = requestAnimationFrame(measureFPS)
    }

    animationFrameId = requestAnimationFrame(measureFPS)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  return (
    <MetricCard
      title="FPS"
      value={fps}
      unit="fps"
      icon={<Activity className="h-4 w-4" />}
      trend={fps >= 55 ? 'up' : fps >= 30 ? 'neutral' : 'down'}
    />
  )
}

