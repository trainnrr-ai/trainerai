import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { BANNED_WORDS } from '../constants'
import { getUserFromRequest, jsonError, notify } from '../utils'

export async function getMessages(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const url = new URL(request.url)
  const matchId = url.searchParams.get('matchId')
  if (!matchId) return jsonError('matchId required', 400)
  const match = await db.collection('matches').findOne({ id: matchId })
  if (!match || (match.userA !== user.id && match.userB !== user.id)) {
    return jsonError('Forbidden', 403)
  }
  const msgs = await db.collection('messages')
    .find({ matchId })
    .sort({ createdAt: 1 })
    .limit(200)
    .toArray()
  await db.collection('messages').updateMany(
    { matchId, fromUserId: { $ne: user.id }, readBy: { $ne: user.id } },
    { $addToSet: { readBy: user.id }, $set: { readAt: new Date() } },
  )
  const otherUserId = match.userA === user.id ? match.userB : match.userA
  const typing = await db.collection('typing').findOne({ matchId, userId: otherUserId })
  const isTyping = typing && new Date(typing.until) > new Date()
  return NextResponse.json({ messages: msgs, otherTyping: !!isTyping })
}

export async function postMessage(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { matchId, text, image } = await request.json()
  if (!matchId) return jsonError('matchId required', 400)
  const hasText = typeof text === 'string' && text.trim().length > 0
  const hasImage = typeof image === 'string' && image.trim().length > 0
  if (!hasText && !hasImage) return jsonError('Message must include text or an image', 400)
  if (hasText && text.length > 1000) return jsonError('Message too long', 400)

  // Image validation: must be a small base64 data URI of an allowed image type.
  let safeImage = null
  if (hasImage) {
    const m = image.match(/^data:image\/(webp|jpeg|jpg|png);base64,/i)
    if (!m) return jsonError('Invalid image format', 400)
    const base64Body = image.split(',')[1] || ''
    const approxBytes = Math.floor(base64Body.length * 0.75)
    if (approxBytes < 1024) return jsonError('Image too small', 400)
    if (approxBytes > 600 * 1024) return jsonError('Image too large. Please pick a smaller photo.', 413)
    safeImage = image
  }

  const match = await db.collection('matches').findOne({ id: matchId })
  if (!match || (match.userA !== user.id && match.userB !== user.id)) {
    return jsonError('Forbidden', 403)
  }
  const since = new Date(Date.now() - 10 * 60 * 1000)
  const recent = await db.collection('messages').countDocuments({ fromUserId: user.id, createdAt: { $gte: since } })
  if (recent >= 30) return jsonError('Slow down — too many messages', 429)

  const cleanText = hasText ? text.trim() : ''
  const flagged = hasText && BANNED_WORDS.some(w => cleanText.toLowerCase().includes(w))
  const msg = {
    id: uuidv4(),
    matchId,
    fromUserId: user.id,
    text: cleanText,
    image: safeImage,
    kind: safeImage ? (cleanText ? 'mixed' : 'image') : 'text',
    flagged,
    readBy: [user.id],
    createdAt: new Date(),
  }
  await db.collection('messages').insertOne(msg)
  const otherUserId = match.userA === user.id ? match.userB : match.userA
  const myProfile = await db.collection('profiles').findOne({ userId: user.id }, { projection: { name: 1 } })
  const previewBody = cleanText
    ? `${myProfile?.name || 'Someone'}: ${cleanText.slice(0, 60)}`
    : `${myProfile?.name || 'Someone'} sent a photo`
  await notify(db, otherUserId, {
    type: 'new_message',
    title: previewBody,
    body: '',
    data: { matchId },
  })
  if (flagged) {
    await db.collection('moderation_actions').insertOne({
      id: uuidv4(), userId: user.id, type: 'inappropriate_message', messageId: msg.id, severity: 'warn', createdAt: new Date(),
    })
    const strikes = await db.collection('moderation_actions').countDocuments({ userId: user.id, type: 'inappropriate_message' })
    if (strikes >= 3) {
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: { banned: true, bannedAt: new Date(), banReason: 'Repeated inappropriate messages' } },
      )
    }
  }
  return NextResponse.json({ message: msg })
}

export async function postTyping(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { matchId } = await request.json()
  if (!matchId) return jsonError('matchId required', 400)
  const until = new Date(Date.now() + 4000)
  await db.collection('typing').updateOne(
    { matchId, userId: user.id },
    { $set: { matchId, userId: user.id, until } },
    { upsert: true },
  )
  return NextResponse.json({ ok: true })
}
