import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'

export async function GET(request) {
  try {
    const db = await getDb()
    const profiles = await db.collection('profiles').find({}).toArray()
    let count = 0
    for (const p of profiles) {
      const isPhone = p.name?.startsWith('+') || /^\d+$/.test(p.name?.replace(/[\s\-\+]/g, ''))
      if (isPhone) {
        console.log('[MIGRATION] Fixing profile with phone name:', p.id, p.name)
        await db.collection('profiles').updateOne({ id: p.id }, { $set: { name: 'Trainr User' } })
        count++
      }
    }
    return NextResponse.json({ success: true, fixedCount: count })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
