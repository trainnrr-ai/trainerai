// Edge middleware — runs before route handlers.
// Defense-in-depth for /api/admin/* + global security headers.
// NOTE: full auth/admin validation still happens in /app/lib/api/handlers/admin.js
// (adminGuard) because the Edge runtime cannot use the mongodb driver.
// This middleware rejects obviously-unauthenticated admin requests at the edge.

import { NextResponse } from 'next/server'

const SESSION_COOKIE = 'spottr_session'

// Rate-limit admin requests per IP (in-memory, best-effort).
// Edge runtime is per-instance; this is not strict rate-limit but blocks bursts.
const adminRateBucket = new Map() // ip -> { count, resetAt }
const ADMIN_RATE_LIMIT = 120       // requests
const ADMIN_RATE_WINDOW_MS = 60_000 // per minute

function tooManyAdminRequests(ip) {
  const now = Date.now()
  const bucket = adminRateBucket.get(ip)
  if (!bucket || bucket.resetAt < now) {
    adminRateBucket.set(ip, { count: 1, resetAt: now + ADMIN_RATE_WINDOW_MS })
    return false
  }
  bucket.count += 1
  if (bucket.count > ADMIN_RATE_LIMIT) return true
  return false
}

function applySecurityHeaders(res) {
  // Conservative production headers (don't break the SPA)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()')
  return res
}

// Force no-cache on all API responses so browsers/CDNs never serve stale profile data.
function applyApiNoCache(res) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')
  return res
}

export function middleware(request) {
  const { pathname } = request.nextUrl

  // ===== ADMIN EDGE GATE =====
  if (pathname.startsWith('/api/admin/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (tooManyAdminRequests(ip)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      })
    }

    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value
    if (!sessionCookie) {
      // No cookie → reject immediately, no DB hit. Server still verifies the cookie.
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    // Pass through — actual admin verification happens in adminGuard()
  }

  const res = applySecurityHeaders(NextResponse.next())
  if (pathname.startsWith('/api/')) applyApiNoCache(res)
  return res
}

// Run on all paths except Next internals + static assets
export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static, _next/image, favicon, public assets
     *  - sw.js (service worker must load on origin)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:png|jpg|jpeg|webp|svg|ico|gif|map)).*)',
  ],
}
