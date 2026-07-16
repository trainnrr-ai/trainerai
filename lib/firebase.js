import admin from 'firebase-admin'

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  }
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '')
        .replace(/\\n/g, '\n')
        .replace(/^"|"$/g, '')
        .trim(),
    }
  }
  return null
}

function initAdmin() {
  if (admin.apps.length) return admin.app()
  const serviceAccount = getServiceAccount()
  if (!serviceAccount) {
    throw new Error('Firebase is enabled but FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY is missing')
  }
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  })
}

function valueAt(doc, path) {
  return String(path).split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), doc)
}

function setAt(doc, path, value) {
  const parts = String(path).split('.')
  let cur = doc
  for (let i = 0; i < parts.length - 1; i += 1) {
    cur[parts[i]] = cur[parts[i]] && typeof cur[parts[i]] === 'object' ? cur[parts[i]] : {}
    cur = cur[parts[i]]
  }
  cur[parts[parts.length - 1]] = value
}

function unsetAt(doc, path) {
  const parts = String(path).split('.')
  let cur = doc
  for (let i = 0; i < parts.length - 1; i += 1) {
    cur = cur?.[parts[i]]
    if (!cur) return
  }
  delete cur[parts[parts.length - 1]]
}

function normalize(value) {
  if (value?.toDate) return value.toDate()
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof RegExp)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)]))
  }
  return value
}

function compare(a, b) {
  const av = a instanceof Date ? a.getTime() : a
  const bv = b instanceof Date ? b.getTime() : b
  if (av === bv) return 0
  if (av == null) return -1
  if (bv == null) return 1
  return av > bv ? 1 : -1
}

function matchesField(actual, expected) {
  if (expected instanceof RegExp) return expected.test(String(actual || ''))
  if (!expected || typeof expected !== 'object' || expected instanceof Date || Array.isArray(expected)) {
    if (Array.isArray(actual)) return actual.includes(expected)
    return actual === expected
  }
  return Object.entries(expected).every(([op, value]) => {
    if (op === '$in') return Array.isArray(actual) ? actual.some(x => value.includes(x)) : value.includes(actual)
    if (op === '$nin') return Array.isArray(actual) ? actual.every(x => !value.includes(x)) : !value.includes(actual)
    if (op === '$ne') return actual !== value
    if (op === '$gte') return compare(actual, value) >= 0
    if (op === '$lte') return compare(actual, value) <= 0
    if (op === '$gt') return compare(actual, value) > 0
    if (op === '$lt') return compare(actual, value) < 0
    if (op === '$exists') return value ? actual !== undefined : actual === undefined
    if (op === '$regex') {
      const re = value instanceof RegExp ? value : new RegExp(value, expected.$options || '')
      return re.test(String(actual || ''))
    }
    return false
  })
}

function matchesQuery(doc, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    if (key === '$or') return expected.some(q => matchesQuery(doc, q))
    if (key === '$and') return expected.every(q => matchesQuery(doc, q))
    return matchesField(valueAt(doc, key), expected)
  })
}

function addFirestoreFilters(ref, query = {}) {
  let q = ref
  let pushed = false
  
  const equalities = []
  const inequalities = []
  
  for (const [field, expected] of Object.entries(query)) {
    if (field.startsWith('$')) continue
    
    if (!expected || typeof expected !== 'object' || expected instanceof Date || Array.isArray(expected)) {
      equalities.push({ field, op: '==', val: expected })
      continue
    }
    
    if (Array.isArray(expected.$in) && expected.$in.length > 0 && expected.$in.length <= 10) {
      equalities.push({ field, op: 'in', val: expected.$in })
      continue
    }
    
    if (expected.$ne !== undefined) {
      inequalities.push({ field, op: '!=', val: expected.$ne })
    }
    if (Array.isArray(expected.$nin) && expected.$nin.length > 0 && expected.$nin.length <= 10) {
      inequalities.push({ field, op: 'not-in', val: expected.$nin })
    }
    if (expected.$gte != null) {
      inequalities.push({ field, op: '>=', val: expected.$gte })
    }
    if (expected.$lte != null) {
      inequalities.push({ field, op: '<=', val: expected.$lte })
    }
    if (expected.$gt != null) {
      inequalities.push({ field, op: '>', val: expected.$gt })
    }
    if (expected.$lt != null) {
      inequalities.push({ field, op: '<', val: expected.$lt })
    }
  }
  
  if (equalities.length > 0) {
    for (const eq of equalities) {
      q = q.where(eq.field, eq.op, eq.val)
      pushed = true
    }
  } else if (inequalities.length > 0) {
    const firstIneq = inequalities[0]
    q = q.where(firstIneq.field, firstIneq.op, firstIneq.val)
    pushed = true
  }
  
  return { ref: q, pushed }
}

function projectDoc(doc, projection) {
  if (!projection) return doc
  const entries = Object.entries(projection)
  const include = entries.filter(([, v]) => !!v).map(([k]) => k).filter(k => k !== '_id')
  if (include.length) {
    const out = {}
    include.forEach(k => {
      const value = valueAt(doc, k)
      if (value !== undefined) setAt(out, k, value)
    })
    return out
  }
  const out = { ...doc }
  entries.filter(([, v]) => !v).forEach(([k]) => unsetAt(out, k))
  return out
}

function applyUpdate(doc, update) {
  const next = { ...doc }
  if (update.$set) Object.entries(update.$set).forEach(([k, v]) => setAt(next, k, v))
  if (update.$unset) Object.keys(update.$unset).forEach(k => unsetAt(next, k))
  if (update.$addToSet) {
    Object.entries(update.$addToSet).forEach(([k, v]) => {
      const arr = Array.isArray(valueAt(next, k)) ? valueAt(next, k) : []
      if (!arr.includes(v)) setAt(next, k, [...arr, v])
    })
  }
  if (!Object.keys(update).some(k => k.startsWith('$'))) Object.assign(next, update)
  return next
}

