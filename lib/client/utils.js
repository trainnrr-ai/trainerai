// Shared client-side utilities

export function loginWithGoogle() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('trainr:open-auth', { detail: { tab: 'google' } }))
}

// Client-side image compression: downscales to maxDim (longest edge) and re-encodes to
// WebP if browser supports it (better compression), otherwise JPEG fallback.
// Keeps base64 sizes ~80-200KB for production-safe MongoDB storage.
function detectWebpSupport() {
  try {
    const c = document.createElement('canvas')
    return c.toDataURL('image/webp').startsWith('data:image/webp')
  } catch { return false }
}

let _webpSupported = null
export function compressImage(file, maxDim = 1080, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) return reject(new Error('Not an image'))
    if (_webpSupported === null) _webpSupported = detectWebpSupport()
    const mimeOut = _webpSupported ? 'image/webp' : 'image/jpeg'
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        try {
          let { width, height } = img
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL(mimeOut, quality))
        } catch (e) { reject(e) }
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return d.toLocaleDateString()
}

// Human-readable last-active label, used in profile cards & chat headers.
// Returns { text, online } where online means the green dot should show.
export function formatLastActive(dateStr) {
  if (!dateStr) return { text: '', online: false }
  const d = new Date(dateStr)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 120) return { text: 'Online now', online: true }
  if (s < 3600) return { text: `Active ${Math.floor(s / 60)}m ago`, online: false }
  if (s < 21600) return { text: `Active ${Math.floor(s / 3600)}h ago`, online: false }
  if (s < 86400) return { text: 'Active today', online: false }
  if (s < 86400 * 7) return { text: `Active ${Math.floor(s / 86400)}d ago`, online: false }
  return { text: `Last seen ${d.toLocaleDateString()}`, online: false }
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(path, { credentials: 'include', ...options })
  let data = null
  try { data = await res.json() } catch { /* ignore */ }
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const apiJson = (path, body, method = 'POST') => apiFetch(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body || {}),
})
