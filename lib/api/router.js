import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { purgeLegacySeedsOnce } from './utils'

import { postAuthSession, postAuthFirebase, getAuthMe, postAuthLogout, postAuthSendOtp, postAuthVerifyOtp } from './handlers/auth'
import { upsertProfile, getProfileMe, postProfileLocation, postVerifySelfie, postVerifyRequest, getProfileCompletion, postVerifyFace } from './handlers/profile'
import { getDiscover, postSkip } from './handlers/discover'
import { getMatches, deleteMatch } from './handlers/matches'
import {
  postConnect, postLike,
  getIncomingRequests, getOutgoingRequests,
  postAcceptRequest, postDeclineRequest, postCancelRequest,
} from './handlers/requests'
import { getMessages, postMessage, postTyping } from './handlers/messages'
import { getNotifications, postNotificationsRead } from './handlers/notifications'
import { postReport, postBlock, postUnblock, getBlocks } from './handlers/reports'
import { deleteAccount } from './handlers/account'
import {
  adminGuard, getAdminStats, getAdminUsers, getAdminReports,
  postAdminBan, postAdminUnban, postAdminReportResolve,
  getAdminVerifications, postAdminVerifyApprove, postAdminVerifyReject,
  getAdminAnalytics, postAdminPurgeSeeds, postAdminDeleteUser,
  postAdminVerifyProfile,
} from './handlers/admin'
import { getBillingMe, postBillingUpgrade, postBillingDowngrade } from './handlers/billing'
import { postPushSubscribe, postPushUnsubscribe, getPushVapidKey } from './handlers/push'

function key(method, path) { return `${method} ${path}` }

const PUBLIC_ROUTES = {
  // Health
  [key('GET', '')]: () => NextResponse.json({ ok: true, app: 'trainr' }),

  // Auth
  [key('POST', 'auth/session')]: postAuthSession,
  [key('POST', 'auth/firebase')]: postAuthFirebase,
  [key('GET', 'auth/me')]: getAuthMe,
  [key('POST', 'auth/logout')]: postAuthLogout,
  [key('POST', 'auth/send-otp')]: postAuthSendOtp,
  [key('POST', 'auth/verify-otp')]: postAuthVerifyOtp,

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
  [key('POST', 'profile/verify-face')]: postVerifyFace,
  [key('POST', 'profile/auto-verify')]: postVerifyFace,

  // Discover
  [key('GET', 'profiles/discover')]: getDiscover,
  [key('POST', 'profiles/like')]: postLike, // back-compat alias of /profiles/connect
  [key('POST', 'profiles/connect')]: postConnect,
  [key('POST', 'profiles/skip')]: postSkip,

  // Connection requests (new flow: pending → accept/decline)
  [key('GET', 'requests/incoming')]: getIncomingRequests,
  [key('GET', 'requests/outgoing')]: getOutgoingRequests,
  [key('POST', 'requests/accept')]: postAcceptRequest,
  [key('POST', 'requests/decline')]: postDeclineRequest,
  [key('POST', 'requests/cancel')]: postCancelRequest,

  // Matches & Messages
  [key('GET', 'matches')]: getMatches,
  [key('POST', 'matches/remove')]: deleteMatch,
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
  [key('POST', 'admin/verify-profile')]: postAdminVerifyProfile,
  [key('GET', 'admin/analytics')]: getAdminAnalytics,
  [key('POST', 'admin/purge-seeds')]: postAdminPurgeSeeds,
  [key('POST', 'admin/delete-user')]: postAdminDeleteUser,
}

export async function dispatch(request, { params }) {
  const path = (params?.path || []).join('/')
  const method = request.method
  const k = key(method, path)

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
