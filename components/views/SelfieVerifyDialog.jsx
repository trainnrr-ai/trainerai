'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SelfieVerifyDialog({ open, onOpenChange, onVerified }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle | streaming | captured | submitting
  const [snap, setSnap] = useState(null)
  const [error, setError] = useState(null)

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const startCamera = async () => {
    setError(null)
    setSnap(null)
    setPhase('streaming')
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
    } catch {
      setError('Camera access denied. Please allow camera permissions and try again.')
      setPhase('idle')
    }
  }

  const capture = () => {
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
    setPhase('captured')
    stopCamera()
  }

  const retake = () => {
    setSnap(null)
    startCamera()
  }

  const submit = async () => {
    if (!snap) return
    setPhase('submitting')
    try {
      const res = await fetch('/api/profile/verify-selfie', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selfie: snap }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      if (data.pending) {
        toast.success('Selfie submitted!', { description: 'We’ll review and notify you shortly.' })
      } else {
        toast.success('Selfie verified!', { description: 'Your blue badge is now active.' })
      }
      onVerified?.(data.profile)
      handleClose()
    } catch (e) {
      toast.error(e.message)
      setPhase('captured')
    }
  }

  const handleClose = () => {
    stopCamera()
    setPhase('idle')
    setSnap(null)
    setError(null)
    onOpenChange(false)
  }

  useEffect(() => () => stopCamera(), [])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="bg-[#0a0b0d] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-[#00ff88]" /> Selfie Verification</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-white/60">Take a clear selfie to earn your verified badge. Your face should be centered and well-lit.</p>

        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10">
          {phase === 'idle' && !snap && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50">
              <Camera className="w-14 h-14" />
              <p className="text-sm">Camera off</p>
            </div>
          )}
          {phase === 'streaming' && (
            <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} playsInline muted />
          )}
          {snap && phase !== 'streaming' && (
            <img src={snap} alt="Selfie" className="w-full h-full object-cover" />
          )}
          {phase === 'streaming' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/5 h-3/5 rounded-full border-2 border-[#00ff88]/60 border-dashed" />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          {phase === 'idle' && !snap && (
            <Button onClick={startCamera} className="flex-1 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold">
              <Camera className="w-4 h-4 mr-2" /> Open Camera
            </Button>
          )}
          {phase === 'streaming' && (
            <Button onClick={capture} className="flex-1 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold">
              Capture Selfie
            </Button>
          )}
          {phase === 'captured' && (
            <>
              <Button onClick={retake} variant="outline" className="bg-white/5 border-white/10">
                <RefreshCw className="w-4 h-4 mr-2" /> Retake
              </Button>
              <Button onClick={submit} className="flex-1 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Submit for Verification
              </Button>
            </>
          )}
          {phase === 'submitting' && (
            <Button disabled className="flex-1 bg-[#00ff88]/60 text-black">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
            </Button>
          )}
        </div>
        <p className="text-xs text-white/40 text-center">Your selfie is reviewed for liveness & match against your profile photos.</p>
      </DialogContent>
    </Dialog>
  )
}
