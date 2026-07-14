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
      cached.db = client.db(dbName)
      return cached.db
    })
  }
  return cached.promise
}
