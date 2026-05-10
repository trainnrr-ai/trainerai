import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { ensureSeed } from './utils'

import { postAuthSession, getAuthMe, postAuthLogout } from './handlers/auth'
import { upsertProfile, getProfileMe, postProfileLocation, postVerifySelfie, postVerifyRequest } from './handlers/profile'
import { getDiscover, postLike, postSkip } from './handlers/discover'
import { getMatches } from './handlers/matches'
import { getMessages, postMessage, postTyping } from './handlers/messages'
import { getNotifications, postNotificationsRead } from './handlers/notifications'
import { postReport, postBlock } from './handlers/reports'
import {
  adminGuard, getAdminStats, getAdminUsers, getAdminReports,
  postAdminBan, postAdminUnban, postAdminReportResolve,
  getAdminVerifications, postAdminVerifyApprove, postAdminVerifyReject,
  getAdminAnalytics,
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

  // Profile
  [key('POST', 'profile')]: upsertProfile,
  [key('PUT', 'profile')]: upsertProfile,
  [key('GET', 'profile/me')]: getProfileMe,
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

  // Billing (premium scaffolding, MOCKED)
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
}

export async function dispatch(request, { params }) {
  const path = (params?.path || []).join('/')
  const method = request.method
  const k = key(method, path)
  const db = await getDb()
  await ensureSeed(db)

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
