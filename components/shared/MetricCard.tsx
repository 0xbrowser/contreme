import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function MetricCard({ title, value, unit, icon, trend }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-foreground/60">{icon}</div>}
          <span className="text-sm font-medium text-foreground/70">{title}</span>
        </div>
        {trend && (
          <div
            className={`h-2 w-2 rounded-full ${
              trend === 'up'
                ? 'bg-green-500'
                : trend === 'down'
                ? 'bg-red-500'
                : 'bg-gray-500'
            }`}
          />
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-semibold">{value}</span>
        {unit && <span className="ml-1 text-sm text-foreground/60">{unit}</span>}
      </div>
    </div>
  )
}

