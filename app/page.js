'use client'

import { useEffect, useState, useRef } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Dumbbell, MapPin, Clock, Target, MessageCircle, Heart, X, ChevronRight,
  Sparkles, Users, Lock, AlertTriangle, Instagram, Send, Filter, ArrowLeft, LogOut,
  Flame, ArrowRight, Loader2, Camera, Bell, Navigation, Zap, Crown, ChevronLeft, Check, RefreshCw,
} from 'lucide-react'

// Shared constants & utilities
import { LOGO, INSTAGRAM_URL, GOALS, TIMINGS, LEVELS, GENDERS, CITIES } from '@/lib/client/constants'
import { loginWithGoogle, compressImage, formatLastActive } from '@/lib/client/utils'

// Reusable components
import SmartImg from '@/components/app/SmartImg'
import VerificationBadge from '@/components/app/VerificationBadge'
import NotificationBell from '@/components/app/NotificationBell'

// Static / route-style views
import Landing from '@/components/views/Landing'
import AboutView from '@/components/views/AboutView'
import PrivacyView from '@/components/views/PrivacyView'
import ContactView from '@/components/views/ContactView'
import SelfieVerifyDialog from '@/components/views/SelfieVerifyDialog'
import AdminView from '@/components/views/AdminView'
import PremiumDialog from '@/components/views/PremiumDialog'
import ReportDialog from '@/components/views/ReportDialog'

// Premium UI is hidden by default — flip NEXT_PUBLIC_PREMIUM_ENABLED=true to expose Pro CTA + Settings card.
const PREMIUM_ENABLED = process.env.NEXT_PUBLIC_PREMIUM_ENABLED === 'true'

