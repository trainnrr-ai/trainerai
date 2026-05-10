'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, RefreshCw, CheckCircle2, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { analyseSelfie, isFaceDetectorSupported } from '@/lib/client/face'

export default function SelfieVerifyDialog({ open, onOpenChange, onVerified }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle | streaming | analysing | captured | submitting
  const [snap, setSnap] = useState(null)
  const [error, setError] = useState(null)
  const [analysis, setAnalysis] = useState(null) // { ok, faceCount, reason, supported }

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

    // Lightweight client-side face check (browsers that support FaceDetector)
    setPhase('analysing')
    const result = await analyseSelfie(dataUrl)
    setAnalysis(result)
    if (!result.ok) {
      setError(result.reason || 'Selfie did not pass quality check')
      setPhase('captured') // allow retake
    } else {
      setError(null)
      setPhase('captured')
    }
  }

  const retake = () => {
    setSnap(null)
    setError(null)
    setAnalysis(null)
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
          {phase === 'analysing' && (
            <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#00ff88]" />
              <span className="text-xs text-white/75 font-medium">Checking selfie quality\u2026</span>
            </div>
          )}
        </div>

        {/* Quality check feedback */}
        {phase === 'captured' && analysis && analysis.ok && (
          <div className="rounded-xl bg-[#00ff88]/[0.08] border border-[#00ff88]/25 p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00ff88] flex-shrink-0" />
            <span className="text-xs text-white/85">Looks good \u2014 1 face detected. Ready to submit.</span>
          </div>
        )}
        {phase === 'captured' && analysis && !analysis.ok && (
          <div className="rounded-xl bg-amber-500/[0.08] border border-amber-500/30 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-[2px]" />
            <span className="text-xs text-white/85">{analysis.reason || 'Please retake.'}</span>
          </div>
        )}

        {error && phase !== 'captured' && <p className="text-sm text-red-400">{error}</p>}

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
          {phase === 'analysing' && (
            <Button disabled className="flex-1 bg-white/10 text-white/55"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analysing\u2026</Button>
          )}
          {phase === 'captured' && (
            <>
              <Button onClick={retake} variant="outline" className="bg-white/5 border-white/10">
                <RefreshCw className="w-4 h-4 mr-2" /> Retake
              </Button>
              <Button
                onClick={submit}
                disabled={analysis && !analysis.ok}
                className={`flex-1 font-semibold ${analysis && !analysis.ok ? 'bg-white/10 text-white/40' : 'bg-[#00ff88] hover:bg-[#00cc6a] text-black'}`}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Submit for Review
              </Button>
            </>
          )}
          {phase === 'submitting' && (
            <Button disabled className="flex-1 bg-[#00ff88]/60 text-black">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
            </Button>
          )}
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#00ff88] flex-shrink-0 mt-[2px]" />
          <p className="text-[11px] text-white/55 leading-relaxed">
            We compare your selfie with your profile photos and review for authenticity. Verification is <strong className="text-white/80">optional</strong> \u2014 you can use Trainr without it. Verified profiles get the blue badge and priority placement in Discover.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
