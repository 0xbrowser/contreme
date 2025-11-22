import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { FPSCounter } from '@/components/shared/FPSCounter'

interface DemoLayoutProps {
  title: string
  description: string
  children: ReactNode
}

export function DemoLayout({ title, description, children }: DemoLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-foreground/70">{description}</p>
        </div>

        <div className="mb-6">
          <FPSCounter />
        </div>

        {children}
      </main>
    </div>
  )
}

