import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { verifyFirebaseIdToken } from '@/lib/firebase'
import { AUTH_API, SESSION_COOKIE, SESSION_DAYS } from '../constants'
import { getUserFromRequest, isAdmin, jsonError } from '../utils'

export async function postAuthSession(request) {
  const db = await getDb()
  const { sessionId } = await request.json()
  if (!sessionId) return jsonError('Missing sessionId', 400)
  const r = await fetch(AUTH_API, { headers: { 'X-Session-ID': sessionId } })
  if (!r.ok) return jsonError('Invalid session', 401)
  const data = await r.json()
  let user = await db.collection('users').findOne({ email: data.email })
  if (!user) {
    user = {
      id: uuidv4(),
      email: data.email,
      name: data.name,
      picture: data.picture,
      provider: 'emergent',
      tier: 'free',
      createdAt: new Date(),
    }
    await db.collection('users').insertOne(user)
  }
  if (user.banned) {
    return jsonError('Account suspended. Contact hello@trainr.in', 403)
  }
  const token = data.session_token || uuidv4()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.collection('sessions').insertOne({ token, userId: user.id, createdAt: new Date(), expiresAt })
  const profile = await db.collection('profiles').findOne({ userId: user.id })
  const res = NextResponse.json({
    user: { ...user, isAdmin: isAdmin(user) },
    hasProfile: !!profile,
    onboardingCompleted: !!profile?.onboardingCompleted,
  })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
  return res
}

export async function postAuthFirebase(request) {
  const db = await getDb()
  const { idToken } = await request.json()
  if (!idToken) return jsonError('Missing Firebase ID token', 400)
  const decoded = await verifyFirebaseIdToken(idToken)
  const email = decoded.email
  const phoneNumber = decoded.phone_number || null
  if (!email && !phoneNumber) return jsonError('Firebase account is missing an email or phone number', 400)
  let user = email
    ? await db.collection('users').findOne({ email })
    : await db.collection('users').findOne({ firebaseUid: decoded.uid })
  if (!user && phoneNumber) user = await db.collection('users').findOne({ phoneNumber })
  if (!user) {
    user = {
      id: decoded.uid,
      firebaseUid: decoded.uid,
      email: email || null,
      phoneNumber,
      phoneVerified: !!phoneNumber,
      phoneVerifiedAt: phoneNumber ? new Date() : null,
      name: decoded.name || phoneNumber || email?.split('@')[0] || 'Trainr user',
      picture: decoded.picture || null,
      provider: 'firebase',
      tier: 'free',
      createdAt: new Date(),
    }
    await db.collection('users').insertOne(user)
  } else if (!user.firebaseUid) {
    user = { ...user, firebaseUid: decoded.uid, provider: user.provider || 'firebase' }
    await db.collection('users').updateOne(
      { id: user.id },
      { $set: { firebaseUid: decoded.uid, provider: user.provider } },
    )
  } else {
    const set = {
      provider: user.provider || 'firebase',
      firebaseUid: decoded.uid,
      lastLoginAt: new Date(),
    }
    if (email && !user.email) set.email = email
    if (phoneNumber) {
      set.phoneNumber = phoneNumber
      set.phoneVerified = true
      set.phoneVerifiedAt = user.phoneVerifiedAt || new Date()
    }
    if (decoded.picture && !user.picture) set.picture = decoded.picture
    await db.collection('users').updateOne({ id: user.id }, { $set: set })
    user = { ...user, ...set }
  }
  if (user.banned) {
    return jsonError('Account suspended. Contact hello@trainr.in', 403)
  }
  const token = decoded.uid + '.' + uuidv4()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.collection('sessions').insertOne({ token, userId: user.id, firebaseUid: decoded.uid, createdAt: new Date(), expiresAt })
  const profile = await db.collection('profiles').findOne({ userId: user.id })
  const res = NextResponse.json({
    user: { ...user, isAdmin: isAdmin(user) },
    hasProfile: !!profile,
    onboardingCompleted: !!profile?.onboardingCompleted,
  })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
  return res
}

export async function getAuthMe(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ user: null }, { status: 200 })
  if (user.banned) return NextResponse.json({ user: null, banned: true }, { status: 200 })
  const profile = await db.collection('profiles').findOne({ userId: user.id })
  if (profile) {
    await db.collection('profiles').updateOne(
      { id: profile.id },
      { $set: { lastActiveAt: new Date() } },
    )
  }
  return NextResponse.json({
    user: { ...user, isAdmin: isAdmin(user) },
    profile: profile || null,
    onboardingCompleted: !!profile?.onboardingCompleted,
  })
}

export async function postAuthLogout(request) {
  const db = await getDb()
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  if (cookie) await db.collection('sessions').deleteOne({ token: cookie })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
