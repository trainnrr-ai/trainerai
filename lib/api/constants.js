// Centralised constants for API layer

export const AUTH_API = process.env.EMERGENT_AUTH_URL
  || 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data'

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'hello@trainr.in')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)
  .concat('trainnrr@gmail.com')

// Feature flag: when true, verification requests stay pending until admin approval
// Default keeps current auto-approve behavior to avoid regressions
export const MANUAL_VERIFICATION = process.env.MANUAL_VERIFICATION === 'true'

export const BANNED_WORDS = [
  'nudes', 'sexy', 'send pics', 'horny', 'hookup', 'sext',
  'dick', 'pussy', 'boobs',
]

export const SESSION_COOKIE = 'spottr_session'
export const SESSION_DAYS = 7

// Premium / billing tiers
export const PREMIUM_TIERS = {
  FREE: 'free',
  PRO: 'pro',
}

// Premium feature catalog (used by gating logic + future paywall UI)
export const PREMIUM_FEATURES = {
  unlimited_likes: true,
  see_who_liked_you: true,
  advanced_filters: true,
  priority_in_discover: true,
  read_receipts_plus: true,
}
