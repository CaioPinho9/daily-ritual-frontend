// ─── Theme Config ────────────────────────────────────────────────────────────
// Change this value to force a specific theme or follow the OS preference.
// Accepted values: 'light' | 'dark' | 'system'
export const THEME_MODE: 'light' | 'dark' | 'system' = 'system'

// ─── Theme Resolver ───────────────────────────────────────────────────────────
// Reads the config, applies/removes the `dark` class on <html>, and (when in
// 'system' mode) keeps the class in sync with OS-level preference changes.
// Returns a cleanup function — call it if you ever need to tear the listener down.
export function applyTheme(): () => void {
  const root = document.documentElement

  function setDark(isDark: boolean) {
    root.classList.toggle('dark', isDark)
  }

  if (THEME_MODE === 'light') {
    setDark(false)
    return () => {}
  }

  if (THEME_MODE === 'dark') {
    setDark(true)
    return () => {}
  }

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  setDark(mq.matches)

  const handler = (e: MediaQueryListEvent) => setDark(e.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