function docId(doc) {
  return String(doc.id || doc.token || doc.endpoint || crypto.randomUUID())
}

class FirebaseCursor {
  constructor(items) {
    this.items = items
  }
  sort(sortSpec = {}) {
    const entries = Object.entries(sortSpec)
    this.items.sort((a, b) => {
      for (const [field, dir] of entries) {
        const cmp = compare(valueAt(a, field), valueAt(b, field))
        if (cmp !== 0) return dir < 0 ? -cmp : cmp
      }
      return 0
    })
    return this
  }
  limit(n) {
    this.items = this.items.slice(0, n)
    return this
  }
  async toArray() {
    return this.items
  }
}

class FirebaseCollection {
  constructor(firestore, name) {
    this.ref = firestore.collection(name)
  }
  async all() {
    const snap = await this.ref.get()
    return snap.docs.map(d => normalize(d.data()))
  }
  async filtered(query = {}, options = {}) {
    const { ref, pushed } = addFirestoreFilters(this.ref, query)
    const snap = pushed ? await ref.get() : await this.ref.get()
    return snap.docs
      .map(d => normalize(d.data()))
      .filter(d => matchesQuery(d, query))
      .map(d => projectDoc(d, options.projection))
  }
  async findOne(query = {}, options = {}) {
    const docs = await this.filtered(query, options)
    return docs[0] || null
  }
  find(query = {}, options = {}) {
    const promise = this.filtered(query, options)
    return {
      sort: (spec) => new FirebaseCursorPromise(promise).sort(spec),
      limit: (n) => new FirebaseCursorPromise(promise).limit(n),
      toArray: async () => promise,
    }
  }
  async insertOne(doc) {
    const id = docId(doc)
    await this.ref.doc(id).set(doc)
    return { insertedId: id }
  }
  async updateOne(filter, update, options = {}) {
    const docs = await this.filtered(filter)
    const found = docs[0]
    if (!found && !options.upsert) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
    const base = found || filter
    const next = applyUpdate(base, update)
    const id = docId(next)
    await this.ref.doc(id).set(next, { merge: true })
    return { matchedCount: found ? 1 : 0, modifiedCount: 1, upsertedCount: found ? 0 : 1 }
  }
  async updateMany(filter, update) {
    const docs = await this.filtered(filter)
    await Promise.all(docs.map(d => this.ref.doc(docId(d)).set(applyUpdate(d, update), { merge: true })))
    return { matchedCount: docs.length, modifiedCount: docs.length }
  }
  async deleteOne(filter) {
    const docs = await this.filtered(filter)
    const found = docs[0]
    if (found) await this.ref.doc(docId(found)).delete()
    return { deletedCount: found ? 1 : 0 }
  }
  async deleteMany(filter = {}) {
    const docs = await this.filtered(filter)
    await Promise.all(docs.map(d => this.ref.doc(docId(d)).delete()))
    return { deletedCount: docs.length }
  }
  async countDocuments(filter = {}) {
    return (await this.filtered(filter)).length
  }
  aggregate(pipeline = []) {
    const promise = this.all().then(items => runPipeline(items, pipeline))
    return { toArray: async () => promise }
  }
}

class FirebaseCursorPromise {
  constructor(promise) {
    this.promise = promise
    this.sortSpec = null
    this.limitN = null
  }
  sort(spec) {
    this.sortSpec = spec
    return this
  }
  limit(n) {
    this.limitN = n
    return this
  }
  async toArray() {
    const cursor = new FirebaseCursor(await this.promise)
    if (this.sortSpec) cursor.sort(this.sortSpec)
    if (this.limitN != null) cursor.limit(this.limitN)
    return cursor.toArray()
  }
}

function groupKey(doc, expr) {
  if (typeof expr === 'string' && expr.startsWith('$')) return valueAt(doc, expr.slice(1))
  if (expr?.$dateToString) {
    const d = valueAt(doc, String(expr.$dateToString.date).slice(1))
    const date = d instanceof Date ? d : new Date(d)
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
  }
  return expr
}

function runPipeline(input, pipeline) {
  let items = [...input]
  for (const stage of pipeline) {
    if (stage.$match) items = items.filter(d => matchesQuery(d, stage.$match))
    else if (stage.$sort) items = new FirebaseCursor(items).sort(stage.$sort).items
    else if (stage.$limit) items = items.slice(0, stage.$limit)
    else if (stage.$group) {
      const groups = new Map()
      for (const item of items) {
        const key = groupKey(item, stage.$group._id)
        const cur = groups.get(key) || { _id: key }
        for (const [field, expr] of Object.entries(stage.$group)) {
          if (field === '_id') continue
          if (expr.$sum != null) cur[field] = (cur[field] || 0) + (typeof expr.$sum === 'number' ? expr.$sum : Number(valueAt(item, String(expr.$sum).slice(1)) || 0))
          if (expr.$first === '$$ROOT' && cur[field] == null) cur[field] = item
        }
        groups.set(key, cur)
      }
      items = [...groups.values()]
    }
  }
  return items
}

let cachedFirebase = global._firebaseDb
if (!cachedFirebase) cachedFirebase = global._firebaseDb = null

export async function getFirebaseDb() {
  if (cachedFirebase) return cachedFirebase
  initAdmin()
  const firestore = admin.firestore()
  cachedFirebase = { collection: (name) => new FirebaseCollection(firestore, name) }
  return cachedFirebase
}

export async function verifyFirebaseIdToken(idToken) {
  initAdmin()
  return admin.auth().verifyIdToken(idToken)
}
