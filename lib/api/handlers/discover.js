import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError, distanceKm, computeMatchReasons, notify, isProfileDiscoverable } from '../utils'

export async function getDiscover(request) {
  const db = await getDb()
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
  const query = {
    // Hard exclusion: never return any legacy seed/demo profiles, even if cleanup hasn't run yet
    isSeed: { $ne: true },
  }
  if (filters.city) query.city = filters.city
  if (filters.gym) query.gymName = { $regex: new RegExp(filters.gym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
  if (filters.goal) query.goal = filters.goal
  if (filters.timing) query.timing = filters.timing
  if (filters.gender) query.gender = filters.gender
  if (filters.level) query.level = filters.level
  if (filters.verifiedOnly) query.verified = true
  if (filters.recentlyActive) {
    query.$or = [
      { lastActiveAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
    ]
  }

  let myProfile = null
  const excludeIds = []
  let blockedByUserIds = []
  if (user) {
    myProfile = await db.collection('profiles').findOne({ userId: user.id })
    if (myProfile) excludeIds.push(myProfile.id)
    const interactions = await db.collection('interactions')
      .find({ fromUserId: user.id, action: { $in: ['skip', 'like'] } }, { projection: { toProfileId: 1, _id: 0 } })
      .toArray()
    excludeIds.push(...interactions.map(i => i.toProfileId))
    // Outgoing blocks (user blocked them) — hide
    const blocks = await db.collection('blocks')
      .find({ blockerId: user.id }, { projection: { blockedProfileId: 1, _id: 0 } })
      .toArray()
    excludeIds.push(...blocks.map(b => b.blockedProfileId))
    // Incoming blocks (they blocked user) — also hide them (two-way invisibility)
    const incoming = await db.collection('blocks')
      .find({ blockedUserId: user.id }, { projection: { blockerId: 1, _id: 0 } })
      .toArray()
    blockedByUserIds = incoming.map(b => b.blockerId).filter(Boolean)
  }
  if (excludeIds.length) query.id = { $nin: excludeIds }
  if (blockedByUserIds.length) query.userId = { $nin: blockedByUserIds }
  let profiles = await db.collection('profiles').find(query).limit(200).toArray()

  // Only surface discoverable profiles (must satisfy completion gate)
  profiles = profiles.filter(p => isProfileDiscoverable(p))

  profiles = profiles.map(p => {
    const distanceKmVal = myProfile?.location && p.location ? distanceKm(myProfile.location, p.location) : null
    const matchReasons = computeMatchReasons(myProfile, p)
    return { ...p, distanceKm: distanceKmVal, matchReasons }
  })
  if (filters.maxDistance > 0) {
    profiles = profiles.filter(p => p.distanceKm == null || p.distanceKm <= filters.maxDistance)
  }
  profiles.sort((a, b) => {
    // Verified users get a +1 relevance boost (priority placement)
    const ar = (a.matchReasons || []).length + (a.verified ? 1 : 0)
    const br = (b.matchReasons || []).length + (b.verified ? 1 : 0)
    if (br !== ar) return br - ar
    // Within same score, verified still wins
    if (!!b.verified !== !!a.verified) return (b.verified ? 1 : 0) - (a.verified ? 1 : 0)
    const ad = a.distanceKm == null ? 9999 : a.distanceKm
    const bd = b.distanceKm == null ? 9999 : b.distanceKm
    if (ad !== bd) return ad - bd
    const at = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0
    const bt = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0
    return bt - at
  })
  return NextResponse.json({ profiles: profiles.slice(0, 50) })
}

export async function postLike(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { profileId } = await request.json()
  const myProfile = await db.collection('profiles').findOne({ userId: user.id })
  if (!myProfile) return jsonError('Create profile first', 400)
  const target = await db.collection('profiles').findOne({ id: profileId })
  if (!target) return jsonError('Not found', 404)
  await db.collection('interactions').updateOne(
    { fromUserId: user.id, toProfileId: profileId, action: 'like' },
    { $set: { fromUserId: user.id, toUserId: target.userId, fromProfileId: myProfile.id, toProfileId: profileId, action: 'like', createdAt: new Date() } },
    { upsert: true },
  )
  let matched = false
  let matchId = null
  if (target.userId) {
    await notify(db, target.userId, {
      type: 'connect_request',
      title: `${myProfile.name} wants to connect`,
      body: 'Open Discover to connect back.',
      data: { profileId: myProfile.id },
    })
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

export async function postSkip(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { profileId } = await request.json()
  await db.collection('interactions').updateOne(
    { fromUserId: user.id, toProfileId: profileId, action: 'skip' },
    { $set: { fromUserId: user.id, toProfileId: profileId, action: 'skip', createdAt: new Date() } },
    { upsert: true },
  )
  return NextResponse.json({ ok: true })
}
