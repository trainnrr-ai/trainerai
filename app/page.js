'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Dumbbell, MapPin, Clock, Target, MessageCircle, Heart, X, ChevronRight,
  Sparkles, Users, Lock, AlertTriangle, Instagram, Send, Filter, ArrowLeft, LogOut,
  Flame, ArrowRight, Loader2, Camera, Bell, Navigation, Zap, Crown, ChevronLeft, Check, RefreshCw,
  Phone, Shield,
} from 'lucide-react'

// Shared constants & utilities
import { LOGO, INSTAGRAM_URL, GOALS, TIMINGS, LEVELS, GENDERS, CITIES } from '@/lib/client/constants'
import { loginWithGoogle, compressImage, formatLastActive } from '@/lib/client/utils'
import { loginWithFirebaseGoogle, sendFirebasePhoneOtp, confirmFirebasePhoneOtp } from '@/lib/client/firebaseAuth'

// Reusable components
import SmartImg from '@/components/app/SmartImg'
import VerificationBadge from '@/components/app/VerificationBadge'
import NotificationBell from '@/components/app/NotificationBell'

// Static / route-style views (dynamically loaded for fast initial open)
const Landing = dynamic(() => import('@/components/views/Landing'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
    </div>
  )
})
const AboutView = dynamic(() => import('@/components/views/AboutView'), { ssr: false })
const PrivacyView = dynamic(() => import('@/components/views/PrivacyView'), { ssr: false })
const ContactView = dynamic(() => import('@/components/views/ContactView'), { ssr: false })
const SelfieVerifyDialog = dynamic(() => import('@/components/views/SelfieVerifyDialog'), { ssr: false })
const AdminView = dynamic(() => import('@/components/views/AdminView'), { ssr: false })
const PremiumDialog = dynamic(() => import('@/components/views/PremiumDialog'), { ssr: false })
const ReportDialog = dynamic(() => import('@/components/views/ReportDialog'), { ssr: false })

// Premium UI is hidden by default — flip NEXT_PUBLIC_PREMIUM_ENABLED=true to expose Pro CTA + Settings card.
const PREMIUM_ENABLED = process.env.NEXT_PUBLIC_PREMIUM_ENABLED === 'true'
const FIREBASE_AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'firebase'

const PLACEHOLDER_NAMES = ['Legacy User', 'Test User', 'Unknown User', '']
const getProfileName = (p) => {
  const name = p?.name
  if (!name || PLACEHOLDER_NAMES.includes(name)) return 'Trainr User'
  return name
}

const AUTH_ERROR_MESSAGE = 'Login failed. Please try again.'
const OTP_SEND_ERROR_MESSAGE = 'Could not send OTP. Please check the number and try again.'
const OTP_VERIFY_ERROR_MESSAGE = 'Invalid or expired code. Please try again.'

const getPhotoSrc = (photos, index = 0, fallback = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop') => {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return fallback
  }
  const photo = photos[index]
  if (!photo) {
    return photos[0] || fallback
  }
  return photo
}

function Navbar({ user, profile, view, setView, onOpenPremium, pendingIncomingCount = 0 }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <button onClick={() => setView(user ? 'discover' : 'landing')} className="flex items-center gap-2 group">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 group-hover:border-sky-500/50 transition">
            <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" loading="eager" decoding="async" width={36} height={36} />
          </div>
          <span className="text-lg md:text-xl font-extrabold tracking-tight text-slate-800 hidden sm:inline">Trainr</span>
        </button>
        {user ? (
          <nav className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setView('discover')} className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${view === 'discover' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}>Discover</button>
            <button onClick={() => setView('matches')} className={`relative px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${view === 'matches' || view === 'chat' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}>
              Connections
              {pendingIncomingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#10B981] text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
                  {pendingIncomingCount > 9 ? '9+' : pendingIncomingCount}
                </span>
              )}
            </button>
            <NotificationBell onNavigate={setView} />
            {user.tier !== 'pro' && PREMIUM_ENABLED && (
              <button onClick={onOpenPremium} title="Trainr Pro" className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 text-xs font-bold transition">
                <Crown className="w-3.5 h-3.5" /> Pro
              </button>
            )}
            {user.isAdmin && (
              <button onClick={() => setView('admin')} title="Admin" className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${view === 'admin' ? 'bg-sky-50 text-sky-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}>
                <Crown className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setView('settings')} className="ml-1 w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition overflow-hidden ring-1 ring-slate-200 hover:ring-sky-500/40">
              <Avatar className="w-9 h-9">
                <AvatarImage src={profile?.photos?.[0] || user.picture} className="object-cover" />
                <AvatarFallback className="bg-sky-100 text-sky-600 text-xs font-semibold">
                  {((profile?.name || user.name || 'U').replace(/^\+/, '') || 'U').slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-2 md:gap-3">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" title="Follow @trainr.in" className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center text-slate-500 hover:text-sky-500 hover:bg-slate-50 transition">
              <Instagram className="w-4 h-4" />
            </a>
            <button onClick={() => setView('about')} className="hidden md:inline-flex px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition">About</button>
            <button onClick={() => setView('contact')} className="hidden md:inline-flex px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition">Contact</button>
            <Button onClick={loginWithGoogle} className="bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-semibold rounded-full px-4 md:px-5 h-9 md:h-10 transition shadow-sm">Get Started</Button>
          </div>
        )}
      </div>
    </header>
  )
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</Label>{children}</div>
}

function ProfileEditor({ user, profile, onSaved }) {
  const isEditMode = !!profile
  const totalSteps = 7
  const [step, setStep] = useState(0)
  const initialGoals = Array.isArray(profile?.goals) && profile.goals.length
    ? profile.goals
    : (profile?.goal ? [profile.goal] : [])
  const [form, setForm] = useState({
    name: profile?.name || user?.name || '',
    age: profile?.age || '',
    gender: profile?.gender || '',
    city: profile?.city || '',
    gymName: profile?.gymName || '',
    level: profile?.level || '',
    goals: initialGoals,
    timing: profile?.timing || '',
    bio: profile?.bio || '',
    height: profile?.height || '',
    weight: profile?.weight || '',
    instagram: profile?.instagram || '',
    photos: profile?.photos || (user?.picture ? [user.picture] : []),
  })
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const addPhoto = () => {
    if (!photoUrl.trim()) return
    if (form.photos.length >= 5) { toast.error('Maximum 5 photos'); return }
    update('photos', [...form.photos, photoUrl.trim()])
    setPhotoUrl('')
  }
  const removePhoto = (i) => update('photos', form.photos.filter((_, idx) => idx !== i))
  const handleFile = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = 5 - form.photos.length
    if (remaining <= 0) { toast.error('Maximum 5 photos'); e.target.value = ''; return }
    const toProcess = files.slice(0, remaining)
    if (files.length > remaining) toast(`Only ${remaining} more photo${remaining > 1 ? 's' : ''} can be added`)
    let currentPhotos = [...form.photos]
    Promise.all(
      toProcess.map(file =>
        compressImage(file, 600, 0.5).then(dataUrl => {
          currentPhotos = [...currentPhotos, dataUrl]
          update('photos', currentPhotos)
        }).catch(() => toast.error(`Could not process ${file.name}`))
      )
    )
    e.target.value = ''
  }

  const validateStep = () => {
    switch (step) {
      case 0: if (form.photos.length < 3) return 'Add at least 3 photos'; break
      case 1: if (!form.name || !form.age || !form.gender) return 'Fill name, age and gender'; break
      case 2: if (!form.city || !form.gymName) return 'Pick city and your gym'; break
      case 3: if (!form.goals || form.goals.length === 0) return 'Pick at least 1 goal (max 3)'; break
      case 4: if (!form.timing) return 'Pick your workout timing'; break
      case 5: if (!form.level) return 'Pick your experience level'; break
      default: break
    }
    return null
  }

  const next = () => {
    const err = validateStep()
    if (err) { toast.error(err); return }
    if (step < totalSteps - 1) setStep(s => s + 1)
    else submit()
  }
  const back = () => { if (step > 0) setStep(s => s - 1) }

  const submit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(isEditMode ? 'Profile updated!' : 'Welcome to Trainr!')
      onSaved?.(data.profile)
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  if (isEditMode) {
    return (
      <div className="pt-20 pb-24 max-w-3xl mx-auto px-4 md:px-6">
        <div className="mb-8 fade-up">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800">Edit Profile</h1>
          <p className="text-slate-500 mt-2">Update your details. Changes are visible to new partners immediately.</p>
        </div>
        <div className="space-y-6 fade-up" style={{ animationDelay: '0.1s' }}>
          <PhotoEditorCard photos={form.photos} setPhotos={(p) => update('photos', p)} photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} addPhoto={addPhoto} handleFile={handleFile} removePhoto={removePhoto} />

          <Card className="bg-white border-slate-200/85 shadow-sm p-6 space-y-4 rounded-2xl">
            <h3 className="font-bold text-slate-800 text-lg">Basics</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-white border-slate-200 focus-visible:ring-sky-500" /></Field>
              <Field label="Age"><Input type="number" min={18} max={80} value={form.age} onChange={e => update('age', e.target.value)} className="bg-white border-slate-200 focus-visible:ring-sky-500" /></Field>
              <Field label="Gender">
                <Select value={form.gender} onValueChange={v => update('gender', v)}><SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
              </Field>
              <Field label="City">
                <Select value={form.city} onValueChange={v => update('city', v)}><SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </Field>
              <Field label="Height (cm)"><Input type="number" value={form.height} onChange={e => update('height', e.target.value)} className="bg-white border-slate-200 focus-visible:ring-sky-500" /></Field>
              <Field label="Weight (kg)"><Input type="number" value={form.weight} onChange={e => update('weight', e.target.value)} className="bg-white border-slate-200 focus-visible:ring-sky-500" /></Field>
            </div>
          </Card>

          <Card className="bg-white border-slate-200/85 shadow-sm p-6 space-y-4 rounded-2xl">
            <h3 className="font-bold text-slate-800 text-lg">Fitness</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gym Name"><Input value={form.gymName} onChange={e => update('gymName', e.target.value)} className="bg-white border-slate-200 focus-visible:ring-sky-500" /></Field>
              <Field label="Experience Level">
                <Select value={form.level} onValueChange={v => update('level', v)}><SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
              </Field>
              <Field label="Workout Goals (max 3)">
                <GoalsMultiSelect value={form.goals} onChange={(g) => update('goals', g)} />
              </Field>
              <Field label="Workout Timing">
                <Select value={form.timing} onValueChange={v => update('timing', v)}><SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TIMINGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </Field>
            </div>
            <Field label="Short Bio">
              <Textarea value={form.bio} onChange={e => update('bio', e.target.value)} maxLength={200} className="bg-white border-slate-200 focus-visible:ring-sky-500 min-h-[90px]" />
              <div className="text-xs text-slate-400 mt-1 text-right">{form.bio.length}/200</div>
            </Field>
            <Field label="Instagram (optional)">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3">
                <Instagram className="w-4 h-4 text-slate-400" />
                <Input value={form.instagram} onChange={e => update('instagram', e.target.value.replace('@',''))} placeholder="username" className="bg-transparent border-0 px-0 focus-visible:ring-0" />
              </div>
            </Field>
          </Card>

          <Button onClick={submit} disabled={saving} size="lg" className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-full h-12 shadow-sm transition active:scale-[0.98]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    )
  }

  const stepHeader = [
    { kicker: 'Step 1 of 7', title: 'Add your photos', sub: 'Real, recent photos build trust faster. Add 3 to 5.' },
    { kicker: 'Step 2 of 7', title: 'A bit about you', sub: 'Just the basics — name, age, gender.' },
    { kicker: 'Step 3 of 7', title: 'Where do you train?', sub: 'Pick your city and your home gym.' },
    { kicker: 'Step 4 of 7', title: "Pick your goals", sub: 'Choose up to 3. We\u2019ll match you with partners chasing the same.' },
    { kicker: 'Step 5 of 7', title: 'When do you train?', sub: 'Schedule matters. Pick your usual session window.' },
    { kicker: 'Step 6 of 7', title: 'Experience level', sub: 'So we set realistic expectations between partners.' },
    { kicker: 'Step 7 of 7', title: 'Tell partners your story', sub: 'Short, real, and what you\u2019re looking for.' },
  ]
  const cur = stepHeader[step]
  const progressPct = ((step + 1) / totalSteps) * 100
  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-xl mx-auto px-4 md:px-6">
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="uppercase tracking-wider font-bold text-sky-600">{cur.kicker}</span>
            <span className="font-medium">{Math.round(progressPct)}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div key={step} className="fade-up">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800">{cur.title}</h1>
          <p className="text-slate-500 mt-2">{cur.sub}</p>

          <div className="mt-8 space-y-4">
            {step === 0 && (
              <PhotoEditorCard photos={form.photos} setPhotos={(p) => update('photos', p)} photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} addPhoto={addPhoto} handleFile={handleFile} removePhoto={removePhoto} />
            )}
            {step === 1 && (
              <Card className="bg-white border-slate-200 shadow-md p-6 space-y-4 rounded-2xl">
                <Field label="Name"><Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-white border-slate-200 h-11 focus-visible:ring-sky-500" placeholder="Your name" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Age"><Input type="number" min={18} max={80} value={form.age} onChange={e => update('age', e.target.value)} className="bg-white border-slate-200 h-11 focus-visible:ring-sky-500" placeholder="25" /></Field>
                  <Field label="Gender">
                    <Select value={form.gender} onValueChange={v => update('gender', v)}><SelectTrigger className="bg-white border-slate-200 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Height (cm) — optional"><Input type="number" value={form.height} onChange={e => update('height', e.target.value)} className="bg-white border-slate-200 h-11 focus-visible:ring-sky-500" /></Field>
                  <Field label="Weight (kg) — optional"><Input type="number" value={form.weight} onChange={e => update('weight', e.target.value)} className="bg-white border-slate-200 h-11 focus-visible:ring-sky-500" /></Field>
                </div>
              </Card>
            )}
            {step === 2 && (
              <Card className="bg-white border-slate-200 shadow-md p-6 space-y-4 rounded-2xl">
                <Field label="City">
                  <Select value={form.city} onValueChange={v => update('city', v)}><SelectTrigger className="bg-white border-slate-200 h-11"><SelectValue placeholder="Select your city" /></SelectTrigger>
                    <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                </Field>
                <Field label="Gym name"><Input value={form.gymName} onChange={e => update('gymName', e.target.value)} placeholder="e.g. Cult Fit, Gold's Gym" className="bg-white border-slate-200 h-11 focus-visible:ring-sky-500" /></Field>
              </Card>
            )}
            {step === 3 && (
              <Card className="bg-white border-slate-200 shadow-md p-5 md:p-6 rounded-2xl">
                <div className="mb-3 text-sm text-slate-600 font-medium">Pick the goals you train for. <span className="text-slate-400">Max 3.</span></div>
                <GoalsMultiSelect value={form.goals} onChange={(g) => update('goals', g)} />
              </Card>
            )}
            {step === 4 && (
              <ChoiceGrid options={TIMINGS} value={form.timing} onChange={(v) => update('timing', v)} icon={Clock} />
            )}
            {step === 5 && (
              <ChoiceGrid options={LEVELS} value={form.level} onChange={(v) => update('level', v)} icon={Zap} large />
            )}
            {step === 6 && (
              <Card className="bg-white border-slate-200 shadow-md p-6 space-y-4 rounded-2xl">
                <Field label="Short bio">
                  <Textarea
                    value={form.bio} onChange={e => update('bio', e.target.value)} maxLength={200}
                    placeholder="Morning workouts before office. Need a squat partner."
                    className="bg-white border-slate-200 min-h-[110px] focus-visible:ring-sky-500"
                  />
                  <div className="text-xs text-slate-400 mt-1 text-right">{form.bio.length}/200</div>
                </Field>
                <Field label="Instagram (optional — gets you a verified badge)">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-11">
                    <Instagram className="w-4 h-4 text-slate-450" />
                    <Input value={form.instagram} onChange={e => update('instagram', e.target.value.replace('@',''))} placeholder="username" className="bg-transparent border-0 px-0 focus-visible:ring-0" />
                  </div>
                </Field>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800 leading-relaxed font-medium">
                  By continuing you agree to Trainr’s safety-first community guidelines: zero tolerance for harassment, sexual content or fake profiles.
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <Button onClick={back} variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full h-12 px-5 transition">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          <Button onClick={next} disabled={saving} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-full h-12 active:scale-[0.99] transition shadow-sm">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating profile…</> : (step === totalSteps - 1 ? <>Finish & Discover Partners <ArrowRight className="w-4 h-4 ml-2" /></> : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>)}
          </Button>
        </div>
      </div>
    </div>
  )
}

function GoalsMultiSelect({ value, onChange, max = 3 }) {
  const list = Array.isArray(value) ? value : []
  const toggle = (g) => {
    if (list.includes(g)) {
      onChange(list.filter(x => x !== g))
    } else {
      if (list.length >= max) { toast.error(`Max ${max} goals`); return }
      onChange([...list, g])
    }
  }
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {GOALS.map(g => {
          const selected = list.includes(g)
          return (
            <button
              key={g}
              type="button"
              onClick={() => toggle(g)}
              className={`text-left p-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                selected
                  ? 'bg-sky-50 border-sky-300 text-sky-700 pending-halo font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Target className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm flex-1 leading-tight">{g}</span>
                {selected && <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />}
              </div>
            </button>
          )
        })}
      </div>
      <div className="text-[11px] text-slate-400 mt-2.5 flex items-center justify-between font-medium">
        <span>{list.length}/{max} selected</span>
        {list.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-slate-500 hover:text-slate-700 transition">Clear</button>
        )}
      </div>
    </div>
  )
}

