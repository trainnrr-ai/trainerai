import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, isAdmin, jsonError, notify } from '../utils'

export async function adminGuard(request) {
  const user = await getUserFromRequest(request)
  if (!isAdmin(user)) return { ok: false, res: jsonError('Forbidden', 403) }
  return { ok: true, user }
}

export async function getAdminStats(_request) {
  const db = await getDb()
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
  const activeNow = await db.collection('profiles').countDocuments({
    lastActiveAt: { $gte: since },
    isSeed: { $ne: true },
  })
  // Pending verifications counts
  const pendingSelfie = await db.collection('profiles').countDocuments({ 'verificationRequests.selfie': 'pending' })
  const pendingGym = await db.collection('profiles').countDocuments({ 'verificationRequests.gym': 'pending' })
  const pendingInsta = await db.collection('profiles').countDocuments({ 'verificationRequests.instagram': 'pending' })
  return NextResponse.json({
    stats: {
      users, profiles, matches, messages,
      openReports: reports, banned, verified, activeNow,
      pendingVerifications: pendingSelfie + pendingGym + pendingInsta,
      pendingSelfie, pendingGym, pendingInsta,
    },
  })
}

export async function getAdminUsers(request) {
  const db = await getDb()
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') || '').trim()
  const status = url.searchParams.get('status') || 'all' // all | banned | active
  const filter = {}
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ email: rx }, { name: rx }]
  }
  if (status === 'banned') filter.banned = true
  if (status === 'active') filter.banned = { $ne: true }
  const users = await db.collection('users').find(filter).sort({ createdAt: -1 }).limit(200).toArray()
  return NextResponse.json({ users })
}

export async function getAdminReports(request) {
  const db = await getDb()
  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'all'
  const filter = status === 'all' ? {} : { status }
  const reports = await db.collection('reports').find(filter).sort({ createdAt: -1 }).limit(200).toArray()
  // enrich with profile + reporter info
  const profileIds = [...new Set(reports.map(r => r.profileId).filter(Boolean))]
  const profiles = profileIds.length
    ? await db.collection('profiles').find({ id: { $in: profileIds } }).toArray()
    : []
  const profileById = Object.fromEntries(profiles.map(p => [p.id, { id: p.id, name: p.name, photos: p.photos?.slice(0, 1), userId: p.userId, verified: p.verified }]))
  const reporterIds = [...new Set(reports.map(r => r.reporterId).filter(Boolean))]
  const reporters = reporterIds.length
    ? await db.collection('users').find({ id: { $in: reporterIds } }, { projection: { id: 1, email: 1, name: 1 } }).toArray()
    : []
  const reporterById = Object.fromEntries(reporters.map(u => [u.id, u]))
  const enriched = reports.map(r => ({
    ...r,
    targetProfile: profileById[r.profileId] || null,
    reporter: reporterById[r.reporterId] || null,
  }))
  return NextResponse.json({ reports: enriched })
}

export async function postAdminBan(request) {
  const db = await getDb()
  const { userId, reason } = await request.json()
  await db.collection('users').updateOne(
    { id: userId },
    { $set: { banned: true, bannedAt: new Date(), banReason: reason || 'Admin action' } },
  )
  return NextResponse.json({ ok: true })
}

export async function postAdminUnban(request) {
  const db = await getDb()
  const { userId } = await request.json()
  await db.collection('users').updateOne(
    { id: userId },
    { $set: { banned: false }, $unset: { bannedAt: '', banReason: '' } },
  )
  return NextResponse.json({ ok: true })
}

export async function postAdminReportResolve(request) {
  const db = await getDb()
  const { id, action } = await request.json()
  await db.collection('reports').updateOne(
    { id },
    { $set: { status: 'resolved', action: action || null, resolvedAt: new Date() } },
  )
  return NextResponse.json({ ok: true })
}

