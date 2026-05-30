import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError } from '../utils'

export async function getMatches(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
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
      lastMessage: lm ? { text: lm.text, kind: lm.kind || 'text', createdAt: lm.createdAt, fromMe: lm.fromUserId === user.id } : null,
      unreadCount: unreadByMatch[m.id] || 0,
    }
  })
  // Pending incoming connection requests count (used for the Requests-tab badge).
  const pendingIncomingCount = await db.collection('connection_requests').countDocuments({
    toUserId: user.id, status: 'pending',
  })
  return NextResponse.json({ matches: enriched, pendingIncomingCount })
}

// Agent 2 - Remove Connection Fixed: delete match + messages + typing
export async function deleteMatch(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { matchId } = await request.json()
  if (!matchId) return jsonError('matchId required', 400)

  const match = await db.collection('matches').findOne({ id: matchId })
  if (!match) return jsonError('Connection not found', 404)
  if (match.userA !== user.id && match.userB !== user.id) {
    return jsonError('Forbidden', 403)
  }

  // Delete messages, typing indicators, and the match itself
  await db.collection('messages').deleteMany({ matchId })
  await db.collection('typing').deleteMany({ matchId })
  await db.collection('matches').deleteOne({ id: matchId })

  console.log(`[Matches] Connection ${matchId} removed by user ${user.id}`)
  return NextResponse.json({ ok: true })
}
