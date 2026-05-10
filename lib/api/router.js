import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { purgeLegacySeedsOnce } from './utils'

import { postAuthSession, getAuthMe, postAuthLogout } from './handlers/auth'
import { upsertProfile, getProfileMe, postProfileLocation, postVerifySelfie, postVerifyRequest, getProfileCompletion } from './handlers/profile'
import { getDiscover, postLike, postSkip } from './handlers/discover'
import { getMatches } from './handlers/matches'
import { getMessages, postMessage, postTyping } from './handlers/messages'
import { getNotifications, postNotificationsRead } from './handlers/notifications'
import { postReport, postBlock, postUnblock, getBlocks } from './handlers/reports'
import { deleteAccount } from './handlers/account'
import {
  adminGuard, getAdminStats, getAdminUsers, getAdminReports,
  postAdminBan, postAdminUnban, postAdminReportResolve,
  getAdminVerifications, postAdminVerifyApprove, postAdminVerifyReject,
  getAdminAnalytics, postAdminPurgeSeeds,
} from './handlers/admin'
import { getBillingMe, postBillingUpgrade, postBillingDowngrade } from './handlers/billing'
import { postPushSubscribe, postPushUnsubscribe, getPushVapidKey } from './handlers/push'

function key(method, path) { return `${method} ${path}` }

const PUBLIC_ROUTES = {
  // Health
  [key('GET', '')]: () => NextResponse.json({ ok: true, app: 'trainr' }),

  // Auth
  [key('POST', 'auth/session')]: postAuthSession,
  [key('GET', 'auth/me')]: getAuthMe,
  [key('POST', 'auth/logout')]: postAuthLogout,

  // Account
  [key('DELETE', 'account')]: deleteAccount,
  [key('POST', 'account/delete')]: deleteAccount, // mobile-friendly fallback

  // Profile
  [key('POST', 'profile')]: upsertProfile,
  [key('PUT', 'profile')]: upsertProfile,
  [key('GET', 'profile/me')]: getProfileMe,
  [key('GET', 'profile/completion')]: getProfileCompletion,
  [key('POST', 'profile/location')]: postProfileLocation,
  [key('POST', 'profile/verify-selfie')]: postVerifySelfie,
  [key('POST', 'profile/verify-request')]: postVerifyRequest,

  // Discover
  [key('GET', 'profiles/discover')]: getDiscover,
  [key('POST', 'profiles/like')]: postLike,
  [key('POST', 'profiles/skip')]: postSkip,

  // Matches & Messages
  [key('GET', 'matches')]: getMatches,
  [key('GET', 'messages')]: getMessages,
  [key('POST', 'messages')]: postMessage,
  [key('POST', 'messages/typing')]: postTyping,

  // Notifications
  [key('GET', 'notifications')]: getNotifications,
  [key('POST', 'notifications/read')]: postNotificationsRead,

  // Reports / Blocks
  [key('POST', 'reports')]: postReport,
  [key('POST', 'blocks')]: postBlock,
  [key('GET', 'blocks')]: getBlocks,
  [key('POST', 'blocks/unblock')]: postUnblock,

  // Billing (Pro scaffolding — UI hidden behind NEXT_PUBLIC_PREMIUM_ENABLED env)
  [key('GET', 'billing/me')]: getBillingMe,
  [key('POST', 'billing/upgrade')]: postBillingUpgrade,
  [key('POST', 'billing/downgrade')]: postBillingDowngrade,

  // Push (MOCKED)
  [key('GET', 'push/vapid')]: getPushVapidKey,
  [key('POST', 'push/subscribe')]: postPushSubscribe,
  [key('POST', 'push/unsubscribe')]: postPushUnsubscribe,
}

const ADMIN_ROUTES = {
  [key('GET', 'admin/stats')]: getAdminStats,
  [key('GET', 'admin/users')]: getAdminUsers,
  [key('GET', 'admin/reports')]: getAdminReports,
  [key('POST', 'admin/ban')]: postAdminBan,
  [key('POST', 'admin/unban')]: postAdminUnban,
  [key('POST', 'admin/report-resolve')]: postAdminReportResolve,
  [key('GET', 'admin/verifications')]: getAdminVerifications,
  [key('POST', 'admin/verify-approve')]: postAdminVerifyApprove,
  [key('POST', 'admin/verify-reject')]: postAdminVerifyReject,
  [key('GET', 'admin/analytics')]: getAdminAnalytics,
  [key('POST', 'admin/purge-seeds')]: postAdminPurgeSeeds,
}

export async function dispatch(request, { params }) {
  const path = (params?.path || []).join('/')
  const method = request.method
  const k = key(method, path)
  // Note: seed initialisation removed — platform now serves real users only.
  // Auto-purge any legacy isSeed:true rows that may exist in production DB
  // from prior deployments. Idempotent + runs once per server process.
  const db = await getDb()
  await purgeLegacySeedsOnce(db)

  try {
    if (path.startsWith('admin/')) {
      const handler = ADMIN_ROUTES[k]
      if (!handler) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const guard = await adminGuard(request)
      if (!guard.ok) return guard.res
      return await handler(request)
    }
    const handler = PUBLIC_ROUTES[k]
    if (!handler) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return await handler(request)
  } catch (err) {
    console.error('API error', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