// === VERIFICATION QUEUE ===
export async function getAdminVerifications(request) {
  const db = await getDb()
  const url = new URL(request.url)
  const type = url.searchParams.get('type') // selfie | gym | instagram | null=all
  const filter = { $or: [
    { 'verificationRequests.selfie': 'pending' },
    { 'verificationRequests.gym': 'pending' },
    { 'verificationRequests.instagram': 'pending' },
  ] }
  if (type) {
    filter.$or = [{ [`verificationRequests.${type}`]: 'pending' }]
  }
  const profiles = await db.collection('profiles').find(filter).sort({ updatedAt: -1 }).limit(100).toArray()
  return NextResponse.json({ profiles })
}

export async function postAdminVerifyApprove(request) {
  const db = await getDb()
  const { profileId, type } = await request.json()
  if (!['selfie', 'gym', 'instagram'].includes(type)) return jsonError('Invalid type', 400)
  const profile = await db.collection('profiles').findOne({ id: profileId })
  if (!profile) return jsonError('Profile not found', 404)
  const set = {}
  set[`verifications.${type}`] = true
  set[`verificationRequests.${type}`] = 'approved'
  set.verified = true
  set.updatedAt = new Date()
  await db.collection('profiles').updateOne({ id: profileId }, { $set: set })
  await notify(db, profile.userId, {
    type: 'verification_approved',
    title: `${type === 'gym' ? 'Gym membership' : type === 'instagram' ? 'Instagram' : 'Selfie'} verified ✓`,
    body: 'Your profile now shows the trusted badge.',
  })
  return NextResponse.json({ ok: true })
}

export async function postAdminVerifyReject(request) {
  const db = await getDb()
  const { profileId, type, reason } = await request.json()
  if (!['selfie', 'gym', 'instagram'].includes(type)) return jsonError('Invalid type', 400)
  const profile = await db.collection('profiles').findOne({ id: profileId })
  if (!profile) return jsonError('Profile not found', 404)
  const set = {}
  set[`verificationRequests.${type}`] = 'rejected'
  set.updatedAt = new Date()
  await db.collection('profiles').updateOne({ id: profileId }, { $set: set })
  await notify(db, profile.userId, {
    type: 'verification_rejected',
    title: `${type === 'gym' ? 'Gym' : type === 'instagram' ? 'Instagram' : 'Selfie'} verification declined`,
    body: reason || 'Please retry with clearer details.',
  })
  return NextResponse.json({ ok: true })
}

// === ANALYTICS ===
export async function getAdminAnalytics(request) {
  const db = await getDb()
  const url = new URL(request.url)
  const days = Math.min(parseInt(url.searchParams.get('days') || '14', 10), 90)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const groupByDay = (collection, field = 'createdAt', extraMatch = {}) =>
    db.collection(collection).aggregate([
      { $match: { [field]: { $gte: since }, ...extraMatch } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray()

  const [signups, profiles, matches, messages] = await Promise.all([
    groupByDay('users'),
    groupByDay('profiles', 'createdAt', { isSeed: { $ne: true } }),
    groupByDay('matches'),
    groupByDay('messages'),
  ])

  const series = (arr) => arr.map(x => ({ date: x._id, count: x.count }))

  // Top gyms
  const topGyms = await db.collection('profiles').aggregate([
    { $match: { isSeed: { $ne: true }, gymName: { $exists: true, $ne: null } } },
    { $group: { _id: '$gymName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
  ]).toArray()

  // Gender split
  const genderSplit = await db.collection('profiles').aggregate([
    { $match: { isSeed: { $ne: true } } },
    { $group: { _id: '$gender', count: { $sum: 1 } } },
  ]).toArray()

  // Goal split
  const goalSplit = await db.collection('profiles').aggregate([
    { $match: { isSeed: { $ne: true } } },
    { $group: { _id: '$goal', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray()

  return NextResponse.json({
    days,
    signups: series(signups),
    profiles: series(profiles),
    matches: series(matches),
    messages: series(messages),
    topGyms: topGyms.map(g => ({ name: g._id, count: g.count })),
    genderSplit: genderSplit.map(g => ({ name: g._id || 'Unknown', count: g.count })),
    goalSplit: goalSplit.map(g => ({ name: g._id || 'Unknown', count: g.count })),
  })
}
