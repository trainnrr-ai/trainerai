import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { ADMIN_EMAILS, SESSION_COOKIE } from './constants'

let sessionCache = global._sessionCache
if (!sessionCache) sessionCache = global._sessionCache = new Map()

export async function getUserFromRequest(request) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  if (!cookie) return null
  const cached = sessionCache.get(cookie)
  if (cached && cached.expires > Date.now()) {
    return cached.user
  }
  const db = await getDb()
  const session = await db.collection('sessions').findOne({ token: cookie })
  if (!session) return null
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) return null
  const user = await db.collection('users').findOne({ id: session.userId })
  if (user) {
    if (sessionCache.size > 2000) {
      const now = Date.now()
      for (const [k, v] of sessionCache.entries()) {
        if (v.expires <= now) sessionCache.delete(k)
      }
      if (sessionCache.size > 2000) sessionCache.clear()
    }
    sessionCache.set(cookie, {
      user,
      expires: Date.now() + 10000 // 10 seconds cache
    })
  }
  return user
}

export function isAdmin(user) {
  if (!user || !user.email) return false
  return ADMIN_EMAILS.includes(user.email.toLowerCase())
}

// One-shot purge of any legacy seed/demo data left in production DB.
// Runs at most once per server process. Triggered from router on first request.
let _purgedSeeds = false
export async function purgeLegacySeedsOnce(db) {
  if (_purgedSeeds) return { skipped: true }
  _purgedSeeds = true
  try {
    // 1) Identify all seed profiles + their userIds
    const seedProfiles = await db.collection('profiles').find({ isSeed: true }).toArray()
    if (!seedProfiles.length) return { ok: true, removed: 0 }

    const seedProfileIds = seedProfiles.map(p => p.id).filter(Boolean)
    const seedUserIds = seedProfiles.map(p => p.userId).filter(Boolean)

    // 2) Find dependent matches & their messages
    const seedMatches = await db.collection('matches').find({
      $or: [
        { profileA: { $in: seedProfileIds } },
        { profileB: { $in: seedProfileIds } },
        { userA: { $in: seedUserIds } },
        { userB: { $in: seedUserIds } },
      ],
    }).toArray()
    const matchIds = seedMatches.map(m => m.id)

    // 3) Wipe everything seed-related
    if (matchIds.length) {
      await db.collection('messages').deleteMany({ matchId: { $in: matchIds } })
      await db.collection('typing').deleteMany({ matchId: { $in: matchIds } })
      await db.collection('matches').deleteMany({ id: { $in: matchIds } })
    }
    if (seedUserIds.length) {
      await db.collection('notifications').deleteMany({ userId: { $in: seedUserIds } })
      await db.collection('interactions').deleteMany({
        $or: [{ fromUserId: { $in: seedUserIds } }, { toUserId: { $in: seedUserIds } }],
      })
      await db.collection('blocks').deleteMany({
        $or: [{ blockerId: { $in: seedUserIds } }, { blockedUserId: { $in: seedUserIds } }],
      })
    }
    if (seedProfileIds.length) {
      await db.collection('reports').deleteMany({ profileId: { $in: seedProfileIds } })
      await db.collection('blocks').deleteMany({ blockedProfileId: { $in: seedProfileIds } })
      await db.collection('interactions').deleteMany({
        $or: [{ fromProfileId: { $in: seedProfileIds } }, { toProfileId: { $in: seedProfileIds } }],
      })
    }
    const profilesRes = await db.collection('profiles').deleteMany({ isSeed: true })

    console.log(`[purgeLegacySeeds] Removed ${profilesRes.deletedCount} seed profiles + dependent data`)
    return { ok: true, removed: profilesRes.deletedCount }
  } catch (err) {
    console.error('[purgeLegacySeeds] error:', err)
    _purgedSeeds = false // allow retry on next request
    return { error: err.message }
  }
}

export function distanceKm(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(x))))
}

export function computeMatchReasons(me, them) {
  if (!me) return []
  const reasons = []
  if (me.gymName && them.gymName && me.gymName.toLowerCase() === them.gymName.toLowerCase())
    reasons.push({ key: 'gym', label: 'Same gym' })
  else if (me.city && them.city && me.city === them.city)
    reasons.push({ key: 'city', label: 'Same city' })
  // Multi-goal overlap (back-compat with single `goal`).
  const myGoals = Array.isArray(me.goals) && me.goals.length ? me.goals : (me.goal ? [me.goal] : [])
  const theirGoals = Array.isArray(them.goals) && them.goals.length ? them.goals : (them.goal ? [them.goal] : [])
  const overlap = myGoals.filter(g => theirGoals.includes(g))
  if (overlap.length >= 2) reasons.push({ key: 'goals', label: `${overlap.length} shared goals` })
  else if (overlap.length === 1) reasons.push({ key: 'goal', label: `Same goal: ${overlap[0]}` })
  if (me.timing && them.timing && me.timing === them.timing) reasons.push({ key: 'timing', label: 'Same timing' })
  if (me.level && them.level && me.level === them.level) reasons.push({ key: 'level', label: `Both ${them.level.toLowerCase()}` })
  return reasons.slice(0, 4)
}

// Profile completeness gate — used to decide if the profile should appear in discover.
// Real users must satisfy ALL of:
//   - 2+ photos
//   - non-empty bio
//   - city, gymName, at least one goal, timing, level
export function computeProfileCompletion(p) {
  if (!p) return { score: 0, complete: false, missing: ['profile'] }
  const goals = Array.isArray(p.goals) && p.goals.length ? p.goals : (p.goal ? [p.goal] : [])
  const missing = []
  const checks = [
    { key: 'photos', ok: Array.isArray(p.photos) && p.photos.length >= 2, label: 'Add at least 2 photos' },
    { key: 'bio', ok: true, label: 'Write a short bio (10+ chars)' },
    { key: 'city', ok: !!p.city, label: 'Pick your city' },
    { key: 'gymName', ok: !!p.gymName, label: 'Add your gym' },
    { key: 'goals', ok: goals.length > 0, label: 'Pick your workout goal' },
    { key: 'timing', ok: !!p.timing, label: 'Pick your workout timing' },
    { key: 'level', ok: !!p.level, label: 'Pick your experience level' },
  ]
  for (const c of checks) if (!c.ok) missing.push({ key: c.key, label: c.label })
  const completed = checks.length - missing.length
  const score = Math.round((completed / checks.length) * 100)
  return { score, complete: missing.length === 0, missing }
}

export function isProfileDiscoverable(p) {
  return computeProfileCompletion(p).complete
}

export async function notify(db, userId, payload) {
  if (!userId) return
  const doc = { id: uuidv4(), userId, read: false, createdAt: new Date(), ...payload }
  await db.collection('notifications').insertOne(doc)
}

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function jsonOk(payload = {}) {
  return NextResponse.json({ ok: true, ...payload })
}
