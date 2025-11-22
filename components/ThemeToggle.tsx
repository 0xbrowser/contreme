'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import * as Switch from '@radix-ui/react-switch'

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore()

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-foreground/60" />
      <Switch.Root
        checked={isDark}
        onCheckedChange={toggleTheme}
        className="relative h-6 w-11 rounded-full bg-muted outline-none transition-colors data-[state=checked]:bg-accent"
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform will-change-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
      <Moon className="h-4 w-4 text-foreground/60" />
    </div>
  )
}

