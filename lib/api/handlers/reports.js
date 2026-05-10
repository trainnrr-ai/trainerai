import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError } from '../utils'

const REPORT_CATEGORIES = ['fake_profile', 'spam', 'harassment', 'inappropriate_photos', 'underage', 'other']

export async function postReport(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const body = await request.json()
  const { profileId, reason, category, details } = body
  if (!profileId) return jsonError('profileId required', 400)
  const safeCategory = REPORT_CATEGORIES.includes(category) ? category : 'other'
  await db.collection('reports').insertOne({
    id: uuidv4(),
    reporterId: user.id,
    profileId,
    category: safeCategory,
    details: details ? String(details).slice(0, 500) : '',
    // legacy: combined reason text for backwards-compat with admin UI
    reason: details ? `[${safeCategory}] ${String(details).slice(0, 500)}` : `[${safeCategory}]${reason ? ' ' + String(reason).slice(0, 500) : ''}`,
    status: 'open',
    createdAt: new Date(),
  })
  return NextResponse.json({ ok: true })
}

export async function postBlock(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { profileId } = await request.json()
  if (!profileId) return jsonError('profileId required', 400)

  // Resolve blocked user's userId from the profile
  const blockedProfile = await db.collection('profiles').findOne({ id: profileId })
  const blockedUserId = blockedProfile?.userId || null

  // Persist the block (idempotent on (blockerId, blockedProfileId))
  await db.collection('blocks').updateOne(
    { blockerId: user.id, blockedProfileId: profileId },
    {
      $set: {
        blockerId: user.id,
        blockedProfileId: profileId,
        blockedUserId,
        updatedAt: new Date(),
      },
      $setOnInsert: { id: uuidv4(), createdAt: new Date() },
    },
    { upsert: true },
  )

  // Two-way removal: delete any matches + messages between the two users
  if (blockedUserId) {
    const matches = await db.collection('matches').find({
      $or: [
        { userA: user.id, userB: blockedUserId },
        { userA: blockedUserId, userB: user.id },
      ],
    }).toArray()
    const matchIds = matches.map(m => m.id)
    if (matchIds.length) {
      await db.collection('messages').deleteMany({ matchId: { $in: matchIds } })
      await db.collection('matches').deleteMany({ id: { $in: matchIds } })
      await db.collection('typing').deleteMany({ matchId: { $in: matchIds } })
    }
    // Also remove pending interactions (likes) so future discovery isn't influenced
    await db.collection('interactions').deleteMany({
      $or: [
        { fromUserId: user.id, toUserId: blockedUserId },
        { fromUserId: blockedUserId, toUserId: user.id },
      ],
    })
  }

  return NextResponse.json({ ok: true })
}

export async function postUnblock(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { profileId } = await request.json()
  await db.collection('blocks').deleteOne({ blockerId: user.id, blockedProfileId: profileId })
  return NextResponse.json({ ok: true })
}

export async function getBlocks(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const blocks = await db.collection('blocks').find({ blockerId: user.id }).toArray()
  return NextResponse.json({ blocks })
}
