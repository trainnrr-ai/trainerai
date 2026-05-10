import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { buildSeedProfiles } from '@/lib/seed'
import { ADMIN_EMAILS, SESSION_COOKIE } from './constants'

export async function getUserFromRequest(request) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  if (!cookie) return null
  const db = await getDb()
  const session = await db.collection('sessions').findOne({ token: cookie })
  if (!session) return null
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) return null
  const user = await db.collection('users').findOne({ id: session.userId })
  return user
}

export function isAdmin(user) {
  return !!user && ADMIN_EMAILS.includes((user.email || '').toLowerCase())
}

export async function ensureSeed(db) {
  const count = await db.collection('profiles').countDocuments({ isSeed: true })
  if (count >= 20) return
  const seeds = buildSeedProfiles()
  if (seeds.length) await db.collection('profiles').insertMany(seeds)
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
  if (me.goal && them.goal && me.goal === them.goal) reasons.push({ key: 'goal', label: 'Same goal' })
  if (me.timing && them.timing && me.timing === them.timing) reasons.push({ key: 'timing', label: 'Same timing' })
  if (me.level && them.level && me.level === them.level) reasons.push({ key: 'level', label: `Both ${them.level.toLowerCase()}` })
  return reasons.slice(0, 3)
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
