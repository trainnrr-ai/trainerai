import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError, notify } from '../utils'
import { MANUAL_VERIFICATION } from '../constants'

export async function upsertProfile(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const body = await request.json()
  const photos = Array.isArray(body.photos) ? body.photos.filter(Boolean) : []
  if (photos.length < 3) return jsonError('At least 3 photos required', 400)
  if (photos.length > 5) return jsonError('Maximum 5 photos allowed', 400)
  const required = ['name', 'age', 'gender', 'city', 'gymName', 'level', 'goal', 'timing']
  for (const f of required) if (!body[f]) return jsonError(`Missing field: ${f}`, 400)

  const existing = await db.collection('profiles').findOne({ userId: user.id })
  const profileDoc = {
    id: existing?.id || uuidv4(),
    userId: user.id,
    isSeed: false,
    name: String(body.name).trim().slice(0, 60),
    age: Number(body.age) || null,
    gender: body.gender,
    city: body.city,
    gymName: String(body.gymName).trim().slice(0, 80),
    level: body.level,
    goal: body.goal,
    timing: body.timing,
    bio: String(body.bio || '').trim().slice(0, 240),
    height: Number(body.height) || null,
    weight: Number(body.weight) || null,
    instagram: body.instagram ? String(body.instagram).replace('@', '').trim().slice(0, 30) : null,
    photos,
    location: existing?.location || null,
    verified: !!body.instagram || !!existing?.verified,
    verifications: existing?.verifications || { selfie: false, instagram: !!body.instagram, gym: false },
    verificationRequests: existing?.verificationRequests || { selfie: 'none', instagram: body.instagram ? 'approved' : 'none', gym: 'none' },
    online: true,
    lastActiveAt: new Date(),
    onboardingCompleted: true,
    updatedAt: new Date(),
  }
  if (existing) {
    await db.collection('profiles').updateOne({ id: existing.id }, { $set: profileDoc })
  } else {
    profileDoc.createdAt = new Date()
    await db.collection('profiles').insertOne(profileDoc)
  }
  return NextResponse.json({ profile: profileDoc })
}

export async function getProfileCompletion(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { computeProfileCompletion } = await import('../utils')
  const profile = await db.collection('profiles').findOne({ userId: user.id })
  return NextResponse.json({ completion: computeProfileCompletion(profile) })
}

export async function getProfileMe(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const profile = await db.collection('profiles').findOne({ userId: user.id })
  return NextResponse.json({ profile: profile || null })
}

export async function postProfileLocation(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { lat, lng } = await request.json()
  if (typeof lat !== 'number' || typeof lng !== 'number') return jsonError('Invalid location', 400)
  await db.collection('profiles').updateOne(
    { userId: user.id },
    { $set: { location: { lat, lng, updatedAt: new Date() } } },
  )
  return NextResponse.json({ ok: true })
}

export async function postVerifySelfie(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { selfie } = await request.json()
  if (!selfie || typeof selfie !== 'string' || !selfie.startsWith('data:image/')) {
    return jsonError('Invalid selfie image', 400)
  }
  const existing = await db.collection('profiles').findOne({ userId: user.id })
  if (!existing) return jsonError('Create your profile first', 400)

  if (MANUAL_VERIFICATION) {
    await db.collection('profiles').updateOne(
      { userId: user.id },
      {
        $set: {
          'verificationRequests.selfie': 'pending',
          selfiePhoto: selfie,
          updatedAt: new Date(),
        },
      },
    )
    const updated = await db.collection('profiles').findOne({ userId: user.id })
    return NextResponse.json({ ok: true, pending: true, profile: updated })
  }

  // Default: auto-approve (legacy MVP behavior)
  await db.collection('profiles').updateOne(
    { userId: user.id },
    {
      $set: {
        'verifications.selfie': true,
        'verificationRequests.selfie': 'approved',
        verified: true,
        selfiePhoto: selfie,
        updatedAt: new Date(),
      },
    },
  )
  await notify(db, user.id, {
    type: 'verification_approved',
    title: 'Selfie verified ✓',
    body: 'You\u2019ve earned the trusted badge.',
  })
  const updated = await db.collection('profiles').findOne({ userId: user.id })
  return NextResponse.json({ ok: true, profile: updated })
}

export async function postVerifyRequest(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { type } = await request.json()
  if (!['gym', 'instagram'].includes(type)) return jsonError('Invalid type', 400)

  const update = {}
  update[`verificationRequests.${type}`] = 'pending'
  await db.collection('profiles').updateOne({ userId: user.id }, { $set: update })

  if (MANUAL_VERIFICATION) {
    const updated = await db.collection('profiles').findOne({ userId: user.id })
    return NextResponse.json({ ok: true, pending: true, profile: updated })
  }

  // Default: auto-approve
  const setApproved = {}
  setApproved[`verificationRequests.${type}`] = 'approved'
  setApproved[`verifications.${type}`] = true
  setApproved.verified = true
  setApproved.updatedAt = new Date()
  await db.collection('profiles').updateOne({ userId: user.id }, { $set: setApproved })
  await notify(db, user.id, {
    type: 'verification_approved',
    title: `${type === 'gym' ? 'Gym membership' : 'Instagram'} verified ✓`,
    body: 'Your profile now shows the trusted badge.',
  })
  const updated = await db.collection('profiles').findOne({ userId: user.id })
  return NextResponse.json({ ok: true, profile: updated })
}
