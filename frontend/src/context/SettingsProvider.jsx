import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { SettingsContext, SETTING_OPTIONS, loadSettings, saveSettings } from './settings.js'

const THEME_COLORS = { dark: '#0B0E14', light: '#F6F8FA' }
const LIGHT_QUERY = '(prefers-color-scheme: light)'

function subscribeToScheme(callback) {
  const mq = window.matchMedia?.(LIGHT_QUERY)
  if (!mq) return () => {}
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

const systemPrefersLight = () => window.matchMedia?.(LIGHT_QUERY).matches ?? false

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings)
  const prefersLight = useSyncExternalStore(subscribeToScheme, systemPrefersLight, () => false)

  const resolvedTheme = settings.theme === 'system' ? (prefersLight ? 'light' : 'dark') : settings.theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolvedTheme])
  }, [resolvedTheme])

  const updateSetting = useCallback((key, value) => {
    if (!SETTING_OPTIONS[key]?.includes(value)) return
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      saveSettings(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ ...settings, resolvedTheme, updateSetting }),
    [settings, resolvedTheme, updateSetting],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
