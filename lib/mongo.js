import { MongoClient } from 'mongodb'
import { getFirebaseDb } from './firebase'

const uri = process.env.MONGO_URL
const dbName = process.env.DB_NAME || 'spottr'

let cached = global._mongo
if (!cached) cached = global._mongo = { client: null, db: null, promise: null }

export async function getDb() {
  if ((process.env.DATABASE_DRIVER || '').toLowerCase() === 'firebase') {
    return getFirebaseDb()
  }
  if (cached.db) return cached.db
  if (!cached.promise) {
    cached.promise = MongoClient.connect(uri, { serverSelectionTimeoutMS: 3000 }).then((client) => {
      cached.client = client
      const db = client.db(dbName)
      cached.db = db

      // Auto-purge messages older than 24 hours (Snapchat-style delete to save storage)
      db.collection('messages').createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 86400 }
      ).catch(err => console.error('Failed to create TTL index for messages:', err))

      return db
    })
  }
  return cached.promise
}
