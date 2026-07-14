// Push notification subscription scaffolding — stores web-push subscriptions.
// MOCKED: actual push delivery requires VAPID keys + service worker; not wired up yet.
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError } from '../utils'

export async function postPushSubscribe(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { subscription, deviceInfo } = await request.json()
  if (!subscription || !subscription.endpoint) return jsonError('Invalid subscription', 400)
  await db.collection('pushSubscriptions').updateOne(
    { userId: user.id, endpoint: subscription.endpoint },
    {
      $set: {
        userId: user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys || null,
        deviceInfo: deviceInfo || null,
        updatedAt: new Date(),
      },
      $setOnInsert: { id: uuidv4(), createdAt: new Date() },
    },
    { upsert: true },
  )
  return NextResponse.json({ ok: true, mocked: true })
}

export async function postPushUnsubscribe(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { endpoint } = await request.json().catch(() => ({}))
  if (endpoint) {
    await db.collection('pushSubscriptions').deleteOne({ userId: user.id, endpoint })
  } else {
    await db.collection('pushSubscriptions').deleteMany({ userId: user.id })
  }
  return NextResponse.json({ ok: true })
}

export async function getPushVapidKey(_request) {
  const key = process.env.VAPID_PUBLIC_KEY || null
  return NextResponse.json({ vapidPublicKey: key })
}
