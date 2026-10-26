import { createContext, useContext } from 'react'

export const SETTINGS_KEY = 'sonar.settings'

export const DEFAULT_SETTINGS = { units: 'mgdl', view: 'caregiver', theme: 'dark' }

export const SETTING_OPTIONS = {
  units: ['mgdl', 'mmol'],
  view: ['caregiver', 'patient'],
  theme: ['dark', 'light', 'system'],
}

export const SettingsContext = createContext(null)

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}

/** Read saved settings. Only preferences are stored, never health data. */
export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    const out = { ...DEFAULT_SETTINGS }
    for (const key of Object.keys(SETTING_OPTIONS)) {
      if (SETTING_OPTIONS[key].includes(saved?.[key])) out[key] = saved[key]
    }
    return out
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Storage unavailable (private mode). Settings still apply for this session.
  }
}
