import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError, distanceKm, computeMatchReasons, isProfileDiscoverable } from '../utils'
import { getConnectionExclusions } from './requests'

export async function getDiscover(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  const url = new URL(request.url)
  const myProfile = user ? await db.collection('profiles').findOne({ userId: user.id }) : null
  
  // PROBLEM 2 — PAGINATION
  const pageNum = parseInt(url.searchParams.get('page') || '0', 10) || 0
  const skip = pageNum * 20
  
  const debug = url.searchParams.get('debug') === 'true'
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
  
  // Default to user's city if no city is filtered to ensure we hit Firestore index!
  const targetCity = filters.city || myProfile?.city || null
  if (targetCity && targetCity.trim() !== '') query.city = targetCity
  
  if (filters.gym && filters.gym.trim() !== '') query.gymName = { $regex: new RegExp(filters.gym.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
  if (Array.isArray(filters.goals) && filters.goals.length > 0) {
    // Match profiles where either the primary `goal` OR any item in `goals[]` overlaps with the filter.
    query.$or = [
      { goal: { $in: filters.goals } },
      { goals: { $in: filters.goals } },
    ]
  }
  if (filters.timing && filters.timing.trim() !== '') query.timing = filters.timing
  if (filters.gender && filters.gender.trim() !== '') query.gender = filters.gender
  if (filters.level && filters.level.trim() !== '') query.level = filters.level
  if (filters.verifiedOnly === true) query.verified = true
  if (filters.ageMin > 0 || filters.ageMax > 0) {
    query.age = {}
    if (filters.ageMin > 0) query.age.$gte = filters.ageMin
    if (filters.ageMax > 0) query.age.$lte = filters.ageMax
  }

  let excludeIds = []
  let blockedByUserIds = []
  let excludeUserIds = []
  if (user) {
    if (myProfile && myProfile.id) excludeIds.push(myProfile.id)
    const interactions = await db.collection('interactions')
      .find({ fromUserId: user.id, action: { $in: ['skip', 'like'] } }, { projection: { toProfileId: 1, _id: 0 } })
      .toArray()
    excludeIds.push(...interactions.map(i => i.toProfileId).filter(Boolean))
    // Outgoing blocks (user blocked them) — hide
    const blocks = await db.collection('blocks')
      .find({ blockerId: user.id }, { projection: { blockedProfileId: 1, _id: 0 } })
      .toArray()
    excludeIds.push(...blocks.map(b => b.blockedProfileId).filter(Boolean))
    // Incoming blocks (they blocked user) — also hide them (two-way invisibility)
    const incoming = await db.collection('blocks')
      .find({ blockedUserId: user.id }, { projection: { blockerId: 1, _id: 0 } })
      .toArray()
    blockedByUserIds = incoming.map(b => b.blockerId).filter(Boolean)

    // Connection request exclusions: pending sent, accepted, declined-within-cooldown.
    const conn = await getConnectionExclusions(db, user.id)
    excludeUserIds = [...(conn?.sentUserIds || []), ...(conn?.declinedUserIds || [])].filter(Boolean)
  }
  
  excludeIds = [...new Set(excludeIds.filter(Boolean))]
  if (excludeIds.length > 0) query.id = { $nin: excludeIds }
  const allBlockedUserIds = [...new Set([...blockedByUserIds, ...excludeUserIds].filter(Boolean))]
  if (allBlockedUserIds.length > 0) query.userId = { $nin: allBlockedUserIds }

  // PROBLEM 3 — DEBUG LOGGING (Part 1)
  console.log('[DISCOVER] Filters applied:', JSON.stringify(filters))
  console.log('[DISCOVER] MongoDB query:', JSON.stringify(query))
  console.log('[DISCOVER] Excluded profile IDs count:', excludeIds.length)
  console.log('[DISCOVER] Excluded user IDs count:', excludeUserIds.length)

  // Fetch 1000 (at least 200) to allow proper relevance ranking, pagination done in memory
  const rawProfiles = await db.collection('profiles').find(query).limit(1000).toArray()
  let profiles = rawProfiles

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
  
  const total = profiles.length
  const hasMore = skip + 20 < total
  const nextPage = hasMore ? pageNum + 1 : null
  const pagedProfiles = profiles.slice(skip, skip + 20)

  // PROBLEM 3 — DEBUG LOGGING (Part 2)
  console.log('[DISCOVER] Profiles after query (before pagination):', total)
  console.log('[DISCOVER] Profiles returned this page:', pagedProfiles.length)
  console.log('[DISCOVER] Page:', pageNum, 'HasMore:', hasMore)

  const page = pagedProfiles.map(p => {
    // PRIVACY: strip last-active / online presence from non-connected profiles.
    // Users only learn presence info AFTER a mutual connection is established.
    const { lastActiveAt, location, ...safe } = p
    return safe
  })
  
  const payload = {
    profiles: page,
    hasMore,
    total,
    page: pageNum,
    nextPage,
  }
  
  if (debug) {
    payload.debug = {
      query,
      rawCount: rawProfiles.length,
      discoverableCount: total,
      excludedProfileIds: excludeIds.length,
      excludedUserIds: allBlockedUserIds.length,
      filters,
    }
    console.log('[discover:debug]', JSON.stringify(payload.debug))
  }
  return NextResponse.json(payload)
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
