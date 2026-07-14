import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError } from '../utils'
import { SESSION_COOKIE } from '../constants'

// DELETE /api/account — fully erase the user's data and end their session.
export async function deleteAccount(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)

  const userId = user.id
  const profile = await db.collection('profiles').findOne({ userId })
  const profileId = profile?.id || null

  // 1) Find all matches involving this user, then purge their messages + typing
  const matches = await db.collection('matches').find({
    $or: [{ userA: userId }, { userB: userId }],
  }).toArray()
  const matchIds = matches.map(m => m.id)
  if (matchIds.length) {
    await db.collection('messages').deleteMany({ matchId: { $in: matchIds } })
    await db.collection('typing').deleteMany({ matchId: { $in: matchIds } })
    await db.collection('matches').deleteMany({ id: { $in: matchIds } })
  }

  // 2) Delete interactions both ways
  await db.collection('interactions').deleteMany({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  })
  if (profileId) {
    await db.collection('interactions').deleteMany({
      $or: [{ fromProfileId: profileId }, { toProfileId: profileId }],
    })
  }

  // 3) Notifications
  await db.collection('notifications').deleteMany({ userId })

  // 4) Reports created by this user OR against this user's profile
  await db.collection('reports').deleteMany({ reporterId: userId })
  if (profileId) await db.collection('reports').deleteMany({ profileId })

  // 5) Blocks (both directions)
  await db.collection('blocks').deleteMany({
    $or: [{ blockerId: userId }, { blockedUserId: userId }],
  })
  if (profileId) {
    await db.collection('blocks').deleteMany({ blockedProfileId: profileId })
  }

  // 6) Push subscriptions
  await db.collection('pushSubscriptions').deleteMany({ userId })

  // 7) Moderation history
  await db.collection('moderation_actions').deleteMany({ userId })

  // 8) Profile + sessions + user record
  await db.collection('profiles').deleteMany({ userId })
  await db.collection('sessions').deleteMany({ userId })
  await db.collection('users').deleteOne({ id: userId })

  const res = NextResponse.json({ ok: true, deleted: true })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
