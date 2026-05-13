import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError, distanceKm, computeMatchReasons, isProfileDiscoverable } from '../utils'
import { getConnectionExclusions } from './requests'

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

  let myProfile = null
  const excludeIds = []
  let blockedByUserIds = []
  let excludeUserIds = []
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

    // Connection request exclusions: pending sent, accepted, declined-within-cooldown.
    const conn = await getConnectionExclusions(db, user.id)
    excludeUserIds = [...conn.sentUserIds, ...conn.declinedUserIds]
  }
  if (excludeIds.length) query.id = { $nin: excludeIds }
  const allBlockedUserIds = [...blockedByUserIds, ...excludeUserIds]
  if (allBlockedUserIds.length) query.userId = { $nin: allBlockedUserIds }
  let profiles = await db.collection('profiles').find(query).limit(200).toArray()

  // Only surface discoverable profiles (must satisfy completion gate)
  profiles = profiles.filter(p => isProfileDiscoverable(p))

  profiles = profiles.map(p => {
    const distanceKmVal = myProfile?.location && p.location ? distanceKm(myProfile.location, p.location) : null
    const matchReasons = computeMatchReasons(myProfile, p)
    // PRIVACY: strip last-active / online presence from non-connected profiles.
    // Users only learn presence info AFTER a mutual connection is established.
    const { lastActiveAt, location, ...safe } = p
    return { ...safe, distanceKm: distanceKmVal, matchReasons }
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
