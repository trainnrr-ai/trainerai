const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')

const serviceAccount = require('./serviceAccount.json')

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function migrateCollection(filename, collectionName) {
  const filepath = path.join(__dirname, '..', 'backup', filename)
  if (!fs.existsSync(filepath)) {
    console.log('⚠️  Skipping ' + collectionName + ' — file not found')
    return
  }
  const raw = fs.readFileSync(filepath, 'utf8')
  const lines = raw.trim().split('\n').filter(Boolean)
  const docs = lines.map(line => JSON.parse(line))
  console.log('📦 Migrating ' + docs.length + ' docs → ' + collectionName)
  let batch = db.batch()
  let count = 0
  let batchCount = 0
  for (const doc of docs) {
    const { _id, ...cleanDoc } = doc
    for (const key of Object.keys(cleanDoc)) {
      if (cleanDoc[key] && cleanDoc[key].$date) {
        cleanDoc[key] = new Date(cleanDoc[key].$date)
      }
    }
    const docId = String(cleanDoc.id || cleanDoc.token || ((_id && _id.$oid) ? _id.$oid : null) || Math.random().toString(36).slice(2))
    const ref = db.collection(collectionName).doc(docId)
    batch.set(ref, cleanDoc)
    count++
    batchCount++
    if (batchCount === 499) {
      await batch.commit()
      console.log('  ✅ ' + count + ' migrated...')
      batch = db.batch()
      batchCount = 0
    }
  }
  if (batchCount > 0) await batch.commit()
  console.log('✅ ' + collectionName + ' done — ' + count + ' records')
}

async function runMigration() {
  console.log('🚀 Starting migration...')
  await migrateCollection('users.json', 'users')
  await migrateCollection('profiles.json', 'profiles')
  await migrateCollection('matches.json', 'matches')
  await migrateCollection('messages.json', 'messages')
  await migrateCollection('interactions.json', 'interactions')
  await migrateCollection('blocks.json', 'blocks')
  await migrateCollection('notifications.json', 'notifications')
  await migrateCollection('sessions.json', 'sessions')
  console.log('🎉 Migration complete! All data is now in Firebase Firestore.')
}

runMigration().catch(console.error)
