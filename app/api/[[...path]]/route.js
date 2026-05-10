import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { buildSeedProfiles } from '@/lib/seed'
import { v4 as uuidv4 } from 'uuid'

const AUTH_API = process.env.EMERGENT_AUTH_URL || 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data'
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'hello@trainr.in').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
const BANNED_WORDS = ['nudes', 'sexy', 'send pics', 'horny', 'hookup', 'sext', 'dick', 'pussy', 'boobs']

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

function isAdmin(user) {
  return !!user && ADMIN_EMAILS.includes((user.email || '').toLowerCase())
}

async function ensureSeed(db) {
  const count = await db.collection('profiles').countDocuments({ isSeed: true })
  if (count >= 20) return
  const seeds = buildSeedProfiles()
  if (seeds.length) await db.collection('profiles').insertMany(seeds)
}

function distanceKm(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat/2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2) ** 2
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(x))))
}

function computeMatchReasons(me, them) {
  if (!me) return []
  const reasons = []
  if (me.gymName && them.gymName && me.gymName.toLowerCase() === them.gymName.toLowerCase()) reasons.push({ key: 'gym', label: 'Same gym' })
  else if (me.city && them.city && me.city === them.city) reasons.push({ key: 'city', label: 'Same city' })
  if (me.goal && them.goal && me.goal === them.goal) reasons.push({ key: 'goal', label: 'Same goal' })
  if (me.timing && them.timing && me.timing === them.timing) reasons.push({ key: 'timing', label: 'Same timing' })
  if (me.level && them.level && me.level === them.level) reasons.push({ key: 'level', label: `Both ${them.level.toLowerCase()}` })
  return reasons.slice(0, 3)
}

async function notify(db, userId, payload) {
  if (!userId) return
  const doc = { id: uuidv4(), userId, read: false, createdAt: new Date(), ...payload }
  await db.collection('notifications').insertOne(doc)
}

