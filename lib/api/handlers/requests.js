import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError, notify } from '../utils'

// 30-day cooldown after a soft decline before sender can request again.
export const REQUEST_COOLDOWN_DAYS = 30

function cooldownMs() { return REQUEST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000 }

/**
 * POST /api/profiles/connect (also aliased from /api/profiles/like)
 * Body: { profileId }
 *
 * Logic:
 *   1. If target user already sent ME a pending request → AUTO-ACCEPT (creates match + chat).
 *   2. Else create new pending connection_request.
 *   3. If we were previously declined by them < 30 days ago → 429 with cooldownUntil.
 *   4. Idempotent: re-sending while pending returns existing request, no duplicate.
 */
export async function postConnect(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { profileId } = await request.json().catch(() => ({}))
  if (!profileId) return jsonError('profileId required', 400)

  const myProfile = await db.collection('profiles').findOne({ userId: user.id })
  if (!myProfile) return jsonError('Create profile first', 400)
  const target = await db.collection('profiles').findOne({ id: profileId })
  if (!target) return jsonError('Profile not found', 404)
  if (!target.userId) return jsonError('Profile cannot receive requests', 400)
  if (target.userId === user.id) return jsonError('Cannot connect with yourself', 400)

  // Record interaction for legacy discover exclusion (back-compat with existing data).
  await db.collection('interactions').updateOne(
    { fromUserId: user.id, toProfileId: profileId, action: 'like' },
    { $set: { fromUserId: user.id, toUserId: target.userId, fromProfileId: myProfile.id, toProfileId: profileId, action: 'like', createdAt: new Date() } },
    { upsert: true },
  )

  // 1) Auto-accept if target already requested me (pending in their direction)
  const incoming = await db.collection('connection_requests').findOne({
    fromUserId: target.userId,
    toUserId: user.id,
    status: 'pending',
  })
  if (incoming) {
    return await acceptRequestInternal(db, incoming, { actor: user, myProfile, otherProfile: target })
  }

  // 2) Check cooldown — was I declined by them recently?
  const recentlyDeclined = await db.collection('connection_requests').findOne({
    fromUserId: user.id,
    toUserId: target.userId,
    status: 'declined',
    declinedAt: { $gte: new Date(Date.now() - cooldownMs()) },
  })
  if (recentlyDeclined) {
    const cooldownUntil = new Date(new Date(recentlyDeclined.declinedAt).getTime() + cooldownMs())
    return NextResponse.json({
      error: 'You can connect again later.',
      status: 'cooldown',
      cooldownUntil,
    }, { status: 429 })
  }

  // 3) If already accepted (existing match), just return existing match
  const existingMatch = await db.collection('matches').findOne({
    $or: [
      { userA: user.id, userB: target.userId },
      { userA: target.userId, userB: user.id },
    ],
  })
  if (existingMatch) {
    return NextResponse.json({ ok: true, status: 'accepted', matchId: existingMatch.id, alreadyConnected: true })
  }

  // 4) Idempotent: existing pending request from me → return it
  const existingOutgoing = await db.collection('connection_requests').findOne({
    fromUserId: user.id,
    toUserId: target.userId,
    status: 'pending',
  })
  if (existingOutgoing) {
    return NextResponse.json({ ok: true, status: 'pending', requestId: existingOutgoing.id, idempotent: true })
  }

  // 5) Create new pending request
  const requestId = uuidv4()
  await db.collection('connection_requests').insertOne({
    id: requestId,
    fromUserId: user.id,
    fromProfileId: myProfile.id,
    toUserId: target.userId,
    toProfileId: target.id,
    status: 'pending',
    createdAt: new Date(),
  })

  // Notify target
  await notify(db, target.userId, {
    type: 'connect_request',
    title: `${myProfile.name} wants to connect`,
    body: 'Open Connections › Requests to respond.',
    data: { requestId, profileId: myProfile.id },
  })

  return NextResponse.json({ ok: true, status: 'pending', requestId })
}

