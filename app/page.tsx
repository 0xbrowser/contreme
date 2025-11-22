'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { FPSCounter } from '@/components/shared/FPSCounter'
import {
  Zap,
  Scroll,
  Cpu,
  Layers,
  Timer,
  Gauge,
  Sparkles,
  Network,
} from 'lucide-react'

const demos = [
  {
    id: 'websocket-batching',
    title: 'WebSocket Batching',
    description: 'Compare immediate vs batched WebSocket updates',
    icon: Zap,
    href: '/demos/websocket-batching',
  },
  {
    id: 'virtual-scrolling',
    title: 'Virtual Scrolling',
    description: 'Regular vs virtualized list rendering',
    icon: Scroll,
    href: '/demos/virtual-scrolling',
  },
  // {
  //   id: 'web-workers',
  //   title: 'Web Workers',
  //   description: 'Main thread vs Web Worker computation',
  //   icon: Cpu,
  //   href: '/demos/web-workers',
  // },
  {
    id: 'component-memoization',
    title: 'Component Memoization',
    description: 'Normal vs memoized component rendering',
    icon: Layers,
    href: '/demos/component-memoization',
  },
  {
    id: 'debounce',
    title: 'Debounce',
    description: 'Debounced vs immediate event handling',
    icon: Timer,
    href: '/demos/debounce',
  },
  {
    id: 'throttle',
    title: 'Throttle',
    description: 'Throttled vs immediate event handling',
    icon: Gauge,
    href: '/demos/throttle',
  },
  {
    id: 'hardware-acceleration',
    title: 'Hardware Acceleration',
    description: 'CSS transform vs top/left animations',
    icon: Sparkles,
    href: '/demos/hardware-acceleration',
  },
  {
    id: 'request-coalescing',
    title: 'Request Coalescing',
    description: 'Batched vs individual API requests',
    icon: Network,
    href: '/demos/request-coalescing',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            🫀
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between mb-8">
          <p className="text-md font-semibold text-foreground/70">
            Simulating frontend performance optimization improvements <br />
            for extreme cases like HFT (High-frequency Trading)
          </p>
        </div>

        <div className="mb-6">
          <FPSCounter />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demos.map((demo) => {
            const Icon = demo.icon
            return (
              <Link
                key={demo.id}
                href={demo.href}
                className="group rounded-lg border border-border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-accent"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-accent/10 p-3 text-accent">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors">
                      {demo.title}
                    </h3>
                    <p className="text-sm text-foreground/60">{demo.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}

