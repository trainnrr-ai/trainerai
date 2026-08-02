// Face Verify - Auto Verified
'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, RefreshCw, CheckCircle2, Loader2, X, Shield } from 'lucide-react'
import { toast } from 'sonner'
import * as faceapi from 'face-api.js'

// Cache the model loading promise globally so it only runs once
let modelsPromise = null
function loadFaceApiModels() {
  if (!modelsPromise) {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
    modelsPromise = Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
  }
  return modelsPromise
}

// Helper to load an image with CORS allowed
function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error('Failed to load profile photo: ' + src))
    img.src = src
  })
}

export default function SelfieVerifyDialog({ open, onOpenChange, onVerified, profile }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [phase, setPhase] = useState('loading-models') // loading-models | camera-active | processing | success | failed
  const [snap, setSnap] = useState(null)
  const [error, setError] = useState(null)
  const [matchScore, setMatchScore] = useState(null)

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  const startCamera = async () => {
    setError(null)
    setSnap(null)
    setPhase('camera-active')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      console.error(err)
      setError('Camera access denied. Please allow camera permissions and try again.')
    }
  }

  const capture = async () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.translate(size, 0)
    ctx.scale(-1, 1)
    const sx = ((video.videoWidth || size) - size) / 2
    const sy = ((video.videoHeight || size) - size) / 2
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setSnap(dataUrl)
    stopCamera()

    setPhase('processing')
    setError(null)

    try {
      // 1. Get face descriptor from selfie (uses SSD Mobilenet v1 for high accuracy)
      const selfieDetection = await faceapi
        .detectSingleFace(canvas)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!selfieDetection) {
        throw new Error('No face detected in your selfie. Please look straight at the camera in good lighting.')
      }

      // 2. Get face descriptors from each profile photo
      const photos = profile?.photos || []
      if (photos.length === 0) {
        throw new Error('You need at least 1 profile photo to verify your identity.')
      }

      let bestDistance = Infinity
      let faceDetectedInAnyProfilePhoto = false

      for (const photoUrl of photos) {
        try {
          const img = await loadImg(photoUrl)
          const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor()

          if (detection) {
            faceDetectedInAnyProfilePhoto = true
            const distance = faceapi.euclideanDistance(selfieDetection.descriptor, detection.descriptor)
            if (distance < bestDistance) {
              bestDistance = distance
            }
          }
        } catch (err) {
          console.warn('Failed to detect face in profile photo:', photoUrl, err)
        }
      }

      if (!faceDetectedInAnyProfilePhoto) {
        throw new Error('No face detected in your profile photos. Make sure your profile photos clearly show your face.')
      }

      // 3. Matching logic (SSD Mobilenet v1 is highly accurate; threshold 0.55 ensures strict matching)
      const distance = bestDistance
      const verified = distance < 0.55
      
      // Calculate match score percentage
      let score = Math.round((1 - distance) * 100)
      if (verified) {
        // Map distance < 0.55 to score > 60%
        score = Math.max(score, Math.round(60 + (0.55 - distance) * 80))
      } else {
        score = Math.min(score, 59)
      }
      setMatchScore(score)

      if (verified) {
        // Call verification API
        const res = await fetch('/api/profile/verify-face', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchScore: score, verified: true }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Verification API error')
        
        onVerified?.(data.profile)
        setPhase('success')
      } else {
        setPhase('failed')
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Verification process failed.')
      setPhase('failed')
    }
  }

  const retake = () => {
    setSnap(null)
    setError(null)
    setMatchScore(null)
    startCamera()
  }

  const handleClose = () => {
    stopCamera()
    setPhase('loading-models')
    setSnap(null)
    setError(null)
    setMatchScore(null)
    onOpenChange(false)
  }

  useEffect(() => {
    if (open) {
      setPhase('loading-models')
      setError(null)
      setSnap(null)
      setMatchScore(null)
      loadFaceApiModels()
        .then(() => {
          startCamera()
        })
        .catch((err) => {
          console.error(err)
          setError('Failed to setup face verification models.')
          setPhase('failed')
        })
    } else {
      stopCamera()
    }
  }, [open])

  useEffect(() => () => stopCamera(), [])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="bg-white border-slate-200 max-w-md text-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sky-400">
            <Shield className="w-5 h-5" /> Identity Verification
          </DialogTitle>
        </DialogHeader>

        {phase === 'loading-models' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
            <p className="text-sm text-slate-600 font-medium">Setting up face verification...</p>
            <p className="text-xs text-slate-400">Loading face verification...</p>
          </div>
        )}

        {phase === 'camera-active' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Look straight at camera in good lighting. Position your face in the oval guide.
            </p>
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <X className="w-10 h-10 text-red-500" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              ) : (
                <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} playsInline muted />
              )}
              {!error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  <div className="w-48 h-64 rounded-[50%] border-2 border-dashed border-sky-400/80 bg-transparent flex items-center justify-center">
                    <span className="text-slate-700 text-[10px] text-center px-3 font-semibold select-none bg-white/80 py-1 rounded-full backdrop-blur-sm">
                      Position face here
                    </span>
                  </div>
                  <p className="text-slate-800 text-xs font-semibold mt-4 bg-white/90 px-4 py-1.5 rounded-full backdrop-blur-sm">
                    Position your face in the oval
                  </p>
                </div>
              )}
            </div>
            {!error && (
              <Button onClick={capture} className="w-full bg-sky-500 hover:bg-sky-650 text-white font-bold rounded-xl h-11 shadow-md shadow-sky-500/10">
                Take Selfie
              </Button>
            )}
          </div>
        )}

        {phase === 'processing' && (
          <div className="space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              {snap && <img src={snap} alt="Selfie Preview" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-slate-800 p-6">
                <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
                <div className="w-full max-w-[200px] h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full animate-pulse w-4/5 mx-auto" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-slate-800">Comparing with your photos...</p>
                  <p className="text-xs text-slate-500">Analyzing face match...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === 'success' && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Identity Verified!</h3>
            <p className="text-sm text-slate-600">Match confidence: <span className="text-emerald-500 font-extrabold">{matchScore}%</span></p>
            <p className="text-xs text-slate-500 bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl max-w-xs leading-relaxed">
              You now have a verified badge on your profile. Your photos have been matched successfully.
            </p>
            <Button onClick={handleClose} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-11">
              Close
            </Button>
          </div>
        )}

        {phase === 'failed' && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
              <X className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Face not recognized</h3>
            {error ? (
              <p className="text-xs text-red-500 max-w-xs">{error}</p>
            ) : (
              <p className="text-xs text-slate-500 max-w-xs">
                Make sure your profile photos clearly show your face.
              </p>
            )}
            
            <div className="text-left bg-slate-50 border border-slate-200 p-4 rounded-xl w-full space-y-2">
              <p className="text-xs font-bold text-slate-700">Tips for a better match:</p>
              <ul className="text-[11px] text-slate-500 space-y-1 pl-1">
                <li className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Good lighting
                </li>
                <li className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Face straight
                </li>
                <li className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> No sunglasses
                </li>
                <li className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Same person as profile photos
                </li>
              </ul>
            </div>
            
            <div className="flex gap-2 w-full">
              <Button onClick={handleClose} variant="outline" className="flex-1 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-11">
                Cancel
              </Button>
              <Button onClick={retake} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-11">
                Try again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