// Internal helper: accept a request and create the match + notifications.
async function acceptRequestInternal(db, req, ctx = {}) {
  // Mark request accepted
  const matchId = uuidv4()
  await db.collection('connection_requests').updateOne(
    { id: req.id },
    { $set: { status: 'accepted', respondedAt: new Date(), matchId } },
  )
  // Also accept any pending request in the reverse direction (mutual taps)
  await db.collection('connection_requests').updateMany(
    {
      fromUserId: req.toUserId,
      toUserId: req.fromUserId,
      status: 'pending',
    },
    { $set: { status: 'accepted', respondedAt: new Date(), matchId } },
  )

  // Create match (idempotent)
  const existingMatch = await db.collection('matches').findOne({
    $or: [
      { userA: req.fromUserId, userB: req.toUserId },
      { userA: req.toUserId, userB: req.fromUserId },
    ],
  })
  let finalMatchId = existingMatch?.id
  if (!existingMatch) {
    finalMatchId = matchId
    await db.collection('matches').insertOne({
      id: matchId,
      userA: req.fromUserId,
      userB: req.toUserId,
      profileA: req.fromProfileId,
      profileB: req.toProfileId,
      createdAt: new Date(),
    })
  } else {
    // Sync the request's matchId to the real one
    await db.collection('connection_requests').updateMany(
      { id: { $in: [req.id] }, status: 'accepted' },
      { $set: { matchId: existingMatch.id } },
    )
  }

  // Names for friendly notifications
  const [fromProfile, toProfile] = await Promise.all([
    ctx.myProfile && ctx.myProfile.userId === req.fromUserId
      ? ctx.myProfile
      : db.collection('profiles').findOne({ id: req.fromProfileId }),
    ctx.otherProfile && ctx.otherProfile.userId === req.toUserId
      ? ctx.otherProfile
      : db.collection('profiles').findOne({ id: req.toProfileId }),
  ])
  await notify(db, req.fromUserId, {
    type: 'new_match',
    title: `You're now connected with ${toProfile?.name || 'a partner'} 💪`,
    body: 'Plan your next workout together — open chat.',
    data: { matchId: finalMatchId },
  })
  await notify(db, req.toUserId, {
    type: 'new_match',
    title: `You're now connected with ${fromProfile?.name || 'a partner'} 💪`,
    body: 'Plan your next workout together — open chat.',
    data: { matchId: finalMatchId },
  })

  return NextResponse.json({ ok: true, status: 'accepted', matched: true, matchId: finalMatchId })
}

/** Back-compat alias — old clients calling /api/profiles/like still work. */
export const postLike = postConnect

