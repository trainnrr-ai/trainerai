// MOCKED billing/premium scaffolding — no real payment provider integrated yet
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import { getUserFromRequest, jsonError } from '../utils'
import { PREMIUM_FEATURES, PREMIUM_TIERS } from '../constants'

export async function getBillingMe(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const tier = user.tier || PREMIUM_TIERS.FREE
  const tierExpiresAt = user.tierExpiresAt || null
  const isActive = tier === PREMIUM_TIERS.PRO && (!tierExpiresAt || new Date(tierExpiresAt) > new Date())
  return NextResponse.json({
    tier,
    isPro: !!isActive,
    tierExpiresAt,
    features: isActive ? PREMIUM_FEATURES : {},
    catalog: PREMIUM_FEATURES,
    plans: [
      { id: 'pro_monthly', name: 'Trainr Pro Monthly', priceInr: 299, durationDays: 30 },
      { id: 'pro_yearly', name: 'Trainr Pro Annual', priceInr: 1999, durationDays: 365 },
    ],
  })
}

// MOCKED upgrade — to be replaced with real payment provider (Stripe/Razorpay)
export async function postBillingUpgrade(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  const { planId } = await request.json()
  const plans = {
    pro_monthly: { durationDays: 30 },
    pro_yearly: { durationDays: 365 },
  }
  const plan = plans[planId]
  if (!plan) return jsonError('Invalid plan', 400)
  // MOCKED: in production this would verify payment via webhook
  const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: { tier: PREMIUM_TIERS.PRO, tierExpiresAt: expiresAt, tierUpgradedAt: new Date() } },
  )
  return NextResponse.json({ ok: true, mocked: true, tier: PREMIUM_TIERS.PRO, tierExpiresAt: expiresAt })
}

export async function postBillingDowngrade(request) {
  const db = await getDb()
  const user = await getUserFromRequest(request)
  if (!user) return jsonError('Unauthorized', 401)
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: { tier: PREMIUM_TIERS.FREE }, $unset: { tierExpiresAt: '' } },
  )
  return NextResponse.json({ ok: true })
}
