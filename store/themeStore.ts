import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark',
  toggleTheme: () => {
    set((state) => {
      const newIsDark = !state.isDark
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
      }
      return { isDark: newIsDark }
    })
  },
}))