function Navbar({ user, view, setView, onOpenPremium }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <button onClick={() => setView(user ? 'discover' : 'landing')} className="flex items-center gap-2 group">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden bg-black border border-[#00ff88]/25 group-hover:border-[#00ff88]/50 transition">
            <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" loading="eager" decoding="async" />
          </div>
          <span className="text-lg md:text-xl font-extrabold tracking-tight">Trainr</span>
        </button>
        {user ? (
          <nav className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setView('discover')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${view === 'discover' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>Discover</button>
            <button onClick={() => setView('matches')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${view === 'matches' || view === 'chat' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>Connections</button>
            <NotificationBell onNavigate={setView} />
            {user.tier !== 'pro' && PREMIUM_ENABLED && (
              <button onClick={onOpenPremium} title="Trainr Pro" className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-amber-400/10 hover:bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold transition">
                <Crown className="w-3.5 h-3.5" /> Pro
              </button>
            )}
            {user.isAdmin && (
              <button onClick={() => setView('admin')} title="Admin" className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${view === 'admin' ? 'bg-[#00ff88]/15 text-[#00ff88]' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Crown className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setView('settings')} className="ml-1 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition overflow-hidden ring-1 ring-white/10 hover:ring-[#00ff88]/40">
              <Avatar className="w-9 h-9">
                <AvatarImage src={user.picture} />
                <AvatarFallback className="bg-[#00ff88]/20 text-[#00ff88] text-xs font-semibold">{(user.name || 'U').slice(0,1)}</AvatarFallback>
              </Avatar>
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-2 md:gap-3">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" title="Follow @trainr.in" className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center text-white/60 hover:text-[#00ff88] hover:bg-white/5 transition">
              <Instagram className="w-4 h-4" />
            </a>
            <button onClick={() => setView('about')} className="hidden md:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition">About</button>
            <button onClick={() => setView('contact')} className="hidden md:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition">Contact</button>
            <Button onClick={loginWithGoogle} className="bg-[#00ff88] hover:bg-[#00cc6a] active:scale-[0.98] text-black font-semibold rounded-full px-4 md:px-5 h-9 md:h-10 transition">Get Started</Button>
          </div>
        )}
      </div>
    </header>
  )
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-white/50">{label}</Label>{children}</div>
}

function ProfileEditor({ user, profile, onSaved }) {
  const isEditMode = !!profile
  const totalSteps = 7
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: profile?.name || user?.name || '',
    age: profile?.age || '',
    gender: profile?.gender || '',
    city: profile?.city || '',
    gymName: profile?.gymName || '',
    level: profile?.level || '',
    goal: profile?.goal || '',
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
    const file = e.target.files?.[0]
    if (!file) return
    if (form.photos.length >= 5) { toast.error('Maximum 5 photos'); return }
    compressImage(file, 1080, 0.78).then(dataUrl => {
      update('photos', [...form.photos, dataUrl])
    }).catch(() => toast.error('Could not process image'))
    e.target.value = ''
  }

  const validateStep = () => {
    switch (step) {
      case 0: if (form.photos.length < 3) return 'Add at least 3 photos'; break
      case 1: if (!form.name || !form.age || !form.gender) return 'Fill name, age and gender'; break
      case 2: if (!form.city || !form.gymName) return 'Pick city and your gym'; break
      case 3: if (!form.goal) return 'Pick your workout goal'; break
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
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Edit Profile</h1>
          <p className="text-white/60 mt-2">Update your details. Changes are visible to new partners immediately.</p>
        </div>
        <div className="space-y-6 fade-up" style={{ animationDelay: '0.1s' }}>
          <PhotoEditorCard photos={form.photos} setPhotos={(p) => update('photos', p)} photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} addPhoto={addPhoto} handleFile={handleFile} removePhoto={removePhoto} />

          <Card className="glass border-white/10 p-6 space-y-4">
            <h3 className="font-semibold text-lg">Basics</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-white/5 border-white/10" /></Field>
              <Field label="Age"><Input type="number" min={18} max={80} value={form.age} onChange={e => update('age', e.target.value)} className="bg-white/5 border-white/10" /></Field>
              <Field label="Gender">
                <Select value={form.gender} onValueChange={v => update('gender', v)}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
              </Field>
              <Field label="City">
                <Select value={form.city} onValueChange={v => update('city', v)}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </Field>
              <Field label="Height (cm)"><Input type="number" value={form.height} onChange={e => update('height', e.target.value)} className="bg-white/5 border-white/10" /></Field>
              <Field label="Weight (kg)"><Input type="number" value={form.weight} onChange={e => update('weight', e.target.value)} className="bg-white/5 border-white/10" /></Field>
            </div>
          </Card>

          <Card className="glass border-white/10 p-6 space-y-4">
            <h3 className="font-semibold text-lg">Fitness</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gym Name"><Input value={form.gymName} onChange={e => update('gymName', e.target.value)} className="bg-white/5 border-white/10" /></Field>
              <Field label="Experience Level">
                <Select value={form.level} onValueChange={v => update('level', v)}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
              </Field>
              <Field label="Workout Goal">
                <Select value={form.goal} onValueChange={v => update('goal', v)}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
              </Field>
              <Field label="Workout Timing">
                <Select value={form.timing} onValueChange={v => update('timing', v)}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TIMINGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </Field>
            </div>
            <Field label="Short Bio">
              <Textarea value={form.bio} onChange={e => update('bio', e.target.value)} maxLength={200} className="bg-white/5 border-white/10 min-h-[90px]" />
              <div className="text-xs text-white/40 mt-1 text-right">{form.bio.length}/200</div>
            </Field>
            <Field label="Instagram (optional)">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3">
                <Instagram className="w-4 h-4 text-white/40" />
                <Input value={form.instagram} onChange={e => update('instagram', e.target.value.replace('@',''))} placeholder="username" className="bg-transparent border-0 px-0 focus-visible:ring-0" />
              </div>
            </Field>
          </Card>

          <Button onClick={submit} disabled={saving} size="lg" className="w-full bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full h-12">
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
    { kicker: 'Step 4 of 7', title: "What's your goal?", sub: 'We\u2019ll match you with partners chasing the same.' },
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
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span className="uppercase tracking-wider font-semibold text-[#00ff88]">{cur.kicker}</span>
            <span>{Math.round(progressPct)}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div key={step} className="fade-up">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{cur.title}</h1>
          <p className="text-white/55 mt-2">{cur.sub}</p>

          <div className="mt-8 space-y-4">
            {step === 0 && (
              <PhotoEditorCard photos={form.photos} setPhotos={(p) => update('photos', p)} photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} addPhoto={addPhoto} handleFile={handleFile} removePhoto={removePhoto} />
            )}
            {step === 1 && (
              <Card className="glass border-white/10 p-6 space-y-4">
                <Field label="Name"><Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-white/5 border-white/10 h-11" placeholder="Your name" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Age"><Input type="number" min={18} max={80} value={form.age} onChange={e => update('age', e.target.value)} className="bg-white/5 border-white/10 h-11" placeholder="25" /></Field>
                  <Field label="Gender">
                    <Select value={form.gender} onValueChange={v => update('gender', v)}><SelectTrigger className="bg-white/5 border-white/10 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Height (cm) — optional"><Input type="number" value={form.height} onChange={e => update('height', e.target.value)} className="bg-white/5 border-white/10 h-11" /></Field>
                  <Field label="Weight (kg) — optional"><Input type="number" value={form.weight} onChange={e => update('weight', e.target.value)} className="bg-white/5 border-white/10 h-11" /></Field>
                </div>
              </Card>
            )}
            {step === 2 && (
              <Card className="glass border-white/10 p-6 space-y-4">
                <Field label="City">
                  <Select value={form.city} onValueChange={v => update('city', v)}><SelectTrigger className="bg-white/5 border-white/10 h-11"><SelectValue placeholder="Select your city" /></SelectTrigger>
                    <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                </Field>
                <Field label="Gym name"><Input value={form.gymName} onChange={e => update('gymName', e.target.value)} placeholder="e.g. Cult Fit, Gold's Gym" className="bg-white/5 border-white/10 h-11" /></Field>
              </Card>
            )}
            {step === 3 && (
              <ChoiceGrid options={GOALS} value={form.goal} onChange={(v) => update('goal', v)} icon={Target} />
            )}
            {step === 4 && (
              <ChoiceGrid options={TIMINGS} value={form.timing} onChange={(v) => update('timing', v)} icon={Clock} />
            )}
            {step === 5 && (
              <ChoiceGrid options={LEVELS} value={form.level} onChange={(v) => update('level', v)} icon={Zap} large />
            )}
            {step === 6 && (
              <Card className="glass border-white/10 p-6 space-y-4">
                <Field label="Short bio">
                  <Textarea
                    value={form.bio} onChange={e => update('bio', e.target.value)} maxLength={200}
                    placeholder="Morning workouts before office. Need a squat partner."
                    className="bg-white/5 border-white/10 min-h-[110px]"
                  />
                  <div className="text-xs text-white/40 mt-1 text-right">{form.bio.length}/200</div>
                </Field>
                <Field label="Instagram (optional — gets you a verified badge)">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 h-11">
                    <Instagram className="w-4 h-4 text-white/40" />
                    <Input value={form.instagram} onChange={e => update('instagram', e.target.value.replace('@',''))} placeholder="username" className="bg-transparent border-0 px-0 focus-visible:ring-0" />
                  </div>
                </Field>
                <div className="rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/20 p-4 text-sm text-white/75 leading-relaxed">
                  By continuing you agree to Trainr\u2019s safety-first community guidelines: zero tolerance for harassment, sexual content or fake profiles.
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <Button onClick={back} variant="outline" className="bg-white/5 border-white/15 rounded-full h-12 px-5">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          <Button onClick={next} disabled={saving} className="flex-1 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full h-12 active:scale-[0.99] transition">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating profile…</> : (step === totalSteps - 1 ? <>Finish & Discover Partners <ArrowRight className="w-4 h-4 ml-2" /></> : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>)}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PhotoEditorCard({ photos, setPhotos, photoUrl, setPhotoUrl, addPhoto, handleFile, removePhoto }) {
  return (
    <Card className="glass border-white/10 p-5 md:p-6">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5 md:gap-3 mb-4">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
            <img src={p} alt="" className="w-full h-full object-cover" />
            <button onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/75 backdrop-blur flex items-center justify-center hover:bg-black/90"><X className="w-3.5 h-3.5" /></button>
            {i === 0 && <Badge className="absolute bottom-1.5 left-1.5 bg-[#00ff88] text-black text-[10px] py-0 font-bold tracking-wide">MAIN</Badge>}
          </div>
        ))}
        {photos.length < 5 && (
          <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-white/40 hover:border-[#00ff88]/50 hover:text-[#00ff88] transition cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <span className="text-3xl leading-none">+</span>
            <span className="text-[10px] uppercase tracking-wider mt-1">Add photo</span>
          </label>
        )}
      </div>
      <div className="flex gap-2">
        <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="Or paste image URL…" className="bg-white/5 border-white/10" />
        <Button type="button" onClick={addPhoto} variant="outline" className="bg-white/5 border-white/10">Add URL</Button>
      </div>
      <p className="text-xs text-white/40 mt-3">3–5 photos required. First photo is your main.</p>
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
                ? 'bg-[#00ff88]/10 border-[#00ff88]/50 text-white shadow-[0_0_0_1px_rgba(0,255,136,0.2)]'
                : 'bg-white/[0.03] border-white/10 text-white/85 hover:bg-white/[0.06] hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-white/5 text-white/50'}`}>
                {Icon && <Icon className="w-5 h-5" />}
              </div>
              <span className="font-semibold flex-1">{opt}</span>
              {selected && <Check className="w-5 h-5 text-[#00ff88]" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ProfileCard({ profile, onLike, onSkip, onReport, index = 0 }) {
  const [photoIdx, setPhotoIdx] = useState(0)
  const photos = profile.photos || []
  const active = formatLastActive(profile.lastActiveAt)
  return (
    <div className="snap-start min-h-[calc(100vh-4rem)] flex items-center py-3 md:py-6 fade-up" style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}>
      <Card className="glass-strong border-white/10 overflow-hidden w-full max-w-md mx-auto rounded-3xl shadow-2xl shadow-black/30 hover:border-white/15 transition-colors">
        <div className="relative aspect-[4/5] bg-white/[0.03]">
          <SmartImg src={photos[photoIdx]} alt={profile.name} className="w-full h-full" />

          {photos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
              {photos.map((_, i) => (
                <div key={i} className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${i === photoIdx ? 'bg-white' : 'bg-white/25'}`} />
              ))}
            </div>
          )}

          <button onClick={() => setPhotoIdx(i => Math.max(0, i-1))} className="absolute left-0 top-0 w-1/3 h-full z-[5]" aria-label="Previous photo" />
          <button onClick={() => setPhotoIdx(i => Math.min(photos.length-1, i+1))} className="absolute right-0 top-0 w-1/3 h-full z-[5]" aria-label="Next photo" />

          {(active.online || active.text) && (
            <div className="absolute top-5 right-3 z-10 glass rounded-full px-2.5 py-[5px] flex items-center gap-1.5 border-white/15">
              {active.online ? (
                <>
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inset-0 rounded-full bg-[#00ff88] animate-ping opacity-70" />
                    <span className="relative rounded-full w-1.5 h-1.5 bg-[#00ff88]" />
                  </span>
                  <span className="text-[11px] font-semibold tracking-wide">Online</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <span className="text-[11px] font-medium tracking-wide text-white/70">{active.text}</span>
                </>
              )}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-5 pt-20 z-[6]">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl md:text-[26px] font-extrabold leading-tight">{profile.name}<span className="text-white/70 font-bold">, {profile.age}</span></h3>
              <VerificationBadge verified={profile.verified} />
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-white/70 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.city}</span>
              <span className="text-white/30">·</span>
              <span className="text-white/85 font-medium">{profile.gymName}</span>
              {profile.distanceKm != null && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="text-[#00ff88] font-medium flex items-center gap-1"><Navigation className="w-3 h-3" />{profile.distanceKm} km</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Badge className="bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/30 hover:bg-[#00ff88]/15 font-semibold">{profile.goal}</Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/15 hover:bg-white/15">{profile.level}</Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/15 hover:bg-white/15"><Clock className="w-3 h-3 mr-1" />{profile.timing}</Badge>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {profile.matchReasons && profile.matchReasons.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mr-1">Why this match</span>
              {profile.matchReasons.map(r => (
                <span key={r.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-[11px] font-semibold">
                  <Sparkles className="w-2.5 h-2.5" /> {r.label}
                </span>
              ))}
            </div>
          )}
          {profile.bio && <p className="text-[15px] text-white/85 leading-[1.55]">{profile.bio}</p>}
          {profile.instagram && (
            <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-white/55 mt-3 hover:text-[#00ff88] transition">
              <Instagram className="w-3.5 h-3.5" /> @{profile.instagram}
            </a>
          )}
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-2 mt-5">
            <Button onClick={() => onSkip(profile)} variant="outline" className="rounded-xl bg-white/5 border-white/10 hover:bg-white/10 active:scale-95 h-12 transition" aria-label="Skip">
              <X className="w-5 h-5" />
            </Button>
            <Button onClick={() => onLike(profile)} className="rounded-xl bg-[#00ff88] hover:bg-[#00cc6a] active:scale-[0.98] text-black font-semibold h-12 transition shadow-lg shadow-[#00ff88]/20">
              <Heart className="w-[18px] h-[18px] mr-1.5 fill-black" /> Connect
            </Button>
            <Button onClick={() => onReport(profile)} variant="outline" className="rounded-xl bg-white/5 border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 active:scale-95 h-12 transition" aria-label="Report">
              <AlertTriangle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function FiltersSheet({ filters, setFilters, onApply }) {
  const [local, setLocal] = useState(filters)
  useEffect(() => setLocal(filters), [filters])
  const set = (k, v) => setLocal(s => ({ ...s, [k]: v === '__any__' ? '' : v }))
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-full bg-white/5 border-white/15 hover:bg-white/10">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#0a0b0d] border-white/10 overflow-y-auto">
        <SheetHeader><SheetTitle>Filter Partners</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-6">
          <Field label="City">
            <Select value={local.city || '__any__'} onValueChange={v => set('city', v)}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent><SelectItem value="__any__">Any</SelectItem>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Gym">
            <Input value={local.gym} onChange={e => set('gym', e.target.value)} placeholder="e.g. Cult Fit" className="bg-white/5 border-white/10" />
          </Field>
          <Field label="Workout Goal">
            <Select value={local.goal || '__any__'} onValueChange={v => set('goal', v)}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent><SelectItem value="__any__">Any</SelectItem>{GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Workout Timing">
            <Select value={local.timing || '__any__'} onValueChange={v => set('timing', v)}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent><SelectItem value="__any__">Any</SelectItem>{TIMINGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Gender">
            <Select value={local.gender || '__any__'} onValueChange={v => set('gender', v)}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent><SelectItem value="__any__">Any</SelectItem>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Experience Level">
            <Select value={local.level || '__any__'} onValueChange={v => set('level', v)}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent><SelectItem value="__any__">Any</SelectItem>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label={`Maximum distance${local.maxDistance ? ` (${local.maxDistance} km)` : ' — any'}`}>
            <input
              type="range" min={0} max={50} step={5}
              value={local.maxDistance || 0}
              onChange={e => set('maxDistance', parseInt(e.target.value, 10))}
              className="w-full accent-[#00ff88]"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1"><span>0 km</span><span>5</span><span>15</span><span>30</span><span>50+ (any)</span></div>
          </Field>
          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="ra" className="text-sm">Recently active only</Label>
            <Switch id="ra" checked={local.recentlyActive} onCheckedChange={v => set('recentlyActive', v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="vo" className="text-sm">Verified users only</Label>
            <Switch id="vo" checked={local.verifiedOnly} onCheckedChange={v => set('verifiedOnly', v)} />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={() => { const blank = { city: '', gym: '', goal: '', timing: '', gender: '', level: '', verifiedOnly: false, recentlyActive: false, maxDistance: 0 }; setLocal(blank); setFilters(blank); onApply?.(blank) }} variant="outline" className="flex-1 bg-white/5 border-white/10">Reset</Button>
            <Button onClick={() => { setFilters(local); onApply?.(local) }} className="flex-1 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold">Apply</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Discover() {
  const [filters, setFilters] = useState({ city: '', gym: '', goal: '', timing: '', gender: '', level: '', verifiedOnly: false, recentlyActive: false, maxDistance: 0 })
  const [profiles, setProfiles] = useState(null)
  const [reportProfile, setReportProfile] = useState(null)
  const [showLocPrompt, setShowLocPrompt] = useState(false)

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

  const load = async (f = filters) => {
    setProfiles(null)
    const params = new URLSearchParams()
    Object.entries(f).forEach(([k,v]) => { if (v) params.append(k, String(v)) })
    const res = await fetch('/api/profiles/discover?' + params.toString(), { credentials: 'include' })
    const data = await res.json()
    setProfiles(data.profiles || [])
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const handleLike = async (p) => {
    setProfiles(prev => (prev || []).filter(x => x.id !== p.id))
    try {
      const res = await fetch('/api/profiles/like', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: p.id }) })
      const data = await res.json()
      if (data.matched) toast.success(`Mutual connection with ${p.name}!`, { description: 'Open Connections to start chatting.' })
      else toast(`Connected with ${p.name}`, { description: 'They\u2019ll be notified.' })
    } catch { toast.error('Failed to like') }
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
      <div className="sticky top-16 z-30 glass-strong border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00ff88]" />
            <span className="text-sm font-semibold">Discover</span>
            {profiles && <span className="text-xs text-white/50">· {profiles.length} nearby</span>}
          </div>
          <FiltersSheet filters={filters} setFilters={setFilters} onApply={(f) => load(f)} />
        </div>
      </div>

      {showLocPrompt && (
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="glass border-white/10 rounded-2xl p-4 flex items-start gap-3 fade-up">
            <div className="w-9 h-9 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-4 h-4 text-[#00ff88]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">See partners near you</div>
              <div className="text-xs text-white/55 mt-0.5">Allow location for distance-based discovery. We never share your exact location.</div>
              <div className="flex gap-2 mt-3">
                <Button onClick={enableLocation} size="sm" className="bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold h-8 text-xs">Allow location</Button>
                <Button onClick={dismissLoc} size="sm" variant="outline" className="bg-white/5 border-white/10 h-8 text-xs">Use city only</Button>
              </div>
            </div>
            <button onClick={dismissLoc} className="text-white/40 hover:text-white/70" aria-label="Dismiss"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 snap-y snap-mandatory">
        {profiles === null && (
          <div className="space-y-4 pt-6">
            <div className="rounded-3xl overflow-hidden glass-strong border-white/10">
              <div className="aspect-[4/5] bg-gradient-to-br from-white/[0.04] via-white/[0.08] to-white/[0.03] animate-shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-1/2 rounded-md bg-white/5 animate-shimmer" />
                <div className="h-3 w-3/4 rounded-md bg-white/5 animate-shimmer" />
                <div className="flex gap-2 pt-2">
                  <div className="h-12 flex-1 rounded-xl bg-white/5 animate-shimmer" />
                  <div className="h-12 flex-[2] rounded-xl bg-white/5 animate-shimmer" />
                  <div className="h-12 flex-1 rounded-xl bg-white/5 animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
        )}
        {profiles && profiles.length === 0 && (
          <EmptyDiscover onResetFilters={() => load({ city: '', gym: '', goal: '', timing: '', gender: '', level: '', verifiedOnly: false, recentlyActive: false, maxDistance: 0 })} />
        )}
        {profiles?.map(p => (
          <ProfileCard key={p.id} profile={p} onLike={handleLike} onSkip={handleSkip} onReport={setReportProfile} />
        ))}
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
      <div className="w-20 h-20 rounded-3xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center mx-auto mb-5 text-4xl">💪</div>
      <h3 className="text-2xl font-extrabold tracking-tight">No workout partners nearby yet</h3>
      <p className="text-white/60 mt-2 text-sm leading-relaxed">Be the first athlete in your area. Invite a gym buddy to join and the feed comes alive.</p>
      <div className="flex flex-col gap-2 mt-6">
        <Button onClick={inviteFriends} className="bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full h-11">
          <Send className="w-4 h-4 mr-2" /> Invite Friends
        </Button>
        <Button onClick={onResetFilters} variant="outline" className="bg-white/5 border-white/10 rounded-full h-11">
          <Filter className="w-4 h-4 mr-2" /> Edit Filters
        </Button>
      </div>
      <p className="text-[11px] text-white/35 mt-6">We never DM your contacts. We just give you a link to share.</p>
    </div>
  )
}

function Matches({ onOpenChat }) {
  const [matches, setMatches] = useState(null)
  useEffect(() => {
    fetch('/api/matches', { credentials: 'include' }).then(r => r.json()).then(d => setMatches(d.matches || []))
  }, [])
  return (
    <div className="pt-20 pb-12 max-w-2xl mx-auto px-4 md:px-6">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight">Connections</h1>
      <p className="text-white/60 mt-1">Mutual workout partners ready to train together.</p>
      <div className="mt-8 space-y-3">
        {matches === null && [1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl bg-white/5" />)}
        {matches && matches.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center">
            <Heart className="w-10 h-10 mx-auto text-[#00ff88] mb-3" />
            <p className="text-white/70">No connections yet. Keep discovering!</p>
          </div>
        )}
        {matches?.map(m => (
          <button key={m.id} onClick={() => onOpenChat(m)} className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.07] hover:border-white/15 active:scale-[0.99] transition text-left">
            <div className="relative">
              <Avatar className="w-14 h-14 ring-1 ring-white/10">
                <AvatarImage src={m.otherProfile?.photos?.[0]} />
                <AvatarFallback>{m.otherProfile?.name?.slice(0,1)}</AvatarFallback>
              </Avatar>
              {m.otherProfile?.online && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00ff88] ring-2 ring-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{m.otherProfile?.name}<span className="text-white/60 font-medium">, {m.otherProfile?.age}</span></span>
                <VerificationBadge verified={m.otherProfile?.verified} />
                {m.unreadCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[#00ff88] text-black text-[10px] font-extrabold flex items-center justify-center">
                    {m.unreadCount > 9 ? '9+' : m.unreadCount}
                  </span>
                )}
              </div>
              {m.lastMessage ? (
                <div className={`text-xs truncate mt-0.5 ${m.unreadCount > 0 ? 'text-white/85 font-medium' : 'text-white/50'}`}>
                  {m.lastMessage.fromMe && <span className="text-white/40">You: </span>}
                  {m.lastMessage.text}
                </div>
              ) : (
                <div className="text-xs text-white/45 truncate mt-0.5">{m.otherProfile?.gymName} · {m.otherProfile?.goal}</div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </button>
        ))}
      </div>
    </div>
  )
}

function Chat({ match, currentUserId, onBack, onChatRemoved }) {
  const [messages, setMessages] = useState([])
  const [otherTyping, setOtherTyping] = useState(false)
  const [text, setText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const scrollerRef = useRef(null)
  const typingTimerRef = useRef(null)

  const load = async () => {
    try {
      const res = await fetch(`/api/messages?matchId=${match.id}`, { credentials: 'include' })
      const data = await res.json()
      setMessages(data.messages || [])
      setOtherTyping(!!data.otherTyping)
    } catch {}
  }
  useEffect(() => {
    load()
    const t = setInterval(load, 2500)
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
    setText('')
    try {
      const res = await fetch('/api/messages', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: match.id, text: t }) })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) toast.error(data.error || 'Slow down')
        else toast.error(data.error || 'Failed to send')
        return
      }
      if (data.message?.flagged) toast.warning('Your message was flagged. Repeated violations lead to suspension.')
      load()
    } catch { toast.error('Failed to send') }
  }

  const blockUser = async () => {
    try {
      await fetch('/api/blocks', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: match.otherProfile?.id }) })
      toast.success(`${match.otherProfile?.name || 'User'} blocked`, { description: 'Chat removed. They can\u2019t contact you.' })
      onChatRemoved?.()
    } catch { toast.error('Could not block') }
  }

  const myLastMsg = [...messages].reverse().find(m => m.fromUserId === currentUserId)
  const otherUserId = match.userA === currentUserId ? match.userB : match.userA
  const myLastSeen = myLastMsg && Array.isArray(myLastMsg.readBy) && myLastMsg.readBy.includes(otherUserId)
  const otherActive = formatLastActive(match.otherProfile?.lastActiveAt)

  return (
    <div className="pt-16 h-screen flex flex-col">
      <div className="border-b border-white/10 glass-strong">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
          <Avatar className="w-9 h-9"><AvatarImage src={match.otherProfile?.photos?.[0]} /><AvatarFallback>{match.otherProfile?.name?.slice(0,1)}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm flex items-center gap-1.5 truncate">{match.otherProfile?.name} <VerificationBadge verified={match.otherProfile?.verified} /></div>
            <div className="text-xs text-white/50">
              {otherTyping ? <span className="text-[#00ff88]">typing…</span> : (otherActive.online ? <span className="text-[#00ff88]">Online now</span> : (otherActive.text || 'Offline'))}
            </div>
          </div>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition" title="Options">
                <span className="flex flex-col gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-white/70" />
                  <span className="w-1 h-1 rounded-full bg-white/70" />
                  <span className="w-1 h-1 rounded-full bg-white/70" />
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-[#0a0b0d] border-white/10 rounded-t-3xl max-h-[60vh]">
              <SheetHeader><SheetTitle>Options</SheetTitle></SheetHeader>
              <div className="space-y-2 mt-4 max-w-md mx-auto">
                <button
                  onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] transition text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-amber-300" /></div>
                  <div>
                    <div className="text-sm font-semibold">Report user</div>
                    <div className="text-xs text-white/55">Categorise the issue. We review within 24h.</div>
                  </div>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setConfirmBlock(true) }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center"><Lock className="w-4 h-4 text-red-300" /></div>
                  <div>
                    <div className="text-sm font-semibold">Block user</div>
                    <div className="text-xs text-white/55">Removes chat. They can\u2019t see or contact you.</div>
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
            <div className="text-center text-sm text-white/50 py-12">{`You're connected! Say hi 👋 — coordinate your first session.`}</div>
          )}
          {messages.map(m => {
            const mine = m.fromUserId === currentUserId
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-[#00ff88] text-black' : 'glass border-white/10'} ${m.flagged ? 'opacity-70 ring-1 ring-red-500/40' : ''}`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</div>
                  <div className={`text-[10px] mt-1 ${mine ? 'text-black/50' : 'text-white/40'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            )
          })}
          {otherTyping && (
            <div className="flex justify-start">
              <div className="glass border-white/10 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '240ms' }} />
                </div>
              </div>
            </div>
          )}
          {myLastMsg && (
            <div className="flex justify-end">
              <div className="text-[10px] text-white/40 pr-1">{myLastSeen ? 'Seen' : 'Sent'}</div>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 glass-strong">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Input
            value={text}
            onChange={e => { setText(e.target.value); pingTyping() }}
            onKeyDown={e => e.key === 'Enter' && send()}
            maxLength={1000}
            placeholder="Type a message..."
            className="bg-white/5 border-white/10"
          />
          <Button onClick={send} disabled={!text.trim()} className="bg-[#00ff88] hover:bg-[#00cc6a] text-black rounded-full disabled:opacity-50" size="icon"><Send className="w-4 h-4" /></Button>
        </div>
      </div>

      <Dialog open={confirmBlock} onOpenChange={setConfirmBlock}>
        <DialogContent className="bg-[#0a0b0d] border-white/10 max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-red-400" /> Block {match.otherProfile?.name}?</DialogTitle></DialogHeader>
          <p className="text-sm text-white/65 leading-relaxed">This will <strong className="text-white">delete this conversation</strong> and prevent future contact. You both disappear from each other\u2019s feeds.</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => setConfirmBlock(false)} variant="outline" className="flex-1 bg-white/5 border-white/10">Cancel</Button>
            <Button onClick={async () => { await blockUser(); setConfirmBlock(false) }} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold">Block</Button>
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
        <div className="flex items-center gap-2"><Ic className="w-4 h-4 text-white/55" /> <span className="text-sm">{label}</span></div>
        {verified ? (
          <Badge className="bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/30">Verified</Badge>
        ) : status === 'pending' ? (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30">In review</Badge>
        ) : status === 'rejected' ? (
          type === 'selfie' ? (
            <Button size="sm" variant="outline" onClick={() => setShowSelfie(true)} className="bg-red-500/[0.08] border-red-500/30 text-red-300 hover:bg-red-500/15 h-8 text-xs">
              <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={requesting === type} onClick={() => requestVerify(type)} className="bg-red-500/[0.08] border-red-500/30 text-red-300 hover:bg-red-500/15 h-8 text-xs">
              <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
            </Button>
          )
        ) : type === 'selfie' ? (
          <Button size="sm" variant="outline" onClick={() => setShowSelfie(true)} className="bg-white/5 border-white/10 h-8 text-xs">
            <Camera className="w-3 h-3 mr-1.5" /> Verify
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled={requesting === type} onClick={() => requestVerify(type)} className="bg-white/5 border-white/10 h-8 text-xs">
            {requesting === type ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Request</>}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="pt-20 pb-12 max-w-2xl mx-auto px-4 md:px-6">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight">Settings</h1>
      <div className="mt-6 space-y-3">
        <Card className="glass border-white/10 p-5 flex items-center gap-4">
          <Avatar className="w-14 h-14"><AvatarImage src={profile?.photos?.[0] || user.picture} /><AvatarFallback>{user.name?.slice(0,1)}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold flex items-center gap-1.5 truncate">{profile?.name || user.name} <VerificationBadge verified={profile?.verified} /></div>
            <div className="text-sm text-white/60 truncate">{user.email}</div>
          </div>
          <Button onClick={onEditProfile} variant="outline" className="bg-white/5 border-white/10">Edit</Button>
        </Card>

        {/* Profile completion progress */}
        {completion && !completion.complete && (
          <Card className="glass border-[#00ff88]/20 p-5 bg-gradient-to-br from-[#00ff88]/[0.04] to-transparent">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-white">Your profile is {completion.score}% complete</div>
                <div className="text-xs text-white/55 mt-0.5">Finish to be visible in Discover.</div>
              </div>
              <div className="text-2xl font-black text-[#00ff88]">{completion.score}%</div>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] transition-all duration-500" style={{ width: `${completion.score}%` }} />
            </div>
            {completion.missing?.length > 0 && (
              <div className="mt-3 space-y-1">
                {completion.missing.slice(0, 4).map(m => (
                  <div key={m.key} className="text-xs text-white/65 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#00ff88]" /> {m.label}
                  </div>
                ))}
              </div>
            )}
            <Button onClick={onEditProfile} className="mt-4 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold w-full h-10">
              Complete profile
            </Button>
          </Card>
        )}

        {/* Premium card — hidden behind env flag for real-user beta */}
        {PREMIUM_ENABLED && (
          <Card className="glass border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-2">Trainr Pro {user.tier === 'pro' && <Badge className="bg-amber-400/15 text-amber-300 border-amber-400/30">Active</Badge>}</div>
                <div className="text-xs text-white/55">Unlimited connections, advanced filters, priority placement</div>
              </div>
              <Button onClick={onOpenPremium} className="bg-amber-400 hover:bg-amber-500 text-black font-semibold">
                {user.tier === 'pro' ? 'Manage' : 'Upgrade'}
              </Button>
            </div>
          </Card>
        )}

        <Card className="glass border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Verification</h3>
            {profile?.verified && <Badge className="bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/30">Verified ✓</Badge>}
          </div>
          <div className="space-y-2">
            <VerifyRow type="selfie" label="Selfie verification" icon={Camera} />
            <VerifyRow type="instagram" label="Instagram linked" icon={Instagram} />
            <VerifyRow type="gym" label="Verified gym member" icon={Dumbbell} />
          </div>
          <p className="text-xs text-white/40 mt-3">Verified profiles get a blue badge and higher visibility.</p>
        </Card>

        {/* Push notifications card */}
        <Card className="glass border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#00ff88]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">Push notifications</div>
              <div className="text-xs text-white/55">
                {pushState === 'enabled' && 'Enabled · server delivery MOCKED until VAPID configured'}
                {pushState === 'denied' && 'Denied · enable in browser settings'}
                {pushState === 'unsupported' && 'Not supported on this browser'}
                {pushState === 'idle' && 'Get notified about connections, messages, and matches'}
              </div>
            </div>
            {pushState === 'idle' && (
              <Button onClick={enablePush} variant="outline" className="bg-white/5 border-white/10">Enable</Button>
            )}
            {pushState === 'enabled' && (
              <Badge className="bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/30">On</Badge>
            )}
          </div>
        </Card>

        <button onClick={onLogout} className="w-full glass rounded-2xl p-5 flex items-center gap-3 hover:bg-white/[0.07] transition text-white/85">
          <LogOut className="w-5 h-5" /> <span className="font-semibold">Log out</span>
        </button>

        {/* Danger zone */}
        <div className="pt-2">
          <div className="text-[10px] uppercase tracking-wider text-red-400/70 font-bold mb-2 px-1">Danger zone</div>
          <button onClick={() => setConfirmDelete(true)} className="w-full rounded-2xl p-5 flex items-center gap-3 bg-red-500/[0.04] border border-red-500/25 hover:bg-red-500/10 hover:border-red-500/40 transition text-red-300 active:scale-[0.99]">
            <AlertTriangle className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div className="font-semibold">Delete account</div>
              <div className="text-xs text-red-300/65">Permanently delete your profile, photos and chats.</div>
            </div>
          </button>
        </div>
      </div>

      <SelfieVerifyDialog open={showSelfie} onOpenChange={setShowSelfie} onVerified={(p) => onProfileUpdated?.(p)} />

      {/* Delete account confirmation */}
      <Dialog open={confirmDelete} onOpenChange={(o) => !deleting && setConfirmDelete(o)}>
        <DialogContent className="bg-[#0a0b0d] border-red-500/30 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-300"><AlertTriangle className="w-5 h-5" /> Delete account?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/75 leading-relaxed">
            This will <strong className="text-white">permanently delete</strong>:
          </p>
          <ul className="text-xs text-white/65 space-y-1.5 pl-1">
            <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-400" /> Your profile and all uploaded photos</li>
            <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-400" /> Your matches, chats and messages</li>
            <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-400" /> Your notifications and verification state</li>
            <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-400" /> Your account and active sessions</li>
          </ul>
          <p className="text-xs text-red-300 font-semibold">This action cannot be undone.</p>
          <div className="flex gap-2 mt-1">
            <Button onClick={() => setConfirmDelete(false)} disabled={deleting} variant="outline" className="flex-1 bg-white/5 border-white/10">Cancel</Button>
            <Button onClick={deleteAccount} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold">
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
      <Lock className="w-10 h-10 mx-auto text-white/40" />
      <h2 className="text-2xl font-bold mt-4">Restricted area</h2>
      <p className="text-sm text-white/55 mt-1">This page is for Trainr admins only.</p>
      <Button onClick={onBack} className="mt-6 bg-[#00ff88] hover:bg-[#00cc6a] text-black rounded-full">Back to Discover</Button>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [view, setView] = useState('landing')
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState(null)
  const [showPremium, setShowPremium] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('session_id=')) {
      const sessionId = new URLSearchParams(hash.substring(1)).get('session_id')
      window.history.replaceState({}, '', window.location.pathname)
      ;(async () => {
        try {
          const res = await fetch('/api/auth/session', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Auth failed')
          setUser(data.user)
          setView(data.hasProfile ? 'discover' : 'profile-edit')
          toast.success(`Welcome ${data.user.name?.split(' ')[0]}!`)
          const meRes = await fetch('/api/auth/me', { credentials: 'include' })
          const me = await meRes.json()
          if (me.profile) setProfile(me.profile)
        } catch (e) { toast.error(e.message) } finally { setLoading(false) }
      })()
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
          setProfile(data.profile)
          setView(data.profile ? 'discover' : 'profile-edit')
        }
      } catch {}
      setLoading(false)
    })()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null); setProfile(null); setView('landing')
    toast.success('Logged out')
  }

  const handleProfileSaved = (p) => { setProfile(p); setView('discover') }
  const handlePremiumUpgraded = (data) => { setUser(u => u ? { ...u, tier: data.tier } : u) }
  const handleAccountDeleted = () => { setUser(null); setProfile(null); setActiveChat(null); setView('landing') }
  const handleChatRemoved = () => { setActiveChat(null); setView('matches') }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black border border-[#00ff88]/30">
            <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2 text-white/55 text-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00ff88]" />
            <span className="tracking-wide">Loading Trainr</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} view={view} setView={setView} onOpenPremium={() => setShowPremium(true)} />
      {!user && view === 'landing' && <Landing onNav={setView} />}
      {!user && view === 'about' && <AboutView onNav={setView} />}
      {!user && view === 'privacy' && <PrivacyView onNav={setView} />}
      {!user && view === 'contact' && <ContactView onNav={setView} />}
      {user && view === 'profile-edit' && <ProfileEditor user={user} profile={profile} onSaved={handleProfileSaved} />}
      {user && view === 'discover' && (profile ? <Discover /> : <ProfileEditor user={user} profile={null} onSaved={handleProfileSaved} />)}
      {user && view === 'matches' && <Matches onOpenChat={(m) => { setActiveChat(m); setView('chat') }} />}
      {user && view === 'chat' && activeChat && <Chat match={activeChat} currentUserId={user.id} onBack={() => { setActiveChat(null); setView('matches') }} onChatRemoved={handleChatRemoved} />}
      {user && view === 'settings' && <SettingsView user={user} profile={profile} onEditProfile={() => setView('profile-edit')} onLogout={handleLogout} onProfileUpdated={(p) => setProfile(p)} onOpenPremium={() => setShowPremium(true)} onAccountDeleted={handleAccountDeleted} />}
      {user && view === 'admin' && (user.isAdmin ? <AdminView /> : <ForbiddenView onBack={() => setView('discover')} />)}

      {user && PREMIUM_ENABLED && <PremiumDialog open={showPremium} onOpenChange={setShowPremium} onUpgraded={handlePremiumUpgraded} />}
    </div>
  )
}

export default App