/** GET /api/requests/incoming — pending requests where I'm the target. */
export async function getIncomingRequests(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const reqs = await db.collection('connection_requests')
    .find({ toUserId: user.id, status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray()
  const fromProfileIds = reqs.map(r => r.fromProfileId).filter(Boolean)
  const profiles = fromProfileIds.length
    ? await db.collection('profiles').find({ id: { $in: fromProfileIds } }).toArray()
    : []
  const byId = Object.fromEntries(profiles.map(p => {
    // Strip lastActiveAt + location for privacy (still non-connected at this stage)
    const { lastActiveAt: _la, location: _loc, ...safe } = p
    return [p.id, safe]
  }))
  const enriched = reqs.map(r => ({ ...r, fromProfile: byId[r.fromProfileId] || null }))
  return NextResponse.json({ requests: enriched, total: enriched.length })
}

/** GET /api/requests/outgoing — pending requests I sent. */
export async function getOutgoingRequests(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const reqs = await db.collection('connection_requests')
    .find({ fromUserId: user.id, status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray()
  const toProfileIds = reqs.map(r => r.toProfileId).filter(Boolean)
  const profiles = toProfileIds.length
    ? await db.collection('profiles').find({ id: { $in: toProfileIds } }).toArray()
    : []
  const byId = Object.fromEntries(profiles.map(p => {
    const { lastActiveAt: _la, location: _loc, ...safe } = p
    return [p.id, safe]
  }))
  const enriched = reqs.map(r => ({ ...r, toProfile: byId[r.toProfileId] || null }))
  return NextResponse.json({ requests: enriched, total: enriched.length })
}

/** POST /api/requests/accept  Body: { requestId }  — accepts an incoming request. */
export async function postAcceptRequest(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { requestId } = await request.json().catch(() => ({}))
  if (!requestId) return jsonError('requestId required', 400)
  const req = await db.collection('connection_requests').findOne({ id: requestId })
  if (!req) return jsonError('Request not found', 404)
  if (req.toUserId !== user.id) return jsonError('Forbidden', 403)
  if (req.status !== 'pending') return jsonError(`Request already ${req.status}`, 400)
  return await acceptRequestInternal(db, req)
}

/** POST /api/requests/decline  Body: { requestId }  — SOFT decline; no notification to sender. */
export async function postDeclineRequest(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { requestId } = await request.json().catch(() => ({}))
  if (!requestId) return jsonError('requestId required', 400)
  const req = await db.collection('connection_requests').findOne({ id: requestId })
  if (!req) return jsonError('Request not found', 404)
  if (req.toUserId !== user.id) return jsonError('Forbidden', 403)
  if (req.status !== 'pending') return jsonError(`Request already ${req.status}`, 400)
  await db.collection('connection_requests').updateOne(
    { id: requestId },
    { $set: { status: 'declined', declinedAt: new Date(), respondedAt: new Date() } },
  )
  // Soft decline: NO notification to the sender per product decision.
  return NextResponse.json({ ok: true, status: 'declined' })
}

/** POST /api/requests/cancel  Body: { requestId }  — user retracts an outgoing pending request. */
export async function postCancelRequest(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { requestId } = await request.json().catch(() => ({}))
  if (!requestId) return jsonError('requestId required', 400)
  const req = await db.collection('connection_requests').findOne({ id: requestId })
  if (!req) return jsonError('Request not found', 404)
  if (req.fromUserId !== user.id) return jsonError('Forbidden', 403)
  if (req.status !== 'pending') return jsonError(`Request already ${req.status}`, 400)
  await db.collection('connection_requests').deleteOne({ id: requestId })
  // Also clear the legacy "like" interaction so the profile reappears in Discover
  await db.collection('interactions').deleteOne({
    fromUserId: user.id, toUserId: req.toUserId, action: 'like',
  })
  return NextResponse.json({ ok: true, status: 'cancelled' })
}

/**
 * Helper used by discover.js: returns Sets of userIds the current user has
 *   a) pending request to (sent),
 *   b) accepted connection with,
 *   c) been declined by within cooldown window.
 */
export async function getConnectionExclusions(db, userId) {
  const sinceCutoff = new Date(Date.now() - cooldownMs())
  const [requests, declined] = await Promise.all([
    db.collection('connection_requests')
      .find({
        $or: [
          { fromUserId: userId, status: { $in: ['pending', 'accepted'] } },
          { toUserId: userId, status: { $in: ['pending', 'accepted'] } }
        ]
      }, { projection: { fromUserId: 1, toUserId: 1, _id: 0 } })
      .toArray(),
    db.collection('connection_requests')
      .find({ fromUserId: userId, status: 'declined', declinedAt: { $gte: sinceCutoff } }, { projection: { toUserId: 1, _id: 0 } })
      .toArray(),
  ])
  const sentUserIds = new Set()
  for (const r of requests) {
    if (r.fromUserId === userId) sentUserIds.add(r.toUserId)
    if (r.toUserId === userId) sentUserIds.add(r.fromUserId)
  }
  return {
    sentUserIds,
    declinedUserIds: new Set(declined.map(x => x.toUserId).filter(Boolean)),
  }
}
