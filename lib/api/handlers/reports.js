import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError } from '../utils'

export async function postReport(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { profileId, reason } = await request.json()
  await db.collection('reports').insertOne({
    id: uuidv4(),
    reporterId: user.id,
    profileId,
    reason,
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
  await db.collection('blocks').insertOne({
    id: uuidv4(),
    blockerId: user.id,
    blockedProfileId: profileId,
    createdAt: new Date(),
  })
  return NextResponse.json({ ok: true })
}
