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
  // Goals: accept either { goals: ['Fat Loss', 'Muscle Gain'] } or legacy { goal: 'Fat Loss' }.
  let goals = []
  if (Array.isArray(body.goals)) {
    goals = body.goals.filter(g => typeof g === 'string' && g.trim()).map(g => g.trim())
  } else if (typeof body.goal === 'string' && body.goal.trim()) {
    goals = [body.goal.trim()]
  }
  // De-dupe (preserve order) + cap to 3
  const seen = new Set()
  goals = goals.filter(g => (seen.has(g) ? false : (seen.add(g), true))).slice(0, 3)
  if (goals.length < 1) return jsonError('Pick at least 1 workout goal', 400)
  if (goals.length > 3) return jsonError('Maximum 3 goals allowed', 400)

  const required = ['name', 'age', 'gender', 'city', 'gymName', 'level', 'timing']
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
    goal: goals[0], // back-compat: primary goal
    goals,
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

  // Server-side lightweight heuristics (rejects obvious non-selfies / oversized payloads)
  const base64Body = selfie.split(',')[1] || ''
  const approxBytes = Math.floor(base64Body.length * 0.75)
  if (approxBytes < 8 * 1024) {
    return jsonError('Selfie too small or low quality. Please retake.', 400)
  }
  if (approxBytes > 4 * 1024 * 1024) {
    return jsonError('Selfie too large. Please retake.', 400)
  }
  const profilePhotos = Array.isArray(existing.photos) ? existing.photos.length : 0
  if (profilePhotos < 2) {
    return jsonError('Add at least 2 profile photos before requesting selfie verification.', 400)
  }

  // Selfies ALWAYS go through admin review (security-sensitive).
  // The MANUAL_VERIFICATION env flag only controls the lighter gym/instagram flows.
  await db.collection('profiles').updateOne(
    { userId: user.id },
    {
      $set: {
        'verificationRequests.selfie': 'pending',
        selfiePhoto: selfie,
        selfieSubmittedAt: new Date(),
        updatedAt: new Date(),
      },
    },
  )
  await notify(db, user.id, {
    type: 'verification_pending',
    title: 'Selfie submitted for review',
    body: 'We\u2019ll notify you within 24 hours once an admin verifies it.',
  })
  const updated = await db.collection('profiles').findOne({ userId: user.id })
  return NextResponse.json({ ok: true, pending: true, profile: updated })
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