function PhotoEditorCard({ photos, setPhotos, photoUrl, setPhotoUrl, addPhoto, handleFile, removePhoto }) {
  // Drag-and-drop reorder (HTML5 drag). On touch devices, the buttons below provide reorder fallback.
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  const moveTo = (from, to) => {
    if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return
    const next = photos.slice()
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setPhotos(next)
  }
  const setAsMain = (i) => moveTo(i, 0)
  const moveUp = (i) => moveTo(i, Math.max(0, i - 1))
  const moveDown = (i) => moveTo(i, Math.min(photos.length - 1, i + 1))

  return (
    <Card className="bg-white border border-slate-200/80 shadow-sm p-5 md:p-6 rounded-2xl">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5 md:gap-3 mb-4">
        {photos.map((p, i) => {
          const isMain = i === 0
          const isOver = overIdx === i && dragIdx !== null && dragIdx !== i
          return (
            <div
              key={`${i}-${p.slice(-20)}`}
              draggable
              onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = 'move' }}
              onDragOver={(e) => { e.preventDefault(); if (overIdx !== i) setOverIdx(i) }}
              onDragLeave={() => setOverIdx(idx => (idx === i ? null : idx))}
              onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) moveTo(dragIdx, i); setDragIdx(null); setOverIdx(null) }}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 border transition-all duration-150 group cursor-grab active:cursor-grabbing
                ${isMain ? 'border-sky-500/60 pending-halo' : 'border-slate-200'}
                ${dragIdx === i ? 'opacity-50 scale-95' : ''}
                ${isOver ? 'ring-2 ring-sky-500/70 scale-[1.02]' : ''}`}
            >
              <img src={p} alt="" className="w-full h-full object-cover pointer-events-none" />
              {/* Top-right: Delete */}
              <button type="button" onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-900 z-10 text-white" aria-label="Delete photo">
                <X className="w-3.5 h-3.5" />
              </button>
              {/* Bottom-left: Main badge / Set-as-main */}
              {isMain ? (
                <Badge className="absolute bottom-1.5 left-1.5 bg-sky-500 text-white text-[10px] py-0 font-bold tracking-wide z-10 rounded">MAIN</Badge>
              ) : (
                <button
                  type="button"
                  onClick={() => setAsMain(i)}
                  title="Set as main photo"
                  className="absolute bottom-1.5 left-1.5 rounded bg-slate-900/80 backdrop-blur px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/90 hover:bg-slate-900 hover:text-sky-400 transition z-10"
                >
                  Set main
                </button>
              )}
              {/* Bottom-right: Up/Down chevrons (mobile-friendly reorder fallback) */}
              <div className="absolute bottom-1.5 right-1.5 flex flex-col gap-0.5 z-10">
                {i > 0 && (
                  <button type="button" onClick={() => moveUp(i)} className="w-6 h-6 rounded bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-900 hover:text-sky-450 text-white" aria-label="Move up">
                    <ChevronLeft className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                )}
                {i < photos.length - 1 && (
                  <button type="button" onClick={() => moveDown(i)} className="w-6 h-6 rounded bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-900 hover:text-sky-450 text-white" aria-label="Move down">
                    <ChevronLeft className="w-3.5 h-3.5 rotate-90" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {photos.length < 5 && (
          <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-sky-500/50 hover:text-sky-500 transition cursor-pointer bg-slate-50">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
            <span className="text-3xl leading-none font-light">+</span>
            <span className="text-[10px] uppercase tracking-wider mt-1 font-semibold">Add photos</span>
          </label>
        )}
      </div>
      <div className="flex gap-2">
        <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="Or paste image URL…" className="bg-white border-slate-200 focus-visible:ring-sky-500" />
        <Button type="button" onClick={addPhoto} variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">Add URL</Button>
      </div>
      <p className="text-xs text-slate-450 mt-3 font-medium">3–5 photos required. Drag to reorder, or use ↑↓ buttons. First photo is your main.</p>
    </Card>
  )
}

function ChoiceGrid({ options, value, onChange, icon: Icon, large }) {
  return (
    <div className={`grid gap-2.5 ${large ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {options.map(opt => {
        const selected = value === opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`text-left p-4 rounded-2xl border transition-all duration-200 active:scale-[0.99] ${
              selected
                ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-[0_0_0_1px_rgba(14,165,233,0.1)] font-semibold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-450'}`}>
                {Icon && <Icon className="w-5 h-5" />}
              </div>
              <span className="font-semibold flex-1 text-sm">{opt}</span>
              {selected && <Check className="w-5 h-5 text-sky-600" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ProfileCard({ profile, onLike, onSkip, onReport, index = 0 }) {
  const [photoIdx, setPhotoIdx] = useState(0)
  const [pending, setPending] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  const photos = profile.photos || []
  const displayName = getProfileName(profile)
  
  const triggerConnect = (e) => {
    e?.stopPropagation?.()
    if (pending) return
    setPending(true)
    setTimeout(() => {
      setSheetOpen(false)
      onLike(profile)
    }, 200)
  }
  
  const triggerSkip = (e) => {
    e?.stopPropagation?.()
    setSheetOpen(false)
    onSkip(profile)
  }
  
  const triggerReport = (e) => {
    e?.stopPropagation?.()
    onReport(profile)
  }

  return (
    <div className="w-full max-w-md mx-auto py-2 md:py-4 fade-up" style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}>
      <Card 
        onClick={() => setSheetOpen(true)}
        className="bg-white border border-slate-200/80 overflow-hidden w-full max-w-md mx-auto rounded-3xl shadow-lg hover:border-slate-350 transition-all cursor-pointer"
      >
        <div className="relative aspect-[4/5] bg-slate-50">
          <SmartImg src={getPhotoSrc(profile.photos, photoIdx)} alt={displayName} className="w-full h-full" />

          {photos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
              {photos.map((_, i) => (
                <div key={i} className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${i === photoIdx ? 'bg-white' : 'bg-white/35'}`} />
              ))}
            </div>
          )}

          <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(i => Math.max(0, i-1)) }} className="absolute left-0 top-0 w-1/3 h-full z-[5]" aria-label="Previous photo" />
          <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(i => Math.min(photos.length-1, i+1)) }} className="absolute right-0 top-0 w-1/3 h-full z-[5]" aria-label="Next photo" />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-5 pt-20 z-[6] pointer-events-none">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl md:text-[26px] font-extrabold leading-tight text-white">{displayName}<span className="text-white/80 font-bold">, {profile.age}</span></h3>
              <VerificationBadge verified={profile.verified} />
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-white/80 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.city}</span>
              <span className="text-white/40">·</span>
              <span className="text-white font-medium">{profile.gymName}</span>
              {profile.distanceKm != null && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1"><Navigation className="w-3 h-3" />{profile.distanceKm} km</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {((profile.goals && profile.goals.length) ? profile.goals : (profile.goal ? [profile.goal] : [])).map(g => (
                <Badge key={g} className="bg-sky-500/20 text-sky-200 border-sky-400/25 hover:bg-sky-500/20 font-semibold pointer-events-auto">{g}</Badge>
              ))}
              <Badge variant="outline" className="bg-white/15 text-white border-white/20 hover:bg-white/20 pointer-events-auto font-medium">{profile.level}</Badge>
              <Badge variant="outline" className="bg-white/15 text-white border-white/20 hover:bg-white/20 pointer-events-auto font-medium"><Clock className="w-3 h-3 mr-1" />{profile.timing}</Badge>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 relative z-10 bg-white">
          {profile.matchReasons && profile.matchReasons.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mr-1">Why this match</span>
              {profile.matchReasons.map(r => (
                <span key={r.key} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-semibold">
                  <Sparkles className="w-2.5 h-2.5" /> {r.label}
                </span>
              ))}
            </div>
          )}
          {profile.bio && <p className="text-[15px] text-slate-700 leading-[1.55] pointer-events-none font-medium">{profile.bio}</p>}
          {profile.instagram && (
            <a href={`https://instagram.com/${profile.instagram}`} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-slate-500 mt-3 hover:text-sky-500 transition relative z-20 font-medium">
              <Instagram className="w-3.5 h-3.5" /> @{profile.instagram}
            </a>
          )}
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-2 mt-5 relative z-20">
            <Button onClick={triggerSkip} variant="outline" className="rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 h-12 transition shadow-sm" aria-label="Skip">
              <X className="w-5 h-5" />
            </Button>
            <Button onClick={triggerConnect} disabled={pending} className={`rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-bold h-12 transition shadow-md shadow-sky-500/10 disabled:opacity-100 ${pending ? 'connect-ping pending-halo' : ''}`}>
              {pending ? (
                <><Check className="w-[18px] h-[18px] mr-1.5 text-white" /> Pending</>
              ) : (
                <><Heart className="w-[18px] h-[18px] mr-1.5 fill-white text-white" /> Connect</>
              )}
            </Button>
            <Button onClick={triggerReport} variant="outline" className="rounded-xl bg-white border-slate-200 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 active:scale-95 h-12 transition shadow-sm" aria-label="Report">
              <AlertTriangle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] bg-white border-slate-200 rounded-t-3xl overflow-y-auto p-0 z-[100]">
          <SheetHeader className="sr-only">
            <SheetTitle>Profile Detail</SheetTitle>
          </SheetHeader>
          <div className="relative">
            <div className="w-full aspect-[4/5] sm:aspect-square relative">
              <SmartImg src={getPhotoSrc(profile.photos, 0)} alt={displayName} className="w-full h-full" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white to-transparent h-32" />
            </div>
            
            <div className="px-5 pb-32 -mt-10 relative z-10 space-y-6">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-3xl font-extrabold text-slate-800">{displayName}<span className="text-slate-500 font-bold">, {profile.age}</span></h2>
                  <VerificationBadge verified={profile.verified} />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-650 mt-1 font-medium">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{profile.city}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-800 font-semibold">{profile.gymName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">Experience</div>
                  <div className="font-semibold text-slate-850 flex items-center gap-2"><Zap className="w-4 h-4 text-sky-500" /> {profile.level}</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">Timing</div>
                  <div className="font-semibold text-slate-850 flex items-center gap-2"><Clock className="w-4 h-4 text-sky-500" /> {profile.timing}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-3">Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {((profile.goals && profile.goals.length) ? profile.goals : (profile.goal ? [profile.goal] : [])).map(g => (
                    <Badge key={g} className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-sm font-semibold">{g}</Badge>
                  ))}
                </div>
              </div>

              {profile.bio && (
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-2">About</h3>
                  <p className="text-slate-700 leading-relaxed text-[15px] whitespace-pre-wrap font-medium">{profile.bio}</p>
                </div>
              )}

              {profile.instagram && (
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-2">Social</h3>
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition text-slate-800 font-semibold shadow-sm">
                    <Instagram className="w-4 h-4 text-pink-550" /> @{profile.instagram}
                  </a>
                </div>
              )}
              
              {profile.matchReasons && profile.matchReasons.length > 0 && (
                <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-100 shadow-sm">
                  <div className="text-xs text-emerald-700 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Why you're a match</div>
                  <div className="flex flex-col gap-1.5">
                    {profile.matchReasons.map(r => (
                      <div key={r.key} className="text-sm text-slate-750 flex items-center gap-2 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-20">
              <div className="max-w-md mx-auto grid grid-cols-[1fr_2fr] gap-3">
                <Button onClick={triggerSkip} variant="outline" className="rounded-2xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 h-14 transition w-full shadow-sm" aria-label="Skip">
                  <X className="w-6 h-6" />
                </Button>
                <Button onClick={triggerConnect} disabled={pending} className={`rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-bold h-14 transition shadow shadow-sky-500/10 disabled:opacity-100 w-full text-lg ${pending ? 'connect-ping pending-halo' : ''}`}>
                  {pending ? (
                    <><Check className="w-5 h-5 mr-2" /> Pending</>
                  ) : (
                    <><Heart className="w-5 h-5 mr-2 fill-white text-white" /> Connect</>
                  )}
                </Button>
              </div>
              <div className="max-w-md mx-auto text-center mt-3">
                <button onClick={triggerReport} className="text-xs text-slate-400 hover:text-red-500 transition flex items-center justify-center gap-1 mx-auto font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Report {displayName}
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function FiltersSheet({ filters, setFilters, onApply }) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState(filters)
  useEffect(() => setLocal(filters), [filters])
  const set = (k, v) => setLocal(s => ({ ...s, [k]: v === '__any__' ? '' : v }))
  const toggleGoal = (g) => {
    const cur = Array.isArray(local.goals) ? local.goals : []
    if (cur.includes(g)) setLocal(s => ({ ...s, goals: cur.filter(x => x !== g) }))
    else if (cur.length >= 3) toast.error('Max 3 goals')
    else setLocal(s => ({ ...s, goals: [...cur, g] }))
  }
  const blankFilters = { city: '', gym: '', goals: [], timing: '', gender: '', level: '', verifiedOnly: false, maxDistance: 0, ageMin: 0, ageMax: 0 }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-full bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-white border-slate-200 overflow-y-auto">
        <SheetHeader><SheetTitle className="text-slate-800 font-extrabold text-xl">Filter Partners</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-6">
          <Field label="City">
            <Select value={local.city || '__any__'} onValueChange={v => set('city', v)}><SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent><SelectItem value="__any__">Any</SelectItem>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Gym">
            <Input value={local.gym} onChange={e => set('gym', e.target.value)} placeholder="e.g. Cult Fit" className="bg-white border-slate-200 focus-visible:ring-sky-500" />
          </Field>
          <Field label={`Workout Goals${(local.goals?.length || 0) ? ` (${local.goals.length})` : ''}`}>
            <div className="flex flex-wrap gap-1.5">
              {GOALS.map(g => {
                const sel = (local.goals || []).includes(g)
                return (
                  <button
                    key={g} type="button" onClick={() => toggleGoal(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                      sel
                        ? 'bg-sky-50 border-sky-300 text-sky-700 pending-halo'
                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    {sel ? '✓ ' : ''}{g}
                  </button>
                )
              })}
            </div>
          </Field>
          <Field label="Workout Timing">
            <Select value={local.timing || '__any__'} onValueChange={v => set('timing', v)}><SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent><SelectItem value="__any__">Any</SelectItem>{TIMINGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Gender">
            <Select value={local.gender || '__any__'} onValueChange={v => set('gender', v)}><SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent><SelectItem value="__any__">Any</SelectItem>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Experience Level">
            <Select value={local.level || '__any__'} onValueChange={v => set('level', v)}><SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent><SelectItem value="__any__">Any</SelectItem>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label={`Age range${(local.ageMin || local.ageMax) ? ` (${local.ageMin || 18}–${local.ageMax || 60})` : ' — any'}`}>
            <div className="flex items-center gap-2">
              <Input type="number" inputMode="numeric" min={18} max={80} value={local.ageMin || ''} onChange={e => set('ageMin', parseInt(e.target.value, 10) || 0)} placeholder="Min" className="bg-white border-slate-200 h-10 focus-visible:ring-sky-500" />
              <span className="text-slate-450 text-sm">—</span>
              <Input type="number" inputMode="numeric" min={18} max={80} value={local.ageMax || ''} onChange={e => set('ageMax', parseInt(e.target.value, 10) || 0)} placeholder="Max" className="bg-white border-slate-200 h-10 focus-visible:ring-sky-500" />
            </div>
          </Field>
          <Field label={`Maximum distance${local.maxDistance ? ` (${local.maxDistance} km)` : ' — any'}`}>
            <input
              type="range" min={0} max={50} step={5}
              value={local.maxDistance || 0}
              onChange={e => set('maxDistance', parseInt(e.target.value, 10))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium"><span>0 km</span><span>5</span><span>15</span><span>30</span><span>50+ (any)</span></div>
          </Field>
          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="vo" className="text-sm font-semibold text-slate-700">Verified users only</Label>
            <Switch id="vo" checked={local.verifiedOnly} onCheckedChange={v => set('verifiedOnly', v)} />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={() => { setLocal(blankFilters); setFilters(blankFilters); onApply?.(blankFilters); setOpen(false) }} variant="outline" className="flex-1 bg-white border-slate-200 text-slate-750 hover:bg-slate-50">Reset</Button>
            <Button onClick={() => { setFilters(local); onApply?.(local); setOpen(false) }} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-sm transition active:scale-[0.98]">Apply</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Discover() {
  const [filters, setFilters] = useState({ city: '', gym: '', goals: [], timing: '', gender: '', level: '', verifiedOnly: false, maxDistance: 0, ageMin: 0, ageMax: 0 })
  const [profiles, setProfiles] = useState(null)
  const [pagination, setPagination] = useState({ hasMore: false, page: 0, total: 0 })
  const [loadingMore, setLoadingMore] = useState(false)
  const [reportProfile, setReportProfile] = useState(null)
  const [showLocPrompt, setShowLocPrompt] = useState(false)
  const loadMoreRef = useRef(null)

  const [isOnline, setIsOnline] = useState(true)

  // 1. Sync pending requests in background when coming back online
  const syncOfflineRequests = async () => {
    try {
      const queue = JSON.parse(localStorage.getItem('trainr_offline_requests') || '[]')
      if (!queue.length) return
      
      // Clear queue first to prevent double clicks or race conditions on sync
      localStorage.setItem('trainr_offline_requests', '[]')
      
      for (const item of queue) {
        try {
          await fetch('/api/profiles/connect', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId: item.profileId }),
          })
        } catch (e) {
          // Re-queue on failure
          const currentQueue = JSON.parse(localStorage.getItem('trainr_offline_requests') || '[]')
          if (!currentQueue.some(x => x.profileId === item.profileId)) {
            currentQueue.push(item)
            localStorage.setItem('trainr_offline_requests', JSON.stringify(currentQueue))
          }
        }
      }
    } catch {}
  }

  // 2. Track connection status
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsOnline(navigator.onLine)
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineRequests()
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Internet disconnected.')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    try {
      const decided = localStorage.getItem('trainr_loc_decided')
      if (!decided) setShowLocPrompt(true)
    } catch {}
  }, [])

  const enableLocation = () => {
    if (!navigator.geolocation) { setShowLocPrompt(false); localStorage.setItem('trainr_loc_decided', '1'); return }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await fetch('/api/profile/location', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        })
        toast.success('Location set — showing nearby partners.')
        try { localStorage.setItem('trainr_loc_decided', '1') } catch {}
        setShowLocPrompt(false)
        load()
      } catch {}
    }, () => {
      toast('Using city-based matching.')
      try { localStorage.setItem('trainr_loc_decided', '1') } catch {}
      setShowLocPrompt(false)
    }, { timeout: 8000 })
  }
  const dismissLoc = () => { try { localStorage.setItem('trainr_loc_decided', '1') } catch {}; setShowLocPrompt(false) }

  const load = async (f = filters, opts = {}) => {
    const append = !!opts.append
    const pageNum = append ? (pagination.page + 1) : 0
    setLoadingMore(true)

    if (!append) {
      let hasCache = false
      try {
        const cachedStr = localStorage.getItem('trainr_cached_discover_profiles')
        if (cachedStr) {
          const cached = JSON.parse(cachedStr)
          if (cached && cached.length > 0) {
            setProfiles(cached)
            setPagination({ hasMore: true, page: 0, total: cached.length })
            hasCache = true
          }
        }
      } catch {}
      if (!hasCache) {
        setProfiles(null)
      }
    }

    // Load from local storage backup if offline
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setLoadingMore(false)
      return
    }

    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    Object.entries(f).forEach(([k, v]) => {
      if (v == null || v === '' || v === 0) return
      if (Array.isArray(v)) {
        if (v.length) params.set(k, v.join(','))
        return
      }
      params.append(k, String(v))
    })
    try {
      const res = await fetch('/api/profiles/discover?' + params.toString(), { credentials: 'include' })
      const data = await res.json()
      const nextProfiles = data.profiles || []
      setProfiles(prev => {
        const merged = append ? [...(prev || []), ...nextProfiles.filter(p => !(prev || []).some(x => x.id === p.id))] : nextProfiles
        // Cache the first page profiles locally as backup
        if (!append) {
          try { localStorage.setItem('trainr_cached_discover_profiles', JSON.stringify(merged)) } catch {}
        }
        return merged
      })
      setPagination({ hasMore: !!data.hasMore, page: pageNum, total: data.total || nextProfiles.length })
    } catch {
      if (!append && !profiles) setProfiles([])
      toast.error('Could not load Discover')
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  // Batch prefetching: when remaining card profiles are less than 3, fetch the next page in the background.
  useEffect(() => {
    if (profiles && profiles.length < 3 && pagination.hasMore && !loadingMore) {
      console.log('[Discover] Prefetching next batch of profiles (remaining count is low)...')
      load(filters, { append: true })
    }
  }, [profiles, pagination.hasMore, loadingMore, filters]) // eslint-disable-line

  const handleConnect = async (p) => {
    // Optimistic: remove the card from the feed immediately
    setProfiles(prev => (prev || []).filter(x => x.id !== p.id))

    // Handle offline connect requests queueing
    if (typeof window !== 'undefined' && !navigator.onLine) {
      try {
        const queue = JSON.parse(localStorage.getItem('trainr_offline_requests') || '[]')
        if (!queue.some(x => x.profileId === p.id)) {
          queue.push({ profileId: p.id, timestamp: Date.now() })
          localStorage.setItem('trainr_offline_requests', JSON.stringify(queue))
        }
        toast.info('Action queued. Will sync when online.')
      } catch {}
      return
    }

    try {
      const res = await fetch('/api/profiles/connect', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: p.id }),
      })
      const data = await res.json()
      if (res.status === 429 && data?.status === 'cooldown') {
        toast('You can connect again later.', { description: 'This person previously declined. Try again after the cooldown.' })
        return
      }
      if (!res.ok) {
        toast.error(data.error || 'Could not send request')
        return
      }
      if (data.status === 'accepted') {
        toast.success(`You're now connected with ${p.name || 'Unknown User'}!`, { description: 'Plan your next workout together — open chat.' })
      } else {
        toast.success(`Request sent to ${p.name || 'Unknown User'}`, { description: 'They\u2019ll be notified.' })
      }
    } catch { toast.error('Failed to send request') }
  }

  const handleSkip = async (p) => {
    setProfiles(prev => (prev || []).filter(x => x.id !== p.id))
    try { await fetch('/api/profiles/skip', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: p.id }) }) } catch {}
  }

  const submitReport = (p) => {
    setProfiles(prev => (prev || []).filter(x => x.id !== p.id))
  }

  return (
    <div className="pt-16">
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span className="text-sm font-bold text-slate-800">Discover</span>
            {profiles && <span className="text-xs text-slate-500 font-semibold">· {pagination.total || profiles.length} profiles</span>}
          </div>
          <FiltersSheet filters={filters} setFilters={setFilters} onApply={(f) => load(f)} />
        </div>
      </div>

      {showLocPrompt && (
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3 fade-up shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-4 h-4 text-sky-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-800">See partners near you</div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">Allow location for distance-based discovery. We never share your exact location.</div>
              <div className="flex gap-2 mt-3">
                <Button onClick={enableLocation} size="sm" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold h-8 text-xs">Allow location</Button>
                <Button onClick={dismissLoc} size="sm" variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs">Use city only</Button>
              </div>
            </div>
            <button onClick={dismissLoc} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-4 min-h-[calc(100vh-10rem)] flex flex-col justify-center">
        {profiles === null && (
          <div className="space-y-4">
            <div className="rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-md">
              <div className="aspect-[4/5] bg-gradient-to-br from-sky-500/5 via-slate-100 to-sky-500/2 animate-shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-1/2 rounded-md bg-slate-100 animate-shimmer" />
                <div className="h-3 w-3/4 rounded-md bg-slate-100 animate-shimmer" />
                <div className="flex gap-2 pt-2">
                  <div className="h-12 flex-1 rounded-xl bg-slate-100 animate-shimmer" />
                  <div className="h-12 flex-[2] rounded-xl bg-slate-100 animate-shimmer" />
                  <div className="h-12 flex-1 rounded-xl bg-slate-100 animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
        )}
        {profiles && profiles.length === 0 && (
          <EmptyDiscover onResetFilters={() => load({ city: '', gym: '', goals: [], timing: '', gender: '', level: '', verifiedOnly: false, maxDistance: 0, ageMin: 0, ageMax: 0 })} />
        )}
        {profiles && profiles.length > 0 && (
          <>
            <ProfileCard key={profiles[0].id} profile={profiles[0]} onLike={handleConnect} onSkip={handleSkip} onReport={setReportProfile} />
            {profiles.length > 1 && (
              <img src={getPhotoSrc(profiles[1].photos, 0)} className="hidden" aria-hidden="true" />
            )}
          </>
        )}
      </div>

      <ReportDialog
        open={!!reportProfile}
        onOpenChange={(o) => !o && setReportProfile(null)}
        profile={reportProfile}
        onDone={submitReport}
      />
    </div>
  )
}

function EmptyDiscover({ onResetFilters }) {
  const inviteFriends = () => {
    const url = 'https://trainr.in'
    const msg = `Hey! I just joined Trainr — it's a fitness accountability network where you find verified workout partners at your gym. Check it out: ${url}`
    if (navigator.share) {
      navigator.share({ title: 'Trainr', text: msg, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(msg)
      toast.success('Invite copied!', { description: 'Paste it in WhatsApp / iMessage / Insta.' })
    }
  }
  return (
    <div className="text-center py-20 fade-up max-w-sm mx-auto">
      <div className="w-20 h-20 rounded-3xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-5 text-4xl">💪</div>
      <h3 className="text-2xl font-extrabold tracking-tight text-slate-800">No workout partners nearby yet</h3>
      <p className="text-slate-500 mt-2 text-sm leading-relaxed font-medium">Be the first athlete in your area. Invite a gym buddy to join and the feed comes alive.</p>
      <div className="flex flex-col gap-2 mt-6">
        <Button onClick={inviteFriends} className="bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-full h-11 transition shadow-sm active:scale-[0.98]">
          <Send className="w-4 h-4 mr-2" /> Invite Friends
        </Button>
        <Button onClick={onResetFilters} variant="outline" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full h-11">
          <Filter className="w-4 h-4 mr-2" /> Edit Filters
        </Button>
      </div>
      <p className="text-[11px] text-slate-400 mt-6 font-semibold">We never DM your contacts. We just give you a link to share.</p>
    </div>
  )
}

function ChatsList({ matches, onOpenChat, animateLatest }) {
  return (
    <div className="space-y-3">
      {matches === null && [1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl bg-slate-100" />)}
      {matches && matches.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-sm">
          <Heart className="w-10 h-10 mx-auto text-sky-500 mb-3" />
          <p className="text-slate-500 font-medium">No connections yet. Keep discovering!</p>
        </div>
      )}
      {matches?.map((m, idx) => (
        <button
          key={m.id}
          onClick={() => onOpenChat(m)}
          className={`w-full bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] transition text-left shadow-sm ${animateLatest && idx === 0 ? 'slide-in' : ''}`}
        >
          <div className="relative">
            <Avatar className="w-14 h-14 ring-1 ring-slate-200">
              <AvatarImage src={getPhotoSrc(m.otherProfile?.photos, 0)} />
              <AvatarFallback>{getProfileName(m.otherProfile).slice(0, 1)}</AvatarFallback>
            </Avatar>
            {m.otherProfile?.online && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10B981] ring-2 ring-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 truncate">{getProfileName(m.otherProfile)}<span className="text-slate-500 font-medium">, {m.otherProfile?.age}</span></span>
              <VerificationBadge verified={m.otherProfile?.verified} />
              {m.unreadCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[#10B981] text-white text-[10px] font-extrabold flex items-center justify-center">
                  {m.unreadCount > 9 ? '9+' : m.unreadCount}
                </span>
              )}
            </div>
            {m.lastMessage ? (
              <div className={`text-xs truncate mt-0.5 ${m.unreadCount > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500 font-medium'}`}>
                {m.lastMessage.fromMe && <span className="text-slate-400">You: </span>}
                {m.lastMessage.kind === 'image' && !m.lastMessage.text
                  ? <span className="inline-flex items-center gap-1"><Camera className="w-3 h-3 text-slate-400" /> Photo</span>
                  : m.lastMessage.text}
              </div>
            ) : (
              <div className="text-xs text-slate-450 truncate mt-0.5 font-medium">{m.otherProfile?.gymName} · {m.otherProfile?.goal}</div>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      ))}
    </div>
  )
}

function RequestRow({ req, kind, onAccept, onDecline, onCancel }) {
  const p = kind === 'incoming' ? req.fromProfile : req.toProfile
  const [busy, setBusy] = useState(false)
  const wrap = async (fn) => {
    if (busy) return
    setBusy(true)
    try { await fn() } finally { setBusy(false) }
  }
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3 slide-in shadow-sm">
      <Avatar className="w-12 h-12 ring-1 ring-slate-200">
        <AvatarImage src={getPhotoSrc(p?.photos, 0)} />
        <AvatarFallback>{getProfileName(p).slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-800 truncate flex items-center gap-1.5">
          {getProfileName(p)}{p?.age ? <span className="text-slate-500 font-medium">, {p.age}</span> : null}
          <VerificationBadge verified={p?.verified} />
        </div>
        <div className="text-xs text-slate-500 font-medium truncate">{p?.gymName || '—'}{p?.city ? ` · ${p.city}` : ''}</div>
        {p?.goal && <div className="text-[11px] text-sky-600 font-semibold truncate mt-0.5">{p.goal}</div>}
      </div>
      {kind === 'incoming' ? (
        <div className="flex flex-col gap-1.5">
          <Button size="sm" onClick={() => wrap(() => onAccept(req))} disabled={busy} className="bg-sky-500 hover:bg-sky-600 text-white font-bold h-8 text-xs px-3 shadow-sm">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Accept'}
          </Button>
          <Button size="sm" onClick={() => wrap(() => onDecline(req))} disabled={busy} variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs px-3 shadow-sm">Decline</Button>
        </div>
      ) : (
        <Button size="sm" onClick={() => wrap(() => onCancel(req))} disabled={busy} variant="outline" className="bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 h-8 text-xs px-3 shadow-sm transition">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cancel'}
        </Button>
      )}
    </div>
  )
}

function RequestsTab({ onAccepted }) {
  const [tab, setTab] = useState('incoming')
  const [incoming, setIncoming] = useState(null)
  const [outgoing, setOutgoing] = useState(null)

  const loadIncoming = async () => {
    try {
      const r = await fetch('/api/requests/incoming', { credentials: 'include' })
      const d = await r.json()
      setIncoming(d.requests || [])
    } catch { setIncoming([]) }
  }
  const loadOutgoing = async () => {
    try {
      const r = await fetch('/api/requests/outgoing', { credentials: 'include' })
      const d = await r.json()
      setOutgoing(d.requests || [])
    } catch { setOutgoing([]) }
  }
  useEffect(() => { loadIncoming(); loadOutgoing() }, [])

  const accept = async (req) => {
    try {
      const r = await fetch('/api/requests/accept', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: req.id }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Could not accept')
      toast.success(`You're now connected with ${getProfileName(req.fromProfile)} 💪`, { description: 'Open chat to plan your next workout together.' })
      setIncoming(prev => (prev || []).filter(x => x.id !== req.id))
      onAccepted?.()
    } catch (e) { toast.error(e.message) }
  }
  const decline = async (req) => {
    try {
      const r = await fetch('/api/requests/decline', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: req.id }) })
      if (!r.ok) throw new Error('Could not decline')
      setIncoming(prev => (prev || []).filter(x => x.id !== req.id))
    } catch (e) { toast.error(e.message) }
  }
  const cancel = async (req) => {
    try {
      const r = await fetch('/api/requests/cancel', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: req.id }) })
      if (!r.ok) throw new Error('Could not cancel')
      setOutgoing(prev => (prev || []).filter(x => x.id !== req.id))
      toast('Request withdrawn')
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <div className="flex gap-1 bg-slate-100 border border-slate-200/60 rounded-lg p-1 mb-4 w-fit shadow-inner">
        {[
          { k: 'incoming', label: 'Incoming', count: incoming?.length },
          { k: 'sent', label: 'Sent', count: outgoing?.length },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${tab === t.k ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t.label}{typeof t.count === 'number' && t.count > 0 ? <span className="ml-1.5 text-sky-600 font-bold">{t.count}</span> : ''}
          </button>
        ))}
      </div>

      {tab === 'incoming' && (
        <div className="space-y-3">
          {incoming === null && [1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl bg-slate-100" />)}
          {incoming && incoming.length === 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-sm">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-650 font-bold">No new requests</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">When someone wants to train with you, they’ll show up here.</p>
            </div>
          )}
          {incoming?.map(req => <RequestRow key={req.id} req={req} kind="incoming" onAccept={accept} onDecline={decline} />)}
        </div>
      )}

      {tab === 'sent' && (
        <div className="space-y-3">
          {outgoing === null && [1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl bg-slate-100" />)}
          {outgoing && outgoing.length === 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-sm">
              <Send className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-650 font-bold">No pending requests sent</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Head to Discover to find your next workout partner.</p>
            </div>
          )}
          {outgoing?.map(req => <RequestRow key={req.id} req={req} kind="sent" onCancel={cancel} />)}
        </div>
      )}
    </div>
  )
}

function Connections({ onOpenChat }) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('trainr_cached_matches')
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return null
  })
  const [pendingIncomingCount, setPendingIncomingCount] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const count = localStorage.getItem('trainr_cached_pending_count')
        if (count) return parseInt(count, 10)
      } catch {}
    }
    return 0
  })
  const [tab, setTab] = useState('chats')

  const loadMatches = async () => {
    try {
      const r = await fetch('/api/matches', { credentials: 'include' })
      const d = await r.json()
      const list = d.matches || []
      setMatches(list)
      setPendingIncomingCount(d.pendingIncomingCount || 0)
      try {
        localStorage.setItem('trainr_cached_matches', JSON.stringify(list))
        localStorage.setItem('trainr_cached_pending_count', String(d.pendingIncomingCount || 0))
      } catch {}
    } catch {
      if (matches === null) setMatches([])
    }
  }
  useEffect(() => { loadMatches() }, [])

  return (
    <div className="pt-20 pb-12 max-w-2xl mx-auto px-4 md:px-6">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800">Connections</h1>
      <p className="text-slate-500 mt-1 text-sm font-medium">Mutual workout partners ready to train together.</p>

      <Tabs value={tab} onValueChange={setTab} className="w-full mt-6">
        <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-xl">
          <TabsTrigger value="chats" className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-600 font-bold rounded-lg px-4 py-2 transition">
            Chats{matches?.length ? <span className="ml-1.5 text-slate-400 font-semibold">{matches.length}</span> : null}
          </TabsTrigger>
          <TabsTrigger value="requests" className="relative data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-600 font-bold rounded-lg px-4 py-2 transition">
            Requests
            {pendingIncomingCount > 0 && (
              <span className="ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#10B981] text-white text-[10px] font-extrabold flex items-center justify-center">
                {pendingIncomingCount > 9 ? '9+' : pendingIncomingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chats" className="mt-5">
          <ChatsList matches={matches} onOpenChat={onOpenChat} animateLatest />
        </TabsContent>
        <TabsContent value="requests" className="mt-5">
          <RequestsTab onAccepted={loadMatches} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Chat({ match, currentUserId, onBack, onChatRemoved }) {
  const [messages, setMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`trainr_cached_msgs_${match.id}`)
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return []
  })
  const [otherTyping, setOtherTyping] = useState(false)
  const [text, setText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const scrollerRef = useRef(null)
  const typingTimerRef = useRef(null)
  const fileInputRef = useRef(null)

  const mergeServerMessages = (serverMessages) => {
    setMessages(prev => {
      const serverClientIds = new Set(serverMessages.map(m => m.clientId).filter(Boolean))
      const pending = prev.filter(m => m.pending && (!m.clientId || !serverClientIds.has(m.clientId)))
      const merged = [...serverMessages, ...pending].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      try {
        localStorage.setItem(`trainr_cached_msgs_${match.id}`, JSON.stringify(serverMessages))
      } catch {}
      return merged
    })
  }

  const load = async () => {
    try {
      const res = await fetch(`/api/messages?matchId=${match.id}`, { credentials: 'include' })
      const data = await res.json()
      mergeServerMessages(data.messages || [])
      setOtherTyping(!!data.otherTyping)
    } catch {}
  }
  useEffect(() => {
    load()
    const t = setInterval(load, 1000)
    return () => clearInterval(t)
  }, [match.id]) // eslint-disable-line
  useEffect(() => { scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, otherTyping])

  const pingTyping = () => {
    if (typingTimerRef.current) return
    fetch('/api/messages/typing', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: match.id }) }).catch(() => {})
    typingTimerRef.current = setTimeout(() => { typingTimerRef.current = null }, 3000)
  }

  const send = async () => {
    if (!text.trim()) return
    const t = text.trim()
    const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const pendingMessage = {
      id: clientId,
      clientId,
      matchId: match.id,
      fromUserId: currentUserId,
      text: t,
      image: null,
      kind: 'text',
      flagged: false,
      readBy: [currentUserId],
      createdAt: new Date().toISOString(),
      pending: true,
    }
    setText('')
    setMessages(prev => [...prev, pendingMessage])
    try {
      const res = await fetch('/api/messages', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: match.id, text: t, clientId }) })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) toast.error(data.error || 'Slow down')
        else toast.error(data.error || 'Failed to send')
        setMessages(prev => prev.filter(m => m.id !== clientId))
        setText(t)
        return
      }
      if (data.message?.flagged) toast.warning('Your message was flagged. Repeated violations lead to suspension.')
      setMessages(prev => prev.map(m => m.clientId === clientId ? data.message : m))
      load()
    } catch {
      setMessages(prev => prev.filter(m => m.id !== clientId))
      setText(t)
      toast.error('Failed to send')
    }
  }

  const sendImage = async (file) => {
    if (!file) return
    if (!file.type?.startsWith('image/')) { toast.error('Please pick an image file'); return }
    if (file.size > 8 * 1024 * 1024) { toast.error('Image too large. Max 8MB.'); return }
    setUploadingImage(true)
    try {
      // Firebase doc limit is 1MB, so we compress aggressively
      const dataUri = await compressImage(file, 800, 0.6)
      if (!dataUri) throw new Error('Compression failed')
      const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const pendingMessage = {
        id: clientId,
        clientId,
        matchId: match.id,
        fromUserId: currentUserId,
        text: '',
        image: dataUri,
        kind: 'image',
        flagged: false,
        readBy: [currentUserId],
        createdAt: new Date().toISOString(),
        pending: true,
      }
      setMessages(prev => [...prev, pendingMessage])
      
      const res = await fetch('/api/messages', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, image: dataUri, clientId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) toast.error(data.error || 'Slow down')
        else toast.error(data.error || 'Failed to send photo')
        setMessages(prev => prev.filter(m => m.id !== clientId))
        return
      }
      setMessages(prev => prev.map(m => m.clientId === clientId ? data.message : m))
      load()
    } catch (e) {
      toast.error(e?.message || 'Could not send photo')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImagePick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) sendImage(file)
  }

  const blockUser = async () => {
    try {
      await fetch('/api/blocks', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: match.otherProfile?.id }) })
      toast.success(`${getProfileName(match.otherProfile)} blocked`, { description: 'Chat removed. They can’t contact you.' })
      onChatRemoved?.()
    } catch { toast.error('Could not block') }
  }

  const removeConnection = async () => {
    try {
      const res = await fetch('/api/matches/remove', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove connection')
      }
      toast.success('Connection removed', { description: 'This chat has been removed.' })
      onChatRemoved?.()
    } catch (e) {
      toast.error(e.message || 'Could not remove connection')
    }
  }

  const myLastMsg = [...messages].reverse().find(m => m.fromUserId === currentUserId)
  const otherUserId = match.userA === currentUserId ? match.userB : match.userA
  const myLastSeen = myLastMsg && Array.isArray(myLastMsg.readBy) && myLastMsg.readBy.includes(otherUserId)
  const otherActive = formatLastActive(match.otherProfile?.lastActiveAt)

  return (
    <div className="h-dvh flex flex-col bg-slate-50">
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full text-slate-650 hover:bg-slate-50"><ArrowLeft className="w-5 h-5" /></Button>
          <Avatar className="w-9 h-9 ring-1 ring-slate-100"><AvatarImage src={getPhotoSrc(match.otherProfile?.photos, 0)} /><AvatarFallback>{getProfileName(match.otherProfile).slice(0, 1)}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-slate-800 flex items-center gap-1.5 truncate">{getProfileName(match.otherProfile)} <VerificationBadge verified={match.otherProfile?.verified} /></div>
            <div className="text-xs font-semibold">
              {otherTyping ? <span className="text-sky-500">typing…</span> : (otherActive.online ? <span className="text-emerald-500">Online now</span> : <span className="text-slate-450">{otherActive.text || 'Offline'}</span>)}
            </div>
          </div>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition" title="Options">
                <span className="flex flex-col gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-white border-slate-200 rounded-t-3xl max-h-[60vh]">
              <SheetHeader><SheetTitle className="text-slate-800 font-extrabold text-xl">Options</SheetTitle></SheetHeader>
              <div className="space-y-2 mt-4 max-w-md mx-auto">
                <button
                  onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-250 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-amber-600" /></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Report user</div>
                    <div className="text-xs text-slate-500 font-medium">Categorise the issue. We review within 24h.</div>
                  </div>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setConfirmBlock(true) }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-200 transition text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center"><Lock className="w-4 h-4 text-red-500" /></div>
                  <div>
                    <div className="text-sm font-bold text-red-650 font-semibold">Block user</div>
                    <div className="text-xs text-slate-500 font-medium">Removes chat. They can’t see or contact you.</div>
                  </div>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setConfirmRemove(true) }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-200 transition text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center"><X className="w-4 h-4 text-red-500" /></div>
                  <div>
                    <div className="text-sm font-bold text-red-650 font-semibold">Remove connection</div>
                    <div className="text-xs text-slate-500 font-medium">Deletes match & messages. They can be matched again.</div>
                  </div>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-2">
          {messages.length === 0 && (
            <div className="text-center text-sm text-slate-500 font-medium py-12">{`You're connected! Say hi 👋 — coordinate your first session.`}</div>
          )}
          {messages.map(m => {
            const mine = m.fromUserId === currentUserId
            const hasImage = !!m.image
            const hasText = !!(m.text && m.text.trim())
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl overflow-hidden ${mine ? 'bg-sky-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'} ${m.flagged ? 'opacity-70 ring-1 ring-red-500/20' : ''} ${hasImage ? 'p-1' : 'px-4 py-2.5'} slide-in`}>
                  {hasImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(m.image)}
                      className="block w-full max-w-[260px] rounded-xl overflow-hidden bg-slate-100/50 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                      aria-label="Open photo"
                    >
                      <img
                        src={m.image}
                        alt="Shared photo"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto max-h-[320px] object-cover"
                      />
                    </button>
                  )}
                  {hasText && (
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${hasImage ? 'px-3 pt-2 pb-0.5' : ''}`}>{m.text}</div>
                  )}
                  <div className={`text-[10px] ${hasImage ? 'px-3 pb-1.5 pt-0.5' : 'mt-1'} ${mine ? 'text-sky-100' : 'text-slate-400'} font-medium`}>
                    {m.pending ? 'Sending...' : new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}
          {otherTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '240ms' }} />
                </div>
              </div>
            </div>
          )}
          {myLastMsg && (
            <div className="flex justify-end">
              <div className="text-[10px] text-slate-400 font-semibold pr-1">{myLastSeen ? 'Seen' : 'Sent'}</div>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagePick}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            variant="outline"
            size="icon"
            className="bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-sky-500 text-slate-500 rounded-full shrink-0 shadow-sm"
            title="Send photo"
            aria-label="Send photo"
          >
            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </Button>
          <Input
            value={text}
            onChange={e => { setText(e.target.value); pingTyping() }}
            onKeyDown={e => e.key === 'Enter' && send()}
            maxLength={1000}
            placeholder={uploadingImage ? 'Uploading photo…' : 'Type a message...'}
            disabled={uploadingImage}
            className="bg-slate-50 border border-slate-200/80 focus-visible:ring-sky-500 text-slate-800"
          />
          <Button onClick={send} disabled={!text.trim() || uploadingImage} className="bg-sky-500 hover:bg-sky-600 text-white rounded-full disabled:opacity-50 transition shadow-sm active:scale-[0.98]" size="icon"><Send className="w-4 h-4 text-white" /></Button>
        </div>
      </div>

      {/* Full-image preview */}
      <Dialog open={!!previewImage} onOpenChange={(o) => !o && setPreviewImage(null)}>
        <DialogContent className="bg-slate-900/95 border-slate-800 max-w-2xl p-2 sm:p-3">
          <DialogHeader className="sr-only"><DialogTitle>Photo</DialogTitle></DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Photo preview" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmBlock} onOpenChange={setConfirmBlock}>
        <DialogContent className="bg-white border-slate-200 max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-650 font-bold"><Lock className="w-5 h-5 text-red-500" /> Block {getProfileName(match.otherProfile)}?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">This will <strong className="text-slate-800">delete this conversation</strong> and prevent future contact. You both disappear from each other’s feeds.</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => setConfirmBlock(false)} variant="outline" className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl">Cancel</Button>
            <Button onClick={async () => { await blockUser(); setConfirmBlock(false) }} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-sm transition active:scale-[0.98]">Block</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="bg-white border-slate-200 max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-650 font-bold"><X className="w-5 h-5 text-red-500" /> Remove Connection?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">This will <strong className="text-slate-800">delete this connection and all messages</strong>. Unlike blocking, you may encounter each other again in Discover.</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => setConfirmRemove(false)} variant="outline" className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl">Cancel</Button>
            <Button onClick={async () => { await removeConnection(); setConfirmRemove(false) }} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-sm transition active:scale-[0.98]">Remove</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        profile={match.otherProfile}
        onDone={() => onChatRemoved?.()}
      />
    </div>
  )
}

