// Push notification helpers — registers service worker + subscribes to push.
// MOCKED: server-side push delivery requires VAPID keys not yet set.
import { apiJson, apiFetch } from './utils'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export async function ensureServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    return reg
  } catch (e) {
    console.error('SW registration failed', e)
    return null
  }
}

export async function requestPushPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

export async function subscribeForPush() {
  const reg = await ensureServiceWorker()
  if (!reg || !('PushManager' in window)) return { ok: false, reason: 'unsupported' }
  const perm = await requestPushPermission()
  if (perm !== 'granted') return { ok: false, reason: perm }
  try {
    const { vapidPublicKey } = await apiFetch('/api/push/vapid')
    if (!vapidPublicKey) {
      // Save endpoint anyway so future server-side delivery is possible
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true })
        .catch(() => null)
      if (sub) await apiJson('/api/push/subscribe', { subscription: sub })
      return { ok: true, mocked: true }
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
    await apiJson('/api/push/subscribe', { subscription: sub })
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e.message }
  }
}

export async function unsubscribePush() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await sub.unsubscribe().catch(() => {})
    await apiJson('/api/push/unsubscribe', { endpoint: sub.endpoint })
  }
}
