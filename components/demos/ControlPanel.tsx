import { ReactNode } from 'react'
import * as Switch from '@radix-ui/react-switch'

interface ControlPanelProps {
  title: string
  children: ReactNode
}

export function ControlPanel({ title, children }: ControlPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  )
}

interface ToggleProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Toggle({ label, checked, onCheckedChange }: ToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium">{label}</label>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative h-6 w-11 rounded-full bg-muted outline-none transition-colors data-[state=checked]:bg-accent"
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform will-change-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
    </div>
  )
}

interface ButtonProps {
  onClick: () => void
  children: ReactNode
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function Button({ onClick, children, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        variant === 'primary'
          ? 'bg-accent text-white hover:bg-accent/90 disabled:opacity-50'
          : 'bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50'
      }`}
    >
      {children}
    </button>
  )
}

