import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { verifyFirebaseIdToken, createFirebaseCustomToken, getOrCreateFirebaseUserByPhone } from '@/lib/firebase'
import { AUTH_API, SESSION_COOKIE, SESSION_DAYS } from '../constants'
import { getUserFromRequest, isAdmin, jsonError } from '../utils'

// Agent 1 - Auth Fixed: added try/catch, logging, and descriptive error responses
export async function postAuthSession(request) {
  try {
    const db = await getDb()
    const { sessionId } = await request.json()
    console.log('[postAuthSession] Session received:', sessionId ? sessionId.substring(0, 8) + '...' : 'MISSING')
    if (!sessionId) return jsonError('Missing sessionId', 400)

    console.log('[postAuthSession] Calling AUTH_API to verify session...')
    let r
    try {
      r = await fetch(AUTH_API, { headers: { 'X-Session-ID': sessionId } })
    } catch (fetchErr) {
      console.error('[postAuthSession] AUTH_API network error:', fetchErr.message)
      return jsonError('Authentication service is unreachable. Please try again.', 502)
    }
    if (!r.ok) {
      console.error('[postAuthSession] AUTH_API returned status:', r.status)
      return jsonError('Invalid or expired session. Please log in again.', 401)
    }

    const data = await r.json()
    console.log('[postAuthSession] Auth verified for:', data.email)

    let user = await db.collection('users').findOne({ email: data.email })
    if (!user) {
      console.log('[postAuthSession] Creating new user for:', data.email)
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
    } else {
      console.log('[postAuthSession] Existing user found:', user.id)
    }

    if (user.banned) {
      console.warn('[postAuthSession] Banned user attempted login:', user.email)
      return jsonError('Account suspended. Contact hello@trainr.in', 403)
    }

    const token = data.session_token || uuidv4()
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
    await db.collection('sessions').insertOne({ token, userId: user.id, createdAt: new Date(), expiresAt })
    console.log('[postAuthSession] Session created, cookie token set')

    const profile = await db.collection('profiles').findOne({ userId: user.id })
    const res = NextResponse.json({
      user: { ...user, isAdmin: isAdmin(user) },
      profile: profile || null,
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
  } catch (err) {
    console.error('[postAuthSession] Unexpected error:', err.message, err.stack)
    return jsonError('Something went wrong during login. Please try again.', 500)
  }
}

export async function postAuthFirebase(request) {
  try {
    const db = await getDb()
    const { idToken } = await request.json()
    if (!idToken) return jsonError('Login failed. Please try again.', 400)
    const decoded = await verifyFirebaseIdToken(idToken)
    const email = decoded.email
    const phoneNumber = decoded.phone_number || null
    if (!email && !phoneNumber) return jsonError('Login failed. Please try again.', 400)
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
        name: decoded.name || email?.split('@')[0] || 'Trainr user',
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
      profile: profile || null,
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
  } catch (err) {
    console.error('[postAuthFirebase] Login failed:', err)
    return jsonError('Login failed. Please try again.', 401)
  }
}

export async function getAuthMe(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ user: null }, { status: 200 })
  if (user.banned) return NextResponse.json({ user: null, banned: true }, { status: 200 })
  const profile = await db.collection('profiles').findOne({ userId: user.id })
  if (profile) {
    db.collection('profiles').updateOne(
      { id: profile.id },
      { $set: { lastActiveAt: new Date() } },
    ).catch(err => console.error('[auth] update active failed:', err))
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

export async function postAuthSendOtp(request) {
  try {
    const { phoneNumber } = await request.json()
    if (!phoneNumber) return jsonError('Phone number is required', 400)

    const cleanPhone = phoneNumber.replace(/\+/g, '').trim()
    const authToken = (process.env.MSG91_AUTH_TOKEN || '').replace(/^"|"$/g, '').trim()
    const widgetId = (process.env.MSG91_WIDGET_ID || '').replace(/^"|"$/g, '').trim()

    if (!authToken || !widgetId) {
      console.error('[postAuthSendOtp] Missing MSG91 config in env')
      return jsonError('OTP service configuration error', 500)
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    console.log('[postAuthSendOtp] Sending OTP via MSG91 for phone:', cleanPhone, 'Client IP:', ip)
    const r = await fetch('https://api.msg91.com/api/v5/widget/sendOtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
        'X-Real-IP': ip,
      },
      body: JSON.stringify({
        widgetId,
        tokenAuth: authToken,
        identifier: cleanPhone,
      }),
    })

    if (!r.ok) {
      let errMsg = 'Failed to send verification code. Please try again.'
      try {
        const errData = await r.json()
        errMsg = `MSG91 Error: ${errData.error || errData.message || JSON.stringify(errData)}`
      } catch (e) {
        try {
          const errText = await r.text()
          errMsg = `MSG91 Error (${r.status}): ${errText}`
        } catch (e2) {}
      }
      console.error('[postAuthSendOtp] MSG91 returned status:', r.status, errMsg)
      return jsonError('Failed to send verification code. Please try again.', 500)
    }

    const data = await r.json()
    if (data.type !== 'success') {
      console.error('[postAuthSendOtp] MSG91 error response:', data)
      return jsonError(data.message || 'Verification code sending failed', 400)
    }

    const reqId = data.message
    console.log('[postAuthSendOtp] OTP sent successfully, reqId:', reqId)
    return NextResponse.json({ reqId })
  } catch (err) {
    console.error('[postAuthSendOtp] Unexpected error:', err)
    return jsonError('Something went wrong. Please try again.', 500)
  }
}

export async function postAuthVerifyOtp(request) {
  try {
    const db = await getDb()
    const { reqId, otp, phoneNumber } = await request.json()
    if (!reqId || !otp || !phoneNumber) {
      return jsonError('Missing required verification fields', 400)
    }

    const authToken = (process.env.MSG91_AUTH_TOKEN || '').replace(/^"|"$/g, '').trim()
    const widgetId = (process.env.MSG91_WIDGET_ID || '').replace(/^"|"$/g, '').trim()

    if (!authToken || !widgetId) {
      return jsonError('OTP service configuration error', 500)
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    console.log('[postAuthVerifyOtp] Verifying OTP via MSG91 for reqId:', reqId, 'Client IP:', ip)
    const r = await fetch('https://api.msg91.com/api/v5/widget/verifyOtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
        'X-Real-IP': ip,
      },
      body: JSON.stringify({
        widgetId,
        tokenAuth: authToken,
        reqId,
        otp,
      }),
    })

    if (!r.ok) {
      console.error('[postAuthVerifyOtp] MSG91 verify failed with status:', r.status)
      return jsonError('OTP verification request failed', 500)
    }

    const data = await r.json()
    if (data.type !== 'success') {
      console.error('[postAuthVerifyOtp] MSG91 verify error response:', data)
      return jsonError(data.message || 'Invalid or expired OTP', 400)
    }

    console.log('[postAuthVerifyOtp] OTP verified successfully. Preparing Firebase Custom Token...')
    const cleanPhone = '+' + phoneNumber.replace(/\+/g, '').trim()
    const firebaseUser = await getOrCreateFirebaseUserByPhone(cleanPhone)
    const customToken = await createFirebaseCustomToken(firebaseUser.uid)
    return NextResponse.json({ customToken })
  } catch (err) {
    console.error('[postAuthVerifyOtp] Unexpected error:', err)
    return jsonError('Verification failed. Please try again.', 500)
  }
}
