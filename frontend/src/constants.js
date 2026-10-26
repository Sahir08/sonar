export const APP_NAME = 'Sonar'
export const TAGLINE = 'Early warning for low blood sugar'
export const SLOGAN = 'See the low before it surfaces.'
export const PITCH =
  "Existing apps show caregivers what's happening. Sonar warns them what's about to happen, and explains why."

// Glucose thresholds in mg/dL
export const LOW = 70
export const HIGH = 180
export const VERY_LOW = 54
export const VERY_HIGH = 250

// One CGM reading every 5 minutes
export const READING_MINUTES = 5
export const READINGS_PER_HOUR = 60 / READING_MINUTES
// The model looks 60 minutes ahead
export const HORIZON_READINGS = 12
// Chart shows the last 6 hours
export const CHART_READINGS = 72
// Replay starts 2 hours before the first alert
export const REPLAY_LEAD_READINGS = 24

export const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '')

export const DISCLAIMER =
  'Sonar is a research prototype for informational purposes only. It is not a medical device and is not for making treatment decisions.'
export const PRIVACY_TEXT =
  'Your data is processed in memory and never stored. Your Nightscout address and token are never saved.'
export const UNREACHABLE_TEXT = "Can't reach the Sonar server."
