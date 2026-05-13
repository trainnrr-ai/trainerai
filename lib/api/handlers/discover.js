import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError, distanceKm, computeMatchReasons, isProfileDiscoverable } from '../utils'
import { getConnectionExclusions } from './requests'

export async function getDiscover(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  const url = new URL(request.url)
  // Multi-goal filter: accepts ?goals=Fat%20Loss,Muscle%20Gain OR repeated ?goal=X&goal=Y (back-compat with single ?goal=X).
  const goalsParam = url.searchParams.get('goals')
  const goalParams = url.searchParams.getAll('goal').filter(Boolean)
  let goalsFilter = []
  if (goalsParam) goalsFilter = goalsParam.split(',').map(g => g.trim()).filter(Boolean)
  else if (goalParams.length) goalsFilter = goalParams
  const filters = {
    city: url.searchParams.get('city') || null,
    gym: url.searchParams.get('gym') || null,
    goals: goalsFilter, // array
    timing: url.searchParams.get('timing') || null,
    gender: url.searchParams.get('gender') || null,
    level: url.searchParams.get('level') || null,
    verifiedOnly: url.searchParams.get('verifiedOnly') === 'true',
    maxDistance: parseInt(url.searchParams.get('maxDistance') || '0', 10) || 0,
    ageMin: parseInt(url.searchParams.get('ageMin') || '0', 10) || 0,
    ageMax: parseInt(url.searchParams.get('ageMax') || '0', 10) || 0,
  }
  const query = {
    // Hard exclusion: never return any legacy seed/demo profiles, even if cleanup hasn't run yet
    isSeed: { $ne: true },
  }
  if (filters.city) query.city = filters.city
  if (filters.gym) query.gymName = { $regex: new RegExp(filters.gym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
  if (filters.goals.length) {
    // Match profiles where either the primary `goal` OR any item in `goals[]` overlaps with the filter.
    query.$or = [
      { goal: { $in: filters.goals } },
      { goals: { $in: filters.goals } },
    ]
  }
  if (filters.timing) query.timing = filters.timing
  if (filters.gender) query.gender = filters.gender
  if (filters.level) query.level = filters.level
  if (filters.verifiedOnly) query.verified = true
  if (filters.ageMin || filters.ageMax) {
    query.age = {}
    if (filters.ageMin) query.age.$gte = filters.ageMin
    if (filters.ageMax) query.age.$lte = filters.ageMax
  }

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
    // Relevance score: match reasons + verified + photo richness + bio + multi-goal overlap heavy weight.
    // Multi-goal overlap is the heaviest signal (workout-type compatibility).
    const myGoals = Array.isArray(myProfile?.goals) && myProfile.goals.length ? myProfile.goals : (myProfile?.goal ? [myProfile.goal] : [])
    const aGoals = Array.isArray(a.goals) && a.goals.length ? a.goals : (a.goal ? [a.goal] : [])
    const bGoals = Array.isArray(b.goals) && b.goals.length ? b.goals : (b.goal ? [b.goal] : [])
    const aOverlap = myGoals.filter(g => aGoals.includes(g)).length
    const bOverlap = myGoals.filter(g => bGoals.includes(g)).length
    const score = (p, overlap) =>
      (p.matchReasons || []).length
      + (p.verified ? 2 : 0)
      + (p.photos?.length >= 4 ? 1 : 0)
      + (p.bio && p.bio.length >= 40 ? 1 : 0)
      + overlap * 3 // heavy weight on overlapping goals
    const ar = score(a, aOverlap)
    const br = score(b, bOverlap)
    if (br !== ar) return br - ar
    // Tie-breakers: verified > distance
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