function SettingsView({ user, profile, onEditProfile, onLogout, onProfileUpdated, onOpenPremium, onAccountDeleted }) {
  const [showSelfie, setShowSelfie] = useState(false)
  const [requesting, setRequesting] = useState(null)
  const [pushState, setPushState] = useState('idle') // idle | enabled | denied | unsupported
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [completion, setCompletion] = useState(null)

  useEffect(() => {
    if (typeof Notification === 'undefined') { setPushState('unsupported'); return }
    if (Notification.permission === 'granted') setPushState('enabled')
    else if (Notification.permission === 'denied') setPushState('denied')
  }, [])

  useEffect(() => {
    fetch('/api/profile/completion', { credentials: 'include' })
      .then(r => r.json()).then(d => setCompletion(d.completion || null))
      .catch(() => {})
  }, [profile])

  const enablePush = async () => {
    try {
      const mod = await import('@/lib/client/push')
      const result = await mod.subscribeForPush()
      if (result.ok) {
        setPushState('enabled')
        if (result.mocked) toast.info('Push subscribed (server delivery is MOCKED until VAPID keys are configured).')
        else toast.success('Push notifications enabled!')
      } else {
        if (result.reason === 'denied') { setPushState('denied'); toast.error('Push permission denied. Enable in browser settings.') }
        else if (result.reason === 'unsupported') toast.error('Push not supported on this browser.')
        else toast.error(result.reason || 'Could not enable push')
      }
    } catch (e) { toast.error(e.message) }
  }

  const requestVerify = async (type) => {
    setRequesting(type)
    try {
      const res = await fetch('/api/profile/verify-request', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (data.pending) toast.success(`${type === 'gym' ? 'Gym' : 'Instagram'} verification submitted — under review`)
      else toast.success(`${type === 'gym' ? 'Gym' : 'Instagram'} verification approved`)
      onProfileUpdated?.(data.profile)
    } catch (e) { toast.error(e.message) } finally { setRequesting(null) }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Account deleted', { description: 'All your data was removed.' })
      onAccountDeleted?.()
    } catch (e) { toast.error(e.message); setDeleting(false) }
  }

  const VerifyRow = ({ type, label, icon: Ic }) => {
    const status = profile?.verificationRequests?.[type] || 'none'
    const verified = profile?.verifications?.[type]
    return (
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2"><Ic className="w-4 h-4 text-slate-500" /> <span className="text-sm font-medium text-slate-700">{label}</span></div>
        {verified ? (
          <Badge className="bg-sky-50 text-sky-700 border-sky-200">Verified</Badge>
        ) : status === 'pending' ? (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In review</Badge>
        ) : status === 'rejected' ? (
          type === 'selfie' ? (
            <Button size="sm" variant="outline" onClick={() => setShowSelfie(true)} className="bg-red-50 border-red-200 text-red-650 hover:bg-red-100 h-8 text-xs shadow-sm font-semibold transition">
              <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={requesting === type} onClick={() => requestVerify(type)} className="bg-red-50 border-red-200 text-red-650 hover:bg-red-100 h-8 text-xs shadow-sm font-semibold transition">
              <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
            </Button>
          )
        ) : type === 'selfie' ? (
          <Button size="sm" variant="outline" onClick={() => setShowSelfie(true)} className="bg-white border-slate-200 text-slate-750 hover:bg-slate-50 h-8 text-xs shadow-sm">
            <Camera className="w-3 h-3 mr-1.5" /> Verify
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled={requesting === type} onClick={() => requestVerify(type)} className="bg-white border-slate-200 text-slate-750 hover:bg-slate-50 h-8 text-xs shadow-sm">
            {requesting === type ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Request</>}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="pt-20 pb-12 max-w-2xl mx-auto px-4 md:px-6">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800">Settings</h1>
      <div className="mt-6 space-y-3">
        <Card className="bg-white border-slate-200/80 p-5 flex items-center gap-4 rounded-2xl shadow-sm">
          <Avatar className="w-14 h-14"><AvatarImage src={getPhotoSrc(profile?.photos, 0, user.picture)} /><AvatarFallback>{user.name?.slice(0,1)}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 truncate">{profile?.name || user.name || 'Unknown User'} <VerificationBadge verified={profile?.verified} /></div>
            <div className="text-sm text-slate-500 font-semibold truncate">{user.email}</div>
          </div>
          <div className="flex items-center gap-2">
            {!profile?.verified && (
              <Button 
                onClick={() => setShowSelfie(true)} 
                variant="outline" 
                className="border-sky-500 text-sky-650 hover:bg-sky-50 flex items-center gap-1.5 h-9 text-xs font-semibold rounded-xl shadow-sm transition"
              >
                <Shield className="w-3.5 h-3.5" /> Verify Identity
              </Button>
            )}
            <Button onClick={onEditProfile} variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm h-9 rounded-xl text-xs font-semibold">Edit</Button>
          </div>
        </Card>

        {/* Profile completion progress */}
        {completion && !completion.complete && (
          <Card className="bg-white border border-sky-200 p-5 bg-gradient-to-br from-sky-500/[0.03] to-transparent rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-slate-800">Your profile is {completion.score}% complete</div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">Finish to be visible in Discover.</div>
              </div>
              <div className="text-2xl font-black text-sky-600">{completion.score}%</div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sky-500 to-sky-650 transition-all duration-500" style={{ width: `${completion.score}%` }} />
            </div>
            {completion.missing?.length > 0 && (
              <div className="mt-3 space-y-1">
                {completion.missing.slice(0, 4).map(m => (
                  <div key={m.key} className="text-xs text-slate-600 font-medium flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-sky-500" /> {m.label}
                  </div>
                ))}
              </div>
            )}
            <Button onClick={onEditProfile} className="mt-4 bg-sky-500 hover:bg-sky-600 text-white font-bold w-full h-10 shadow-sm transition active:scale-[0.98]">
              Complete profile
            </Button>
          </Card>
        )}

        {/* Premium card — hidden behind env flag for real-user beta */}
        {PREMIUM_ENABLED && (
          <Card className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 flex items-center gap-2">Trainr Pro {user.tier === 'pro' && <Badge className="bg-amber-50 text-amber-700 border-amber-200">Active</Badge>}</div>
                <div className="text-xs text-slate-500 font-medium leading-relaxed">Unlimited connections, advanced filters, priority placement</div>
              </div>
              <Button onClick={onOpenPremium} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm transition">
                {user.tier === 'pro' ? 'Manage' : 'Upgrade'}
              </Button>
            </div>
          </Card>
        )}

        <Card className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">Verification</h3>
            {profile?.verified && <Badge className="bg-sky-50 text-sky-700 border-sky-200">Verified ✓</Badge>}
          </div>
          <div className="space-y-2">
            <VerifyRow type="selfie" label="Selfie verification" icon={Camera} />
            <VerifyRow type="instagram" label="Instagram linked" icon={Instagram} />
            <VerifyRow type="gym" label="Verified gym member" icon={Dumbbell} />
          </div>
          <p className="text-xs text-slate-400 mt-3 font-semibold">Verified profiles get a blue badge and higher visibility.</p>
        </Card>

        {/* Push notifications card */}
        <Card className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-sky-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">Push notifications</div>
              <div className="text-xs text-slate-500 leading-normal font-medium">
                {pushState === 'enabled' && 'Enabled · mock mode active'}
                {pushState === 'denied' && 'Denied · enable in browser settings'}
                {pushState === 'unsupported' && 'Not supported on this browser'}
                {pushState === 'idle' && 'Get notified about connections and messages'}
              </div>
            </div>
            {pushState === 'idle' && (
              <Button onClick={enablePush} variant="outline" className="bg-white border-slate-200 text-slate-750 hover:bg-slate-50 shadow-sm">Enable</Button>
            )}
            {pushState === 'enabled' && (
              <Badge className="bg-sky-50 text-sky-700 border-sky-200">On</Badge>
            )}
          </div>
        </Card>

        <button onClick={onLogout} className="w-full bg-white border border-slate-200 p-5 flex items-center gap-3 hover:bg-slate-50 transition text-slate-700 font-bold rounded-2xl shadow-sm">
          <LogOut className="w-5 h-5 text-slate-500" /> <span>Log out</span>
        </button>

        {/* Danger zone */}
        <div className="pt-2">
          <div className="text-[10px] uppercase tracking-wider text-red-500 font-bold mb-2 px-1">Danger zone</div>
          <button onClick={() => setConfirmDelete(true)} className="w-full rounded-2xl p-5 flex items-center gap-3 bg-red-50/50 border border-red-200 hover:bg-red-50 hover:border-red-300 transition text-red-650 font-semibold shadow-sm active:scale-[0.99]">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div className="flex-1 text-left">
              <div className="font-bold text-red-650">Delete account</div>
              <div className="text-xs text-red-500/80 font-medium">Permanently delete your profile, photos and chats.</div>
            </div>
          </button>
        </div>
      </div>

      {/* Face Verify - Auto Verified */}
      <SelfieVerifyDialog 
        open={showSelfie} 
        onOpenChange={setShowSelfie} 
        onVerified={(p) => {
          onProfileUpdated?.(p)
          if (p?.verified) {
            toast.success("🎉 You're now verified!")
          }
        }} 
        profile={profile} 
      />

      {/* Delete account confirmation */}
      <Dialog open={confirmDelete} onOpenChange={(o) => !deleting && setConfirmDelete(o)}>
        <DialogContent className="bg-white border-slate-200 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-650 font-bold"><AlertTriangle className="w-5 h-5 text-red-500" /> Delete account?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-650 leading-relaxed font-medium">
            This will <strong className="text-slate-800">permanently delete</strong>:
          </p>
          <ul className="text-xs text-slate-500 font-semibold space-y-1.5 pl-1">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Your profile and all uploaded photos</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Your matches, chats and messages</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Your notifications and verification state</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Your account and active sessions</li>
          </ul>
          <p className="text-xs text-red-600 font-bold mt-1">This action cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => setConfirmDelete(false)} disabled={deleting} variant="outline" className="flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl">Cancel</Button>
            <Button onClick={deleteAccount} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-sm transition active:scale-[0.98]">
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</> : 'Yes, delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ForbiddenView({ onBack }) {
  return (
    <div className="pt-24 max-w-lg mx-auto px-4 text-center">
      <Lock className="w-10 h-10 mx-auto text-slate-400" />
      <h2 className="text-2xl font-extrabold mt-4 text-slate-800">Restricted area</h2>
      <p className="text-sm text-slate-500 mt-1 font-semibold">This page is for Trainr admins only.</p>
      <Button onClick={onBack} className="mt-6 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-full shadow-sm transition active:scale-[0.98]">Back to Discover</Button>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [view, setView] = useState('landing')
  const [loading, setLoading] = useState(true)
  const [loadingTooLong, setLoadingTooLong] = useState(false)
  const [activeChat, setActiveChat] = useState(null)
  const [showPremium, setShowPremium] = useState(false)
  const [pendingIncomingCount, setPendingIncomingCount] = useState(0)

  // Phone auth states
  const [authModal, setAuthModal] = useState({ open: false, tab: 'phone' })
  const [authStep, setAuthStep] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // Lightweight polling for incoming-request count (badge on Connections nav).
  // Runs only when authenticated; 30s interval is enough for non-realtime UX.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    const tick = async () => {
      try {
        const r = await fetch('/api/matches', { credentials: 'include' })
        const d = await r.json()
        if (!cancelled) setPendingIncomingCount(d.pendingIncomingCount || 0)
      } catch {}
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [user])

  useEffect(() => {
    const handleOpenAuth = async (e) => {
      const tab = e.detail?.tab || 'phone'
      if (tab === 'google') {
        setLoading(true)
        try {
          const data = await loginWithFirebaseGoogle()
          setUser(data.user)
          setProfile(data.profile)
          try {
            localStorage.setItem('trainr_logged_in', '1')
            localStorage.setItem('trainr_cached_user', JSON.stringify(data.user))
            localStorage.setItem('trainr_cached_profile', JSON.stringify(data.profile || null))
          } catch {}
          setView(data.profile ? 'discover' : 'profile-edit')
          toast.success(`Welcome ${data.user.name?.split(' ')[0] || ''}!`)
        } catch (err) {
          console.error('[Auth] Google Login Error:', err)
          toast.error(AUTH_ERROR_MESSAGE)
        } finally {
          setLoading(false)
        }
      } else {
        setAuthModal({ open: true, tab: 'phone' })
        setAuthStep(1)
      }
    }
    window.addEventListener('trainr:open-auth', handleOpenAuth)
    return () => window.removeEventListener('trainr:open-auth', handleOpenAuth)
  }, [])

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) return
    setSendingOtp(true)
    try {
      const result = await sendFirebasePhoneOtp(phoneNumber.trim(), 'firebase-recaptcha')
      setConfirmationResult(result)
      setAuthStep(2)
      toast.success('Verification code sent!')
    } catch (e) {
      console.error('[Auth] Failed to send OTP:', e)
      toast.error(OTP_SEND_ERROR_MESSAGE)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!confirmationResult || (otp.length !== 4 && otp.length !== 6)) return
    setVerifyingOtp(true)
    try {
      const data = await confirmFirebasePhoneOtp(confirmationResult, otp)
      setUser(data.user)
      setProfile(data.profile)
      try {
        localStorage.setItem('trainr_logged_in', '1')
        localStorage.setItem('trainr_cached_user', JSON.stringify(data.user))
        localStorage.setItem('trainr_cached_profile', JSON.stringify(data.profile || null))
      } catch {}
      setView(data.profile ? 'discover' : 'profile-edit')
      setAuthModal({ open: false, tab: 'phone' })
      setAuthStep(1)
      setPhoneNumber('')
      setOtp('')
      toast.success(`Welcome ${data.user.name?.split(' ')[0] || ''}!`)
    } catch (e) {
      console.error('[Auth] Failed to verify OTP:', e)
      toast.error(OTP_VERIFY_ERROR_MESSAGE)
    } finally {
      setVerifyingOtp(false)
    }
  }

  // Agent 1 - Auth Fixed: session handling with timeout, error recovery, and debug logging
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('session_id=')) {
      const sessionId = new URLSearchParams(hash.substring(1)).get('session_id')
      console.log('[Auth] session_id found in URL hash:', sessionId)
      window.history.replaceState({}, '', window.location.pathname)
      const controller = new AbortController()
      const timeout = setTimeout(() => {
        console.warn('[Auth] Session API timed out after 15s — aborting')
        controller.abort()
      }, 15000)
      ;(async () => {
        try {
          console.log('[Auth] Calling /api/auth/session...')
          const res = await fetch('/api/auth/session', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
            signal: controller.signal,
          })
          clearTimeout(timeout)
          const data = await res.json()
          console.log('[Auth] Session API response:', res.status, data.user?.email || 'no user')
          if (!res.ok) throw new Error(data.error || 'Auth failed')
          setUser(data.user)
          try {
            localStorage.setItem('trainr_logged_in', '1')
            localStorage.setItem('trainr_cached_user', JSON.stringify(data.user))
            localStorage.setItem('trainr_cached_profile', JSON.stringify(data.profile || null))
          } catch {}
          setView(data.hasProfile ? 'discover' : 'profile-edit')
          toast.success(`Welcome ${data.user.name?.split(' ')[0]}!`)
          try {
            const meRes = await fetch('/api/auth/me', { credentials: 'include' })
            const me = await meRes.json()
            if (me.profile) setProfile(me.profile)
            console.log('[Auth] Profile loaded:', !!me.profile)
          } catch (meErr) {
            console.warn('[Auth] Failed to load profile after session:', meErr.message)
          }
        } catch (e) {
          clearTimeout(timeout)
          console.error('[Auth] Session flow error:', e)
          toast.error(e.name === 'AbortError' ? 'Login timed out. Please try again.' : AUTH_ERROR_MESSAGE)
          setView('landing')
        } finally {
          setLoading(false)
        }
      })()
      return
    }
    // No session_id hash — check for existing cookie session
    try {
      if (localStorage.getItem('trainr_logged_in') !== '1') {
        console.log('[Auth] No session_id or login flag — showing landing immediately')
        setLoading(false)
        setView('landing')
        return
      }
      // Optimistic offline hydration: restore UI instantly from cache
      const cachedUser = localStorage.getItem('trainr_cached_user')
      const cachedProfile = localStorage.getItem('trainr_cached_profile')
      const savedView = localStorage.getItem('trainr_current_view')
      const savedChat = localStorage.getItem('trainr_active_chat')
      if (cachedUser) {
        setUser(JSON.parse(cachedUser))
        if (cachedProfile && cachedProfile !== 'null') setProfile(JSON.parse(cachedProfile))
        
        let initialView = cachedProfile && cachedProfile !== 'null' ? 'discover' : 'profile-edit'
        if (savedView && ['discover', 'matches', 'profile-edit', 'admin', 'settings'].includes(savedView)) {
          initialView = savedView
        }
        if (savedChat && savedChat !== 'null') {
          try {
            setActiveChat(JSON.parse(savedChat))
            initialView = 'chat'
          } catch {}
        }
        setView(initialView)
        setLoading(false)
      }
    } catch {}
    
    console.log('[Auth] Login flag found, checking /api/auth/me...')
    const meController = new AbortController()
    const meTimeout = setTimeout(() => {
      console.warn('[Auth] /api/auth/me timed out after 15s — aborting')
      meController.abort()
    }, 15000)
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', signal: meController.signal })
        clearTimeout(meTimeout)
        const data = await res.json()
        if (data.user) {
          console.log('[Auth] Existing session found for:', data.user.email)
          setUser(data.user)
          setProfile(data.profile)
          try {
            localStorage.setItem('trainr_logged_in', '1')
            localStorage.setItem('trainr_cached_user', JSON.stringify(data.user))
            localStorage.setItem('trainr_cached_profile', JSON.stringify(data.profile || null))
          } catch {}
          
          const savedView = localStorage.getItem('trainr_current_view')
          const savedChat = localStorage.getItem('trainr_active_chat')
          if (savedChat && savedChat !== 'null') {
            try {
              setActiveChat(JSON.parse(savedChat))
              setView('chat')
            } catch {}
          } else if (savedView && ['discover', 'matches', 'profile-edit', 'admin', 'settings'].includes(savedView)) {
            setView(savedView)
          } else {
            setView(data.profile ? 'discover' : 'profile-edit')
          }
        } else {
          console.log('[Auth] No existing session')
          try {
            localStorage.removeItem('trainr_logged_in')
            localStorage.removeItem('trainr_cached_user')
            localStorage.removeItem('trainr_cached_profile')
            localStorage.removeItem('trainr_current_view')
            localStorage.removeItem('trainr_active_chat')
          } catch {}
          setUser(null)
          setProfile(null)
          setView('landing')
        }
      } catch (e) {
        clearTimeout(meTimeout)
        console.warn('[Auth] /api/auth/me failed:', e.message)
      }
      setLoading(false)
    })()
  }, [])

  // Auto-persist current view & active chat on any changes
  useEffect(() => {
    if (view && view !== 'landing') {
      try {
        localStorage.setItem('trainr_current_view', view)
        if (view === 'chat' && activeChat) {
          localStorage.setItem('trainr_active_chat', JSON.stringify(activeChat))
        } else if (view !== 'chat') {
          localStorage.removeItem('trainr_active_chat')
        }
      } catch {}
    }
  }, [view, activeChat])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    try {
      localStorage.removeItem('trainr_logged_in')
      localStorage.removeItem('trainr_cached_user')
      localStorage.removeItem('trainr_cached_profile')
      localStorage.removeItem('trainr_current_view')
      localStorage.removeItem('trainr_active_chat')
      localStorage.removeItem('trainr_cached_matches')
      localStorage.removeItem('trainr_cached_pending_count')
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('trainr_cached_msgs_')) {
          localStorage.removeItem(key)
          i--
        }
      }
    } catch {}
    setUser(null); setProfile(null); setView('landing')
    toast.success('Logged out')
  }

  const handleProfileSaved = (p) => {
    try { localStorage.setItem('trainr_cached_profile', JSON.stringify(p)) } catch {}
    setProfile(p); setView('discover')
  }
  const handlePremiumUpgraded = (data) => {
    setUser(u => {
      const nextU = u ? { ...u, tier: data.tier } : u
      try { localStorage.setItem('trainr_cached_user', JSON.stringify(nextU)) } catch {}
      return nextU
    })
  }
  const handleAccountDeleted = () => {
    try {
      localStorage.removeItem('trainr_logged_in')
      localStorage.removeItem('trainr_cached_user')
      localStorage.removeItem('trainr_cached_profile')
      localStorage.removeItem('trainr_current_view')
      localStorage.removeItem('trainr_active_chat')
      localStorage.removeItem('trainr_cached_matches')
      localStorage.removeItem('trainr_cached_pending_count')
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('trainr_cached_msgs_')) {
          localStorage.removeItem(key)
          i--
        }
      }
    } catch {}
    setUser(null); setProfile(null); setActiveChat(null); setView('landing')
  }
  const handleChatRemoved = () => { setActiveChat(null); setView('matches') }

  // Loading screen timeout — show retry button after 10 seconds
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setLoadingTooLong(true), 10000)
    return () => clearTimeout(t)
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
            <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" width={56} height={56} />
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
            <span className="tracking-wide">Loading Trainr</span>
          </div>
          {loadingTooLong && (
            <button
              onClick={() => { setLoading(false); setView('landing'); setLoadingTooLong(false) }}
              className="mt-2 px-5 py-2 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition active:scale-[0.98]"
            >
              Taking too long? Tap to retry
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {view !== 'chat' && (
        <Navbar user={user} profile={profile} view={view} setView={setView} onOpenPremium={() => setShowPremium(true)} pendingIncomingCount={pendingIncomingCount} />
      )}
      {!user && view === 'landing' && <Landing onNav={setView} />}
      {!user && view === 'about' && <AboutView onNav={setView} />}
      {!user && view === 'privacy' && <PrivacyView onNav={setView} />}
      {!user && view === 'contact' && <ContactView onNav={setView} />}
      {user && view === 'profile-edit' && <ProfileEditor user={user} profile={profile} onSaved={handleProfileSaved} />}
      {user && view === 'discover' && (profile ? <Discover /> : <ProfileEditor user={user} profile={null} onSaved={handleProfileSaved} />)}
      {user && view === 'matches' && <Connections onOpenChat={(m) => { setActiveChat(m); setView('chat') }} />}
      {user && view === 'chat' && activeChat && <Chat match={activeChat} currentUserId={user.id} onBack={() => { setActiveChat(null); setView('matches') }} onChatRemoved={handleChatRemoved} />}
      {user && view === 'settings' && <SettingsView user={user} profile={profile} onEditProfile={() => setView('profile-edit')} onLogout={handleLogout} onProfileUpdated={(p) => setProfile(p)} onOpenPremium={() => setShowPremium(true)} onAccountDeleted={handleAccountDeleted} />}
      {user && view === 'admin' && (user.isAdmin ? <AdminView /> : <ForbiddenView onBack={() => setView('discover')} />)}

      {user && PREMIUM_ENABLED && <PremiumDialog open={showPremium} onOpenChange={setShowPremium} onUpgraded={handlePremiumUpgraded} />}

      <Dialog open={authModal.open} onOpenChange={(o) => !o && setAuthModal({ open: false, tab: 'phone' })}>
        <DialogContent className="bg-white border-slate-200 max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-800">Phone Authentication</DialogTitle>
          </DialogHeader>
          
          {authStep === 1 ? (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-slate-550 leading-relaxed font-semibold">Enter your phone number (including country code, e.g. +91 9999999999) to receive a verification code.</p>
              <div className="space-y-1.5">
                <Label htmlFor="phone-input" className="text-xs font-bold text-slate-700">Phone Number</Label>
                <Input
                  id="phone-input"
                  type="tel"
                  placeholder="+91 XXXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-slate-50 border border-slate-200/80 focus-visible:ring-sky-500 text-slate-800"
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={sendingOtp || !phoneNumber.trim()}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-11 transition active:scale-[0.98]"
              >
                {sendingOtp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…</> : 'Send OTP'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-slate-550 leading-relaxed font-semibold">We sent a 6-digit code to <strong className="text-slate-800">{phoneNumber}</strong>. Enter it below to verify.</p>
              <div className="space-y-1.5">
                <Label htmlFor="otp-input" className="text-xs font-bold text-slate-700">6-Digit Code</Label>
                <Input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="bg-slate-50 border border-slate-200/80 focus-visible:ring-sky-500 text-center tracking-widest text-lg font-bold text-slate-800"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setAuthStep(1)}
                  variant="outline"
                  className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-11"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otp.length !== 6}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-11 transition active:scale-[0.98]"
                >
                  {verifyingOtp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</> : 'Verify'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div id="firebase-recaptcha" className="hidden" />
    </div>
  )
}

export default App
