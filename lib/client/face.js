// Lightweight client-side face detection — uses the native FaceDetector API
// (Chrome / Edge desktop) when available. On unsupported browsers this returns
// { supported: false } and we let the server's heuristic checks gate verification
// alongside the human admin review.
//
// We deliberately do NOT bundle TensorFlow.js / ML models — keeps the bundle
// small and avoids extra runtime cost. Trust comes from admin review, the
// FaceDetector check just rejects obvious mismatches (no face / multiple faces /
// landscapes / screenshots) early in the flow.

export function isFaceDetectorSupported() {
  return typeof window !== 'undefined' && 'FaceDetector' in window
}

// Returns { supported, ok, faceCount, reason }
export async function analyseSelfie(dataUrl) {
  if (!dataUrl) return { supported: true, ok: false, faceCount: 0, reason: 'No image' }

  // Quick sanity: minimum/maximum size in bytes (rough check against base64 length)
  // base64 ~ 4/3 of raw bytes
  const base64Body = dataUrl.split(',')[1] || ''
  const approxBytes = Math.floor(base64Body.length * 0.75)
  if (approxBytes < 8 * 1024) {
    return { supported: true, ok: false, faceCount: 0, reason: 'Image too small or low quality' }
  }
  if (approxBytes > 4 * 1024 * 1024) {
    return { supported: true, ok: false, faceCount: 0, reason: 'Image too large' }
  }

  if (!isFaceDetectorSupported()) {
    // Browser doesn't support FaceDetector — we let the server + admin review handle it.
    return { supported: false, ok: true, faceCount: null, reason: null }
  }

  try {
    const img = await loadImage(dataUrl)
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 })
    const faces = await detector.detect(img)
    if (!faces || faces.length === 0) {
      return { supported: true, ok: false, faceCount: 0, reason: 'No face detected — make sure your face is centred and well-lit.' }
    }
    if (faces.length > 1) {
      return { supported: true, ok: false, faceCount: faces.length, reason: 'Multiple faces detected — please take a solo selfie.' }
    }
    return { supported: true, ok: true, faceCount: 1, reason: null }
  } catch (e) {
    // FaceDetector failed for some reason (rare). Don't block — fall back to server review.
    return { supported: false, ok: true, faceCount: null, reason: null, error: e?.message }
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
