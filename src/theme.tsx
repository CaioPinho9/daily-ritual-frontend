import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type PropsWithChildren,
} from 'react'

type ThemeMode = 'light' | 'dark'

type ThemeContextValue = {
  theme: ThemeMode
  toggleTheme: () => void
}

const STORAGE_KEY = 'daily-ritual.theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem(STORAGE_KEY)

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return getSystemTheme()
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  useLayoutEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value: ThemeContextValue = {
    theme,
    toggleTheme: () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark')),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
