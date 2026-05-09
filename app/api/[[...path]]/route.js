import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { buildSeedProfiles } from '@/lib/seed'
import { v4 as uuidv4 } from 'uuid'

const AUTH_API = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data'

async function getUserFromRequest(request) {
  const cookie = request.cookies.get('spottr_session')?.value
  if (!cookie) return null
  const db = await getDb()
  const session = await db.collection('sessions').findOne({ token: cookie })
  if (!session) return null
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) return null
  const user = await db.collection('users').findOne({ id: session.userId })
  return user
}

async function ensureSeed(db) {
  const count = await db.collection('profiles').countDocuments({ isSeed: true })
  if (count >= 20) return
  const seeds = buildSeedProfiles()
  if (seeds.length) await db.collection('profiles').insertMany(seeds)
}

async function handler(request, { params }) {
  const path = (params?.path || []).join('/')
  const method = request.method
  const db = await getDb()
  await ensureSeed(db)

  try {
    // Health
    if (path === '' && method === 'GET') {
      return NextResponse.json({ ok: true, app: 'spottr' })
    }

    // === AUTH ===
    if (path === 'auth/session' && method === 'POST') {
      const { sessionId } = await request.json()
      if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
      const r = await fetch(AUTH_API, { headers: { 'X-Session-ID': sessionId } })
      if (!r.ok) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      const data = await r.json()
      // data: { id, email, name, picture, session_token }
      let user = await db.collection('users').findOne({ email: data.email })
      if (!user) {
        user = {
          id: uuidv4(),
          email: data.email,
          name: data.name,
          picture: data.picture,
          provider: 'emergent',
          createdAt: new Date(),
        }
        await db.collection('users').insertOne(user)
      }
      const token = data.session_token || uuidv4()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await db.collection('sessions').insertOne({ token, userId: user.id, createdAt: new Date(), expiresAt })
      const profile = await db.collection('profiles').findOne({ userId: user.id })
      const res = NextResponse.json({ user, hasProfile: !!profile })
      res.cookies.set('spottr_session', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
      return res
    }

    if (path === 'auth/me' && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ user: null }, { status: 200 })
      const profile = await db.collection('profiles').findOne({ userId: user.id })
      return NextResponse.json({ user, profile: profile || null })
    }

    if (path === 'auth/logout' && method === 'POST') {
      const cookie = request.cookies.get('spottr_session')?.value
      if (cookie) await db.collection('sessions').deleteOne({ token: cookie })
      const res = NextResponse.json({ ok: true })
      res.cookies.set('spottr_session', '', { path: '/', maxAge: 0 })
      return res
    }

    // === PROFILE ===
    if (path === 'profile' && (method === 'POST' || method === 'PUT')) {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const body = await request.json()
      const photos = Array.isArray(body.photos) ? body.photos.filter(Boolean) : []
      if (photos.length < 2) return NextResponse.json({ error: 'At least 2 photos required' }, { status: 400 })
      if (photos.length > 5) return NextResponse.json({ error: 'Maximum 5 photos allowed' }, { status: 400 })
      const existing = await db.collection('profiles').findOne({ userId: user.id })
      const profileDoc = {
        id: existing?.id || uuidv4(),
        userId: user.id,
        isSeed: false,
        name: body.name || user.name,
        age: Number(body.age) || null,
        gender: body.gender,
        city: body.city,
        gymName: body.gymName,
        level: body.level,
        goal: body.goal,
        timing: body.timing,
        bio: body.bio || '',
        height: Number(body.height) || null,
        weight: Number(body.weight) || null,
        instagram: body.instagram || null,
        photos,
        verified: !!body.instagram,
        verifications: { selfie: false, instagram: !!body.instagram, gym: false },
        online: true,
        updatedAt: new Date(),
      }
      if (existing) {
        await db.collection('profiles').updateOne({ id: existing.id }, { $set: profileDoc })
      } else {
        profileDoc.createdAt = new Date()
        await db.collection('profiles').insertOne(profileDoc)
      }
      return NextResponse.json({ profile: profileDoc })
    }

    if (path === 'profile/me' && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const profile = await db.collection('profiles').findOne({ userId: user.id })
      return NextResponse.json({ profile: profile || null })
    }

    // === DISCOVER ===
    if (path === 'profiles/discover' && method === 'GET') {
      const user = await getUserFromRequest(request)
      const url = new URL(request.url)
      const filters = {
        city: url.searchParams.get('city') || null,
        gym: url.searchParams.get('gym') || null,
        goal: url.searchParams.get('goal') || null,
        timing: url.searchParams.get('timing') || null,
        gender: url.searchParams.get('gender') || null,
        level: url.searchParams.get('level') || null,
        verifiedOnly: url.searchParams.get('verifiedOnly') === 'true',
      }
      const query = {}
      if (filters.city) query.city = filters.city
      if (filters.gym) query.gymName = filters.gym
      if (filters.goal) query.goal = filters.goal
      if (filters.timing) query.timing = filters.timing
      if (filters.gender) query.gender = filters.gender
      if (filters.level) query.level = filters.level
      if (filters.verifiedOnly) query.verified = true
      let excludeIds = []
      if (user) {
        const myProfile = await db.collection('profiles').findOne({ userId: user.id })
        if (myProfile) excludeIds.push(myProfile.id)
        const interactions = await db.collection('interactions').find({ fromUserId: user.id, action: { $in: ['skip', 'like'] } }).toArray()
        excludeIds.push(...interactions.map(i => i.toProfileId))
        const blocks = await db.collection('blocks').find({ blockerId: user.id }).toArray()
        excludeIds.push(...blocks.map(b => b.blockedProfileId))
      }
      if (excludeIds.length) query.id = { $nin: excludeIds }
      const profiles = await db.collection('profiles').find(query).limit(50).toArray()
      return NextResponse.json({ profiles })
    }

    if (path === 'profiles/like' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { profileId } = await request.json()
      const myProfile = await db.collection('profiles').findOne({ userId: user.id })
      const target = await db.collection('profiles').findOne({ id: profileId })
      if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      await db.collection('interactions').updateOne(
        { fromUserId: user.id, toProfileId: profileId, action: 'like' },
        { $set: { fromUserId: user.id, toUserId: target.userId, fromProfileId: myProfile?.id, toProfileId: profileId, action: 'like', createdAt: new Date() } },
        { upsert: true }
      )
      // Mutual?
      let matched = false
      let matchId = null
      if (target.userId) {
        const reverse = await db.collection('interactions').findOne({
          fromUserId: target.userId,
          toProfileId: myProfile?.id,
          action: 'like',
        })
        if (reverse) {
          matched = true
          const existing = await db.collection('matches').findOne({
            $or: [
              { userA: user.id, userB: target.userId },
              { userA: target.userId, userB: user.id },
            ],
          })
          if (!existing) {
            matchId = uuidv4()
            await db.collection('matches').insertOne({
              id: matchId,
              userA: user.id,
              userB: target.userId,
              profileA: myProfile?.id,
              profileB: profileId,
              createdAt: new Date(),
            })
          } else matchId = existing.id
        }
      }
      return NextResponse.json({ ok: true, matched, matchId })
    }

    if (path === 'profiles/skip' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { profileId } = await request.json()
      await db.collection('interactions').updateOne(
        { fromUserId: user.id, toProfileId: profileId, action: 'skip' },
        { $set: { fromUserId: user.id, toProfileId: profileId, action: 'skip', createdAt: new Date() } },
        { upsert: true }
      )
      return NextResponse.json({ ok: true })
    }

    // === MATCHES ===
    if (path === 'matches' && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const matches = await db.collection('matches').find({ $or: [{ userA: user.id }, { userB: user.id }] }).sort({ createdAt: -1 }).toArray()
      const enriched = await Promise.all(matches.map(async (m) => {
        const otherProfileId = m.userA === user.id ? m.profileB : m.profileA
        const otherProfile = await db.collection('profiles').findOne({ id: otherProfileId })
        return { ...m, otherProfile }
      }))
      return NextResponse.json({ matches: enriched })
    }

    // === MESSAGES ===
    if (path === 'messages' && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const url = new URL(request.url)
      const matchId = url.searchParams.get('matchId')
      if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })
      const msgs = await db.collection('messages').find({ matchId }).sort({ createdAt: 1 }).toArray()
      return NextResponse.json({ messages: msgs })
    }

    if (path === 'messages' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { matchId, text } = await request.json()
      if (!matchId || !text?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      // Naive moderation flag
      const banned = ['nudes', 'sexy', 'send pics', 'horny']
      const flagged = banned.some(w => text.toLowerCase().includes(w))
      const msg = { id: uuidv4(), matchId, fromUserId: user.id, text: text.trim(), flagged, createdAt: new Date() }
      await db.collection('messages').insertOne(msg)
      if (flagged) {
        await db.collection('moderation_actions').insertOne({
          id: uuidv4(), userId: user.id, type: 'inappropriate_message', messageId: msg.id, severity: 'warn', createdAt: new Date(),
        })
      }
      return NextResponse.json({ message: msg })
    }

    // === REPORTS / BLOCKS ===
    if (path === 'reports' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { profileId, reason } = await request.json()
      await db.collection('reports').insertOne({ id: uuidv4(), reporterId: user.id, profileId, reason, status: 'open', createdAt: new Date() })
      return NextResponse.json({ ok: true })
    }

    if (path === 'blocks' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { profileId } = await request.json()
      await db.collection('blocks').insertOne({ id: uuidv4(), blockerId: user.id, blockedProfileId: profileId, createdAt: new Date() })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err) {
    console.error('API error', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