async function handler(request, { params }) {
  const path = (params?.path || []).join('/')
  const method = request.method
  const db = await getDb()
  await ensureSeed(db)

  try {
    if (path === '' && method === 'GET') return NextResponse.json({ ok: true, app: 'trainr' })

    // === AUTH ===
    if (path === 'auth/session' && method === 'POST') {
      const { sessionId } = await request.json()
      if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
      const r = await fetch(AUTH_API, { headers: { 'X-Session-ID': sessionId } })
      if (!r.ok) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      const data = await r.json()
      let user = await db.collection('users').findOne({ email: data.email })
      if (!user) {
        user = { id: uuidv4(), email: data.email, name: data.name, picture: data.picture, provider: 'emergent', createdAt: new Date() }
        await db.collection('users').insertOne(user)
      }
      // Banned check
      if (user.banned) return NextResponse.json({ error: 'Account suspended. Contact hello@trainr.in' }, { status: 403 })
      const token = data.session_token || uuidv4()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await db.collection('sessions').insertOne({ token, userId: user.id, createdAt: new Date(), expiresAt })
      const profile = await db.collection('profiles').findOne({ userId: user.id })
      const res = NextResponse.json({ user: { ...user, isAdmin: isAdmin(user) }, hasProfile: !!profile, onboardingCompleted: !!profile?.onboardingCompleted })
      res.cookies.set('spottr_session', token, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 7 * 24 * 60 * 60 })
      return res
    }

    if (path === 'auth/me' && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ user: null }, { status: 200 })
      if (user.banned) {
        return NextResponse.json({ user: null, banned: true }, { status: 200 })
      }
      const profile = await db.collection('profiles').findOne({ userId: user.id })
      // Update lastActiveAt
      if (profile) {
        await db.collection('profiles').updateOne({ id: profile.id }, { $set: { lastActiveAt: new Date(), online: true } })
      }
      return NextResponse.json({
        user: { ...user, isAdmin: isAdmin(user) },
        profile: profile || null,
        onboardingCompleted: !!profile?.onboardingCompleted,
      })
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
      if (photos.length < 3) return NextResponse.json({ error: 'At least 3 photos required' }, { status: 400 })
      if (photos.length > 5) return NextResponse.json({ error: 'Maximum 5 photos allowed' }, { status: 400 })
      const required = ['name', 'age', 'gender', 'city', 'gymName', 'level', 'goal', 'timing']
      for (const f of required) if (!body[f]) return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 })
      const existing = await db.collection('profiles').findOne({ userId: user.id })
      const profileDoc = {
        id: existing?.id || uuidv4(),
        userId: user.id,
        isSeed: false,
        name: String(body.name).trim().slice(0, 60),
        age: Number(body.age) || null,
        gender: body.gender,
        city: body.city,
        gymName: String(body.gymName).trim().slice(0, 80),
        level: body.level,
        goal: body.goal,
        timing: body.timing,
        bio: String(body.bio || '').trim().slice(0, 240),
        height: Number(body.height) || null,
        weight: Number(body.weight) || null,
        instagram: body.instagram ? String(body.instagram).replace('@','').trim().slice(0, 30) : null,
        photos,
        location: existing?.location || null,
        verified: !!body.instagram || !!existing?.verified,
        verifications: existing?.verifications || { selfie: false, instagram: !!body.instagram, gym: false },
        verificationRequests: existing?.verificationRequests || { selfie: 'none', instagram: body.instagram ? 'approved' : 'none', gym: 'none' },
        online: true,
        lastActiveAt: new Date(),
        onboardingCompleted: true,
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

    if (path === 'profile/location' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { lat, lng } = await request.json()
      if (typeof lat !== 'number' || typeof lng !== 'number') return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
      await db.collection('profiles').updateOne({ userId: user.id }, { $set: { location: { lat, lng, updatedAt: new Date() } } })
      return NextResponse.json({ ok: true })
    }

    if (path === 'profile/verify-selfie' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { selfie } = await request.json()
      if (!selfie || typeof selfie !== 'string' || !selfie.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Invalid selfie image' }, { status: 400 })
      }
      const existing = await db.collection('profiles').findOne({ userId: user.id })
      if (!existing) return NextResponse.json({ error: 'Create your profile first' }, { status: 400 })
      // MOCKED auto-approve
      await db.collection('profiles').updateOne({ userId: user.id }, {
        $set: {
          'verifications.selfie': true,
          'verificationRequests.selfie': 'approved',
          verified: true,
          selfiePhoto: selfie,
          updatedAt: new Date(),
        },
      })
      await notify(db, user.id, { type: 'verification_approved', title: 'Selfie verified ✓', body: 'You\u2019ve earned the trusted badge.' })
      const updated = await db.collection('profiles').findOne({ userId: user.id })
      return NextResponse.json({ ok: true, profile: updated })
    }

    if (path === 'profile/verify-request' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { type } = await request.json()
      if (!['gym', 'instagram'].includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
      // MOCKED auto-approve after 1.5s wait (frontend handles fake delay)
      const update = {}
      update[`verificationRequests.${type}`] = 'pending'
      await db.collection('profiles').updateOne({ userId: user.id }, { $set: update })
      // Auto-approve immediately for MVP
      const setApproved = {}
      setApproved[`verificationRequests.${type}`] = 'approved'
      setApproved[`verifications.${type}`] = true
      setApproved.verified = true
      setApproved.updatedAt = new Date()
      await db.collection('profiles').updateOne({ userId: user.id }, { $set: setApproved })
      await notify(db, user.id, { type: 'verification_approved', title: `${type === 'gym' ? 'Gym membership' : 'Instagram'} verified ✓`, body: 'Your profile now shows the trusted badge.' })
      const updated = await db.collection('profiles').findOne({ userId: user.id })
      return NextResponse.json({ ok: true, profile: updated })
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
        recentlyActive: url.searchParams.get('recentlyActive') === 'true',
        maxDistance: parseInt(url.searchParams.get('maxDistance') || '0', 10) || 0,
      }
      const query = {}
      if (filters.city) query.city = filters.city
      if (filters.gym) query.gymName = { $regex: new RegExp(filters.gym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      if (filters.goal) query.goal = filters.goal
      if (filters.timing) query.timing = filters.timing
      if (filters.gender) query.gender = filters.gender
      if (filters.level) query.level = filters.level
      if (filters.verifiedOnly) query.verified = true
      if (filters.recentlyActive) {
        // Within last 48h OR online OR seed (treat seeds as active for demo)
        query.$or = [
          { online: true },
          { lastActiveAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
          { isSeed: true },
        ]
      }

      let myProfile = null
      let excludeIds = []
      if (user) {
        myProfile = await db.collection('profiles').findOne({ userId: user.id })
        if (myProfile) excludeIds.push(myProfile.id)
        const interactions = await db.collection('interactions')
          .find({ fromUserId: user.id, action: { $in: ['skip', 'like'] } }, { projection: { toProfileId: 1, _id: 0 } })
          .toArray()
        excludeIds.push(...interactions.map(i => i.toProfileId))
        const blocks = await db.collection('blocks')
          .find({ blockerId: user.id }, { projection: { blockedProfileId: 1, _id: 0 } })
          .toArray()
        excludeIds.push(...blocks.map(b => b.blockedProfileId))
      }
      if (excludeIds.length) query.id = { $nin: excludeIds }
      let profiles = await db.collection('profiles').find(query).limit(80).toArray()

      // Compute distance + reasons + sort
      profiles = profiles.map(p => {
        const distanceKmVal = myProfile?.location && p.location ? distanceKm(myProfile.location, p.location) : null
        const matchReasons = computeMatchReasons(myProfile, p)
        return { ...p, distanceKm: distanceKmVal, matchReasons }
      })
      if (filters.maxDistance > 0) {
        profiles = profiles.filter(p => p.distanceKm == null || p.distanceKm <= filters.maxDistance)
      }
      // Sort: same gym first, then most reasons, then nearest, then most recently active
      profiles.sort((a, b) => {
        const ar = (a.matchReasons || []).length
        const br = (b.matchReasons || []).length
        if (br !== ar) return br - ar
        const ad = a.distanceKm == null ? 9999 : a.distanceKm
        const bd = b.distanceKm == null ? 9999 : b.distanceKm
        if (ad !== bd) return ad - bd
        const at = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0
        const bt = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0
        return bt - at
      })
      return NextResponse.json({ profiles: profiles.slice(0, 50) })
    }

    if (path === 'profiles/like' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { profileId } = await request.json()
      const myProfile = await db.collection('profiles').findOne({ userId: user.id })
      if (!myProfile) return NextResponse.json({ error: 'Create profile first' }, { status: 400 })
      const target = await db.collection('profiles').findOne({ id: profileId })
      if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      await db.collection('interactions').updateOne(
        { fromUserId: user.id, toProfileId: profileId, action: 'like' },
        { $set: { fromUserId: user.id, toUserId: target.userId, fromProfileId: myProfile.id, toProfileId: profileId, action: 'like', createdAt: new Date() } },
        { upsert: true }
      )
      let matched = false
      let matchId = null
      if (target.userId) {
        // Notify target user of connect request (only if not already)
        await notify(db, target.userId, { type: 'connect_request', title: `${myProfile.name} wants to connect`, body: 'Open Discover to connect back.', data: { profileId: myProfile.id } })
        const reverse = await db.collection('interactions').findOne({ fromUserId: target.userId, toProfileId: myProfile.id, action: 'like' })
        if (reverse) {
          matched = true
          const existing = await db.collection('matches').findOne({
            $or: [{ userA: user.id, userB: target.userId }, { userA: target.userId, userB: user.id }],
          })
          if (!existing) {
            matchId = uuidv4()
            await db.collection('matches').insertOne({
              id: matchId, userA: user.id, userB: target.userId,
              profileA: myProfile.id, profileB: profileId, createdAt: new Date(),
            })
            await notify(db, user.id, { type: 'new_match', title: `Mutual connection with ${target.name}!`, body: 'Open Connections to start chatting.', data: { matchId } })
            await notify(db, target.userId, { type: 'new_match', title: `Mutual connection with ${myProfile.name}!`, body: 'Open Connections to start chatting.', data: { matchId } })
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
      const matches = await db.collection('matches')
        .find({ $or: [{ userA: user.id }, { userB: user.id }] })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray()
      const otherProfileIds = matches.map(m => (m.userA === user.id ? m.profileB : m.profileA)).filter(Boolean)
      const profiles = otherProfileIds.length
        ? await db.collection('profiles').find({ id: { $in: otherProfileIds } }).toArray()
        : []
      const profileById = Object.fromEntries(profiles.map(p => [p.id, p]))
      // Last message + unread count per match
      const matchIds = matches.map(m => m.id)
      const lastMsgsArr = matchIds.length
        ? await db.collection('messages').aggregate([
            { $match: { matchId: { $in: matchIds } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$matchId', last: { $first: '$$ROOT' } } },
          ]).toArray()
        : []
      const lastMsgByMatch = Object.fromEntries(lastMsgsArr.map(x => [x._id, x.last]))
      const unreadCounts = matchIds.length
        ? await db.collection('messages').aggregate([
            { $match: { matchId: { $in: matchIds }, fromUserId: { $ne: user.id }, readBy: { $ne: user.id } } },
            { $group: { _id: '$matchId', count: { $sum: 1 } } },
          ]).toArray()
        : []
      const unreadByMatch = Object.fromEntries(unreadCounts.map(x => [x._id, x.count]))
      const enriched = matches.map(m => {
        const otherProfileId = m.userA === user.id ? m.profileB : m.profileA
        const lm = lastMsgByMatch[m.id] || null
        return {
          ...m,
          otherProfile: profileById[otherProfileId] || null,
          lastMessage: lm ? { text: lm.text, createdAt: lm.createdAt, fromMe: lm.fromUserId === user.id } : null,
          unreadCount: unreadByMatch[m.id] || 0,
        }
      })
      return NextResponse.json({ matches: enriched })
    }

    // === MESSAGES ===
    if (path === 'messages' && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const url = new URL(request.url)
      const matchId = url.searchParams.get('matchId')
      if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })
      const match = await db.collection('matches').findOne({ id: matchId })
      if (!match || (match.userA !== user.id && match.userB !== user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const msgs = await db.collection('messages')
        .find({ matchId })
        .sort({ createdAt: 1 })
        .limit(200)
        .toArray()
      // Auto-mark received messages as read
      await db.collection('messages').updateMany(
        { matchId, fromUserId: { $ne: user.id }, readBy: { $ne: user.id } },
        { $addToSet: { readBy: user.id }, $set: { readAt: new Date() } }
      )
      // Get typing state of other user
      const otherUserId = match.userA === user.id ? match.userB : match.userA
      const typing = await db.collection('typing').findOne({ matchId, userId: otherUserId })
      const isTyping = typing && new Date(typing.until) > new Date()
      return NextResponse.json({ messages: msgs, otherTyping: !!isTyping })
    }

    if (path === 'messages' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { matchId, text } = await request.json()
      if (!matchId || !text?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      if (text.length > 1000) return NextResponse.json({ error: 'Message too long' }, { status: 400 })
      const match = await db.collection('matches').findOne({ id: matchId })
      if (!match || (match.userA !== user.id && match.userB !== user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      // Spam: rate limit — max 30 msgs in last 10 min
      const since = new Date(Date.now() - 10 * 60 * 1000)
      const recent = await db.collection('messages').countDocuments({ fromUserId: user.id, createdAt: { $gte: since } })
      if (recent >= 30) return NextResponse.json({ error: 'Slow down — too many messages' }, { status: 429 })
      const flagged = BANNED_WORDS.some(w => text.toLowerCase().includes(w))
      const msg = { id: uuidv4(), matchId, fromUserId: user.id, text: text.trim(), flagged, readBy: [user.id], createdAt: new Date() }
      await db.collection('messages').insertOne(msg)
      const otherUserId = match.userA === user.id ? match.userB : match.userA
      // Notify recipient
      const myProfile = await db.collection('profiles').findOne({ userId: user.id }, { projection: { name: 1 } })
      await notify(db, otherUserId, { type: 'new_message', title: `${myProfile?.name || 'Someone'}: ${text.trim().slice(0, 60)}`, body: '', data: { matchId } })
      if (flagged) {
        await db.collection('moderation_actions').insertOne({
          id: uuidv4(), userId: user.id, type: 'inappropriate_message', messageId: msg.id, severity: 'warn', createdAt: new Date(),
        })
        // Count strikes; auto-suspend on 3
        const strikes = await db.collection('moderation_actions').countDocuments({ userId: user.id, type: 'inappropriate_message' })
        if (strikes >= 3) {
          await db.collection('users').updateOne({ id: user.id }, { $set: { banned: true, bannedAt: new Date(), banReason: 'Repeated inappropriate messages' } })
        }
      }
      return NextResponse.json({ message: msg })
    }

    if (path === 'messages/typing' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { matchId } = await request.json()
      if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })
      const until = new Date(Date.now() + 4000)
      await db.collection('typing').updateOne(
        { matchId, userId: user.id },
        { $set: { matchId, userId: user.id, until } },
        { upsert: true }
      )
      return NextResponse.json({ ok: true })
    }

    // === NOTIFICATIONS ===
    if (path === 'notifications' && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const list = await db.collection('notifications')
        .find({ userId: user.id })
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray()
      const unread = await db.collection('notifications').countDocuments({ userId: user.id, read: false })
      return NextResponse.json({ notifications: list, unread })
    }

    if (path === 'notifications/read' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const body = await request.json().catch(() => ({}))
      const filter = { userId: user.id }
      if (body.id) filter.id = body.id
      await db.collection('notifications').updateMany(filter, { $set: { read: true } })
      return NextResponse.json({ ok: true })
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

    // === ADMIN ===
    if (path.startsWith('admin/')) {
      const user = await getUserFromRequest(request)
      if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      if (path === 'admin/stats' && method === 'GET') {
        const [users, profiles, matches, messages, reports, banned, verified] = await Promise.all([
          db.collection('users').countDocuments({}),
          db.collection('profiles').countDocuments({ isSeed: { $ne: true } }),
          db.collection('matches').countDocuments({}),
          db.collection('messages').countDocuments({}),
          db.collection('reports').countDocuments({ status: 'open' }),
          db.collection('users').countDocuments({ banned: true }),
          db.collection('profiles').countDocuments({ verified: true, isSeed: { $ne: true } }),
        ])
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const activeNow = await db.collection('profiles').countDocuments({ lastActiveAt: { $gte: since }, isSeed: { $ne: true } })
        return NextResponse.json({ stats: { users, profiles, matches, messages, openReports: reports, banned, verified, activeNow } })
      }
      if (path === 'admin/users' && method === 'GET') {
        const users = await db.collection('users').find({}).sort({ createdAt: -1 }).limit(100).toArray()
        return NextResponse.json({ users })
      }
      if (path === 'admin/reports' && method === 'GET') {
        const reports = await db.collection('reports').find({}).sort({ createdAt: -1 }).limit(100).toArray()
        return NextResponse.json({ reports })
      }
      if (path === 'admin/ban' && method === 'POST') {
        const { userId } = await request.json()
        await db.collection('users').updateOne({ id: userId }, { $set: { banned: true, bannedAt: new Date(), banReason: 'Admin action' } })
        return NextResponse.json({ ok: true })
      }
      if (path === 'admin/unban' && method === 'POST') {
        const { userId } = await request.json()
        await db.collection('users').updateOne({ id: userId }, { $set: { banned: false } })
        return NextResponse.json({ ok: true })
      }
      if (path === 'admin/report-resolve' && method === 'POST') {
        const { id } = await request.json()
        await db.collection('reports').updateOne({ id }, { $set: { status: 'resolved', resolvedAt: new Date() } })
        return NextResponse.json({ ok: true })
      }
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
