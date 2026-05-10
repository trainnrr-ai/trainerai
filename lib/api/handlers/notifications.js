import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError } from '../utils'

export async function getNotifications(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const list = await db.collection('notifications')
    .find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .toArray()
  const unread = await db.collection('notifications').countDocuments({ userId: user.id, read: false })
  return NextResponse.json({ notifications: list, unread })
}

export async function postNotificationsRead(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const body = await request.json().catch(() => ({}))
  const filter = { userId: user.id }
  if (body.id) filter.id = body.id
  await db.collection('notifications').updateMany(filter, { $set: { read: true } })
  return NextResponse.json({ ok: true })
}
