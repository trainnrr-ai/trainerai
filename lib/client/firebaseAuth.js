import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from 'firebase/auth'

function getFirebaseConfig() {
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const defaultAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'trainerai-prod-d55a8.firebaseapp.com'
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: isDev ? defaultAuthDomain : 'trainr.in',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId) {
    throw new Error('Firebase Auth is enabled but public Firebase config is missing')
  }
  return cfg
}

export function getFirebaseAuth() {
  const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
  return getAuth(app)
}

async function createServerSession(user) {
  const idToken = await user.getIdToken()
  const res = await fetch('/api/auth/firebase', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Firebase sign-in failed')
  return data
}

export async function loginWithFirebaseGoogle() {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth, provider)
  return createServerSession(result.user)
}

export async function sendFirebasePhoneOtp(phoneNumber, containerId = 'firebase-recaptcha') {
  const auth = getFirebaseAuth()
  if (typeof window === 'undefined') throw new Error('Phone sign-in must run in the browser')
  if (!window.trainrRecaptchaVerifier) {
    window.trainrRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    })
  }
  return signInWithPhoneNumber(auth, phoneNumber, window.trainrRecaptchaVerifier)
}

export async function confirmFirebasePhoneOtp(confirmationResult, code) {
  const result = await confirmationResult.confirm(code)
  return createServerSession(result.user)
}
