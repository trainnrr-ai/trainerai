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
  Dumbbell, MapPin, Clock, Target, ShieldCheck, MessageCircle, Heart, X, ChevronRight,
  Sparkles, Users, Lock, AlertTriangle, Instagram, Send, Filter, ArrowLeft, LogOut,
  BadgeCheck, Flame, Activity, ArrowRight, Star, CheckCircle2, Loader2, Camera, RefreshCw,
} from 'lucide-react'

const HERO_IMG = 'https://images.unsplash.com/photo-1648235692910-947cb90ddd97?w=1600&auto=format&fit=crop'
const LOGO = 'https://customer-assets.emergentagent.com/job_workout-match-19/artifacts/u3kk6eqv_file_00000000e428720badf6b7f599a3a7f4.png'
const INSTAGRAM_URL = 'https://instagram.com/trainr.in'
const SUPPORT_EMAIL = 'hello@trainr.in'

const GOALS = ['Weight Loss', 'Muscle Gain', 'Bulking', 'Leaning', 'Powerlifting', 'Cardio', 'General Fitness']
const TIMINGS = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Late Night']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const GENDERS = ['Male', 'Female', 'Non-binary']
const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Gurgaon', 'Other']

function loginWithGoogle() {
  const redirectUrl = `${window.location.origin}/`
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`
}

function Navbar({ user, view, setView }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <button onClick={() => setView(user ? 'discover' : 'landing')} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-black ring-1 ring-[#00ff88]/30 shadow-lg shadow-[#00ff88]/20 group-hover:scale-105 group-hover:shadow-[#00ff88]/40 transition">
            <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Trainr</span>
        </button>
        {user ? (
          <nav className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setView('discover')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${view === 'discover' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>Discover</button>
            <button onClick={() => setView('matches')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${view === 'matches' || view === 'chat' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>Connections</button>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" title="Follow Trainr on Instagram" className="hidden md:flex w-9 h-9 rounded-lg items-center justify-center text-white/60 hover:text-[#00ff88] hover:bg-white/5 transition">
              <Instagram className="w-4 h-4" />
            </a>
            <button onClick={() => setView('settings')} className="ml-1 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition overflow-hidden">
              <Avatar className="w-9 h-9">
                <AvatarImage src={user.picture} />
                <AvatarFallback className="bg-[#00ff88]/20 text-[#00ff88] text-xs font-semibold">{(user.name || 'U').slice(0,1)}</AvatarFallback>
              </Avatar>
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-2 md:gap-3">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" title="Follow Trainr on Instagram" className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center text-white/60 hover:text-[#00ff88] hover:bg-white/5 transition">
              <Instagram className="w-4 h-4" />
            </a>
            <button onClick={() => setView('about')} className="hidden md:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition">About</button>
            <button onClick={() => setView('contact')} className="hidden md:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition">Contact</button>
            <Button onClick={loginWithGoogle} className="bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full px-5">Get Started</Button>
          </div>
        )}
      </div>
    </header>
  )
}

function Landing({ onNav }) {
  return (
    <div className="pt-16">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-28 pb-16 md:pb-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="fade-up">
              <Badge className="mb-5 bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88]/15 border-[#00ff88]/30 rounded-full px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1.5" /> Premium fitness network
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">
                Find Your Perfect <span className="text-gradient">Workout Partner.</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-white/70 max-w-lg leading-relaxed">
                Build your fitness network. Connect with verified training partners nearby — matched by gym, goals, and schedule. Built for accountability, not dating.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button onClick={loginWithGoogle} size="lg" className="bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full h-12 px-7 text-base neon-glow">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} variant="outline" size="lg" className="rounded-full h-12 px-7 text-base bg-white/5 border-white/15 hover:bg-white/10 text-white">
                  Explore Partners
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-white/50">
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#00ff88]" /> Women safety first</div>
                <div className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#00ff88]" /> Verified profiles</div>
              </div>
            </div>
            <div className="relative fade-up" style={{ animationDelay: '0.15s' }}>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden glass-strong">
                <img src={HERO_IMG} alt="Trainr" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="glass rounded-2xl p-4 animate-float">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#00ff88]/20 flex items-center justify-center"><Flame className="w-5 h-5 text-[#00ff88]" /></div>
                      <div>
                        <div className="text-sm font-semibold">Connection found near Cult Fit</div>
                        <div className="text-xs text-white/60">Same goal · Powerlifting · 6AM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 glass rounded-2xl px-4 py-3 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                  <span className="text-xs font-medium">12 active near you</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="mb-4 bg-white/5 text-white/80 border-white/10">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Built for serious lifters,<br /><span className="text-gradient">community-driven.</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Sparkles, title: 'Smart Matching', desc: 'Connect by goal, gym, schedule and experience — not selfies.' },
              { icon: MapPin, title: 'Nearby Gym Partners', desc: 'See lifters at your gym, your timing, your level.' },
              { icon: Target, title: 'Workout Accountability', desc: 'Show up because someone\u2019s waiting at the rack.' },
              { icon: MessageCircle, title: 'In-App Chat', desc: 'Coordinate sessions, share PRs, build the rep.' },
              { icon: BadgeCheck, title: 'Verified Profiles', desc: 'Selfie + Instagram + gym member checks.' },
              { icon: ShieldCheck, title: 'Women Safety Focus', desc: 'Strict moderation, anti-creep detection, easy reporting.' },
              { icon: Clock, title: 'Schedule Matching', desc: 'Find partners who train when you do.' },
              { icon: Users, title: 'Community First', desc: 'A network to grow stronger, together.' },
              { icon: Activity, title: 'Track Together', desc: 'Coming soon: session logs and streaks.' },
            ].map((f, i) => (
              <div key={i} className="group glass rounded-2xl p-6 hover:bg-white/[0.06] transition fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center mb-4 group-hover:bg-[#00ff88]/20 transition">
                  <f.icon className="w-5 h-5 text-[#00ff88]" />
                </div>
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="text-sm text-white/60 mt-1.5 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative bg-gradient-to-b from-transparent via-[#00ff88]/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="mb-4 bg-white/5 text-white/80 border-white/10">How it works</Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Four steps to your <span className="text-gradient">strongest year.</span></h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { n: '01', t: 'Create Profile', d: 'Tell us your gym, goals and schedule.' },
              { n: '02', t: 'Discover Partners', d: 'Browse a clean feed of matched lifters.' },
              { n: '03', t: 'Connect & Chat', d: 'Mutual connection unlocks chat.' },
              { n: '04', t: 'Train Together', d: 'Show up. Stay consistent. Grow.' },
            ].map((s, i) => (
              <div key={i} className="glass rounded-2xl p-6 relative overflow-hidden">
                <div className="text-5xl font-black text-white/[0.06]">{s.n}</div>
                <h3 className="font-bold text-lg mt-2">{s.t}</h3>
                <p className="text-sm text-white/60 mt-1.5">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="glass-strong rounded-3xl p-8 md:p-14 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#00ff88]/10 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <Badge className="mb-4 bg-pink-500/10 text-pink-300 border-pink-500/30">Safety first</Badge>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Women's safety is non-negotiable.</h2>
                <p className="mt-4 text-white/70 max-w-md">Trainr is built with strict moderation, anti-harassment systems, and a zero-tolerance policy for inappropriate behavior.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { i: ShieldCheck, t: 'Verified Users', d: 'Selfie + ID checks' },
                  { i: AlertTriangle, t: 'Report System', d: '24/7 moderation' },
                  { i: Lock, t: 'Anti-Creep', d: 'Auto message filters' },
                  { i: Users, t: 'Safe Community', d: 'Warning → Ban escalation' },
                ].map((s, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <s.i className="w-5 h-5 text-[#00ff88] mb-2" />
                    <div className="font-semibold text-sm">{s.t}</div>
                    <div className="text-xs text-white/50 mt-0.5">{s.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Lifters love Trainr.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: 'Aanya K.', r: 'Found a women-only training crew at my gym in 2 days. Game changer.', g: 'Pilates · Mumbai' },
              { n: 'Arjun M.', r: 'My deadlift PR jumped 30kg with consistent partners. The accountability is real.', g: 'Powerlifting · Bangalore' },
              { n: 'Priya N.', r: 'I felt safe from day one. Verified profiles + tight moderation = peace of mind.', g: 'Powerlifting · Delhi' },
            ].map((t, i) => (
              <div key={i} className="glass rounded-2xl p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({length:5}).map((_,j) => <Star key={j} className="w-4 h-4 fill-[#00ff88] text-[#00ff88]" />)}
                </div>
                <p className="text-white/80 leading-relaxed">"{t.r}"</p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="font-semibold text-sm">{t.n}</div>
                  <div className="text-xs text-white/50">{t.g}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="relative glass-strong rounded-3xl p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/10 via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight">Start Your Fitness <br /><span className="text-gradient">Journey Together.</span></h2>
              <p className="mt-5 text-white/70 max-w-md mx-auto">Join thousands of lifters showing up — together — every single day.</p>
              <Button onClick={loginWithGoogle} size="lg" className="mt-8 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full h-12 px-8 text-base neon-glow">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-black ring-1 ring-[#00ff88]/30">
                  <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" />
                </div>
                <span className="font-extrabold text-white text-lg">Trainr</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">Your fitness accountability network. Find verified workout partners nearby. Built in India.</p>
              <div className="flex items-center gap-3 mt-4">
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#00ff88]/15 hover:text-[#00ff88] flex items-center justify-center transition border border-white/10">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-xs text-white/50 hover:text-[#00ff88] transition">{SUPPORT_EMAIL}</a>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Product</div>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-white/70 hover:text-white">Features</button></li>
                <li><button onClick={loginWithGoogle} className="text-white/70 hover:text-white">Get Started</button></li>
                <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white">Instagram</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Company</div>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => onNav('about')} className="text-white/70 hover:text-white">About</button></li>
                <li><button onClick={() => onNav('privacy')} className="text-white/70 hover:text-white">Privacy Policy</button></li>
                <li><button onClick={() => onNav('privacy')} className="text-white/70 hover:text-white">Terms</button></li>
                <li><button onClick={() => onNav('contact')} className="text-white/70 hover:text-white">Contact</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-white/40">
            <div>© 2025 Trainr · trainr.in · All rights reserved.</div>
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#00ff88]" /> Safety-first community</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-white/50">{label}</Label>{children}</div>
}

function ProfileEditor({ user, profile, onSaved }) {
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
    const reader = new FileReader()
    reader.onload = () => update('photos', [...form.photos, reader.result])
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const submit = async () => {
    if (form.photos.length < 3) { toast.error('Please add at least 3 photos'); return }
    if (!form.name || !form.age || !form.gender || !form.city || !form.gymName || !form.level || !form.goal || !form.timing) {
      toast.error('Please fill all required fields'); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Profile saved!')
      onSaved?.(data.profile)
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="pt-20 pb-24 max-w-3xl mx-auto px-4 md:px-6">
      <div className="mb-8 fade-up">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">{profile ? 'Edit Profile' : 'Build Your Profile'}</h1>
        <p className="text-white/60 mt-2">Help us match you with the right partners. (Instagram is optional and gets you a verified badge.)</p>
      </div>

      <div className="space-y-6 fade-up" style={{ animationDelay: '0.1s' }}>
        <Card className="glass border-white/10 p-6">
          <Label className="text-base font-semibold mb-1 block">Profile Photos <span className="text-[#00ff88]">(3–5 required)</span></Label>
          <p className="text-sm text-white/50 mb-4">Upload from your device or paste an image URL. Real photos build trust faster.</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            {form.photos.map((p, i) => (
              <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
                <img src={p} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 backdrop-blur flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                {i === 0 && <Badge className="absolute bottom-1.5 left-1.5 bg-[#00ff88] text-black text-[10px] py-0">MAIN</Badge>}
              </div>
            ))}
            {form.photos.length < 5 && (
              <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/15 flex items-center justify-center text-white/40 hover:border-[#00ff88]/50 hover:text-[#00ff88] transition cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <span className="text-3xl">+</span>
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="Or paste image URL..." className="bg-white/5 border-white/10" />
            <Button type="button" onClick={addPhoto} variant="outline" className="bg-white/5 border-white/10">Add</Button>
          </div>
        </Card>

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
            <Field label="Gym Name"><Input value={form.gymName} onChange={e => update('gymName', e.target.value)} placeholder="e.g. Cult Fit, Gold's Gym" className="bg-white/5 border-white/10" /></Field>
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
            <Textarea value={form.bio} onChange={e => update('bio', e.target.value)} maxLength={200} placeholder="What kind of partner are you looking for?" className="bg-white/5 border-white/10 min-h-[90px]" />
            <div className="text-xs text-white/40 mt-1 text-right">{form.bio.length}/200</div>
          </Field>
          <Field label="Instagram (optional)">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3">
              <Instagram className="w-4 h-4 text-white/40" />
              <Input value={form.instagram} onChange={e => update('instagram', e.target.value.replace('@',''))} placeholder="username" className="bg-transparent border-0 px-0 focus-visible:ring-0" />
            </div>
          </Field>
        </Card>

        <Button onClick={submit} disabled={saving} size="lg" className="w-full bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full h-12 neon-glow">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {saving ? 'Saving...' : (profile ? 'Save Changes' : 'Create Profile & Discover Partners')}
        </Button>
      </div>
    </div>
  )
}

function VerificationBadge({ verified }) {
  if (!verified) return null
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500" title="Verified">
      <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
    </span>
  )
}

function ProfileCard({ profile, onLike, onSkip, onReport }) {
  const [photoIdx, setPhotoIdx] = useState(0)
  const photos = profile.photos || []
  return (
    <div className="snap-start min-h-[calc(100vh-4rem)] flex items-center py-4 md:py-8">
      <Card className="glass-strong border-white/10 overflow-hidden w-full max-w-md mx-auto rounded-3xl">
        <div className="relative aspect-[3/4] bg-white/5">
          {photos[photoIdx] ? (
            <img src={photos[photoIdx]} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30"><Users className="w-16 h-16" /></div>
          )}
          {photos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 flex gap-1">
              {photos.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition ${i === photoIdx ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          )}
          <button onClick={() => setPhotoIdx(i => Math.max(0, i-1))} className="absolute left-0 top-0 w-1/3 h-full" aria-label="Prev" />
          <button onClick={() => setPhotoIdx(i => Math.min(photos.length-1, i+1))} className="absolute right-0 top-0 w-1/3 h-full" aria-label="Next" />

          {profile.online && (
            <div className="absolute top-4 right-4 glass rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-xs font-medium">Online</span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5 pt-16">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl font-extrabold">{profile.name}, {profile.age}</h3>
              <VerificationBadge verified={profile.verified} />
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70 mt-1 flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.city}</span>
              <span>·</span>
              <span>{profile.gymName}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Badge className="bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/30 hover:bg-[#00ff88]/15">{profile.goal}</Badge>
              <Badge className="bg-white/10 text-white border-white/15 hover:bg-white/10">{profile.level}</Badge>
              <Badge className="bg-white/10 text-white border-white/15 hover:bg-white/10"><Clock className="w-3 h-3 mr-1" />{profile.timing}</Badge>
            </div>
          </div>
        </div>

        <div className="p-5">
          {profile.bio && <p className="text-sm text-white/80 leading-relaxed">"{profile.bio}"</p>}
          {profile.instagram && (
            <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-white/60 mt-3 hover:text-[#00ff88]">
              <Instagram className="w-3.5 h-3.5" /> @{profile.instagram}
            </a>
          )}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <Button onClick={() => onSkip(profile)} variant="outline" className="rounded-xl bg-white/5 border-white/10 hover:bg-white/10 h-12">
              <X className="w-5 h-5" />
            </Button>
            <Button onClick={() => onLike(profile)} className="rounded-xl bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold h-12">
              <Heart className="w-5 h-5 mr-1.5 fill-black" /> Connect
            </Button>
            <Button onClick={() => onReport(profile)} variant="outline" className="rounded-xl bg-white/5 border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 h-12">
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
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="vo" className="text-sm">Verified users only</Label>
            <Switch id="vo" checked={local.verifiedOnly} onCheckedChange={v => set('verifiedOnly', v)} />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={() => { const blank = { city: '', gym: '', goal: '', timing: '', gender: '', level: '', verifiedOnly: false }; setLocal(blank); setFilters(blank); onApply?.(blank) }} variant="outline" className="flex-1 bg-white/5 border-white/10">Reset</Button>
            <Button onClick={() => { setFilters(local); onApply?.(local) }} className="flex-1 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold">Apply</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Discover() {
  const [filters, setFilters] = useState({ city: '', gym: '', goal: '', timing: '', gender: '', level: '', verifiedOnly: false })
  const [profiles, setProfiles] = useState(null)
  const [reportProfile, setReportProfile] = useState(null)
  const [reportReason, setReportReason] = useState('')

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

  const submitReport = async () => {
    if (!reportReason.trim()) return
    try {
      await fetch('/api/reports', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: reportProfile.id, reason: reportReason }) })
      await fetch('/api/blocks', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: reportProfile.id }) })
      toast.success('Report submitted. User blocked.')
      setProfiles(prev => (prev || []).filter(x => x.id !== reportProfile.id))
      setReportProfile(null); setReportReason('')
    } catch { toast.error('Failed to report') }
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

      <div className="max-w-md mx-auto px-4 snap-y snap-mandatory">
        {profiles === null && (
          <div className="space-y-4 pt-6"><Skeleton className="h-[600px] rounded-3xl bg-white/5" /></div>
        )}
        {profiles && profiles.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-[#00ff88]" />
            </div>
            <h3 className="text-xl font-bold">No more partners right now</h3>
            <p className="text-white/60 mt-1 text-sm">Try changing your filters or check back soon.</p>
            <Button onClick={() => load({ city: '', gym: '', goal: '', timing: '', gender: '', level: '', verifiedOnly: false })} variant="outline" className="mt-5 bg-white/5 border-white/10">Reset filters</Button>
          </div>
        )}
        {profiles?.map(p => (
          <ProfileCard key={p.id} profile={p} onLike={handleLike} onSkip={handleSkip} onReport={setReportProfile} />
        ))}
      </div>

      <Dialog open={!!reportProfile} onOpenChange={(o) => !o && setReportProfile(null)}>
        <DialogContent className="bg-[#0a0b0d] border-white/10">
          <DialogHeader><DialogTitle>Report {reportProfile?.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-white/60">Help us keep Trainr safe. They will also be blocked.</p>
          <Textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Reason (e.g. inappropriate messages, fake profile, harassment)..." className="bg-white/5 border-white/10" />
          <Button onClick={submitReport} className="bg-red-500 hover:bg-red-600 text-white">Submit Report & Block</Button>
        </DialogContent>
      </Dialog>
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
          <button key={m.id} onClick={() => onOpenChat(m)} className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.06] transition text-left">
            <Avatar className="w-14 h-14">
              <AvatarImage src={m.otherProfile?.photos?.[0]} />
              <AvatarFallback>{m.otherProfile?.name?.slice(0,1)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{m.otherProfile?.name}, {m.otherProfile?.age}</span>
                <VerificationBadge verified={m.otherProfile?.verified} />
                {m.otherProfile?.online && <div className="w-2 h-2 rounded-full bg-[#00ff88]" />}
              </div>
              <div className="text-xs text-white/60 truncate">{m.otherProfile?.gymName} · {m.otherProfile?.goal}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </button>
        ))}
      </div>
    </div>
  )
}

function Chat({ match, currentUserId, onBack }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const scrollerRef = useRef(null)

  const load = async () => {
    try {
      const res = await fetch(`/api/messages?matchId=${match.id}`, { credentials: 'include' })
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {}
  }
  useEffect(() => {
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [match.id]) // eslint-disable-line
  useEffect(() => { scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!text.trim()) return
    const t = text.trim()
    setText('')
    try {
      const res = await fetch('/api/messages', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: match.id, text: t }) })
      const data = await res.json()
      if (data.message?.flagged) toast.warning('Your message was flagged. Repeated violations lead to suspension.')
      load()
    } catch { toast.error('Failed to send') }
  }

  return (
    <div className="pt-16 h-screen flex flex-col">
      <div className="border-b border-white/10 glass-strong">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
          <Avatar className="w-9 h-9"><AvatarImage src={match.otherProfile?.photos?.[0]} /><AvatarFallback>{match.otherProfile?.name?.slice(0,1)}</AvatarFallback></Avatar>
          <div>
            <div className="font-semibold text-sm flex items-center gap-1.5">{match.otherProfile?.name} <VerificationBadge verified={match.otherProfile?.verified} /></div>
            <div className="text-xs text-white/50">{match.otherProfile?.online ? 'Online now' : 'Offline'}</div>
          </div>
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
                  <div className="text-sm leading-relaxed">{m.text}</div>
                  <div className={`text-[10px] mt-1 ${mine ? 'text-black/50' : 'text-white/40'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="border-t border-white/10 glass-strong">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message..." className="bg-white/5 border-white/10" />
          <Button onClick={send} className="bg-[#00ff88] hover:bg-[#00cc6a] text-black rounded-full" size="icon"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  )
}

function SettingsView({ user, profile, onEditProfile, onLogout, onProfileUpdated }) {
  const [showSelfie, setShowSelfie] = useState(false)
  return (
    <div className="pt-20 pb-12 max-w-2xl mx-auto px-4 md:px-6">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight">Settings</h1>
      <div className="mt-6 space-y-3">
        <Card className="glass border-white/10 p-5 flex items-center gap-4">
          <Avatar className="w-14 h-14"><AvatarImage src={profile?.photos?.[0] || user.picture} /><AvatarFallback>{user.name?.slice(0,1)}</AvatarFallback></Avatar>
          <div className="flex-1">
            <div className="font-semibold flex items-center gap-1.5">{profile?.name || user.name} <VerificationBadge verified={profile?.verified} /></div>
            <div className="text-sm text-white/60">{user.email}</div>
          </div>
          <Button onClick={onEditProfile} variant="outline" className="bg-white/5 border-white/10">Edit</Button>
        </Card>
        <Card className="glass border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Verification</h3>
            {profile?.verified && <Badge className="bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/30">Verified ✓</Badge>}
          </div>
          <div className="space-y-2 text-sm mb-4">
            <Row icon={CheckCircle2} label="Selfie verification" status={profile?.verifications?.selfie} />
            <Row icon={Instagram} label="Instagram linked" status={profile?.verifications?.instagram} />
            <Row icon={Dumbbell} label="Verified gym member" status={profile?.verifications?.gym} />
          </div>
          {!profile?.verifications?.selfie && (
            <Button onClick={() => setShowSelfie(true)} className="w-full bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold">
              <Camera className="w-4 h-4 mr-2" /> Verify with Selfie
            </Button>
          )}
          {profile?.verifications?.selfie && (
            <p className="text-xs text-[#00ff88]/80">{`Selfie verified. You've earned the trusted badge.`}</p>
          )}
        </Card>
        <button onClick={onLogout} className="w-full glass rounded-2xl p-5 flex items-center gap-3 hover:bg-red-500/10 transition text-red-400">
          <LogOut className="w-5 h-5" /> <span className="font-semibold">Log out</span>
        </button>
      </div>
      <SelfieVerifyDialog open={showSelfie} onOpenChange={setShowSelfie} onVerified={(p) => onProfileUpdated?.(p)} />
    </div>
  )
}

function Row({ icon: Icon, label, status }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-white/50" /> {label}</div>
      {status ? <Badge className="bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/30">Verified</Badge> : <Badge variant="outline" className="bg-white/5 border-white/10 text-white/50">Pending</Badge>}
    </div>
  )
}

function SelfieVerifyDialog({ open, onOpenChange, onVerified }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle | streaming | captured | submitting
  const [snap, setSnap] = useState(null)
  const [error, setError] = useState(null)

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
    } catch (e) {
      setError('Camera access denied. Please allow camera permissions and try again.')
      setPhase('idle')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
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
    // Mirror + crop center square
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
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selfie: snap }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      toast.success('Selfie verified!', { description: 'Your blue badge is now active.' })
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
          {/* Face guide */}
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

// ============ STATIC PAGES ============
function PageShell({ title, kicker, children, onNav }) {
  return (
    <div className="pt-28 pb-20 fade-up">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <button onClick={() => onNav('landing')} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-[#00ff88] transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
        {kicker && <Badge className="mb-4 bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30 rounded-full px-3 py-1">{kicker}</Badge>}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight">{title}</h1>
        <div className="mt-10 space-y-6 text-white/75 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}

function AboutView({ onNav }) {
  return (
    <PageShell title="Built for the lifters who show up." kicker="About Trainr" onNav={onNav}>
      <p className="text-lg md:text-xl text-white/80">
        Trainr is your fitness accountability network. We help people in India find verified workout partners nearby — matched by gym, training schedule, goals, and experience level. No swiping. No dating. Just consistent, community-driven progress.
      </p>

      <div className="grid md:grid-cols-2 gap-4 pt-4">
        {[
          { i: Target, t: 'Why Trainr exists', d: 'Most fitness journeys fail alone. We make showing up easier by giving every lifter a partner who shares their goal and schedule.' },
          { i: Users, t: 'Accountability culture', d: 'Trainr isn\u2019t a feed of highlight reels. It\u2019s a network where someone is waiting for you at the rack.' },
          { i: ShieldCheck, t: 'Women safety commitment', d: 'Strict moderation, verified profiles, anti-creep filters and zero-tolerance on harassment. Reports are reviewed within 24 hours.' },
          { i: BadgeCheck, t: 'Verified profiles', d: 'Selfie verification, Instagram linking, and gym membership checks build trust before the first message.' },
          { i: Sparkles, t: 'Future vision', d: 'Workout streaks, partner check-ins, gym-level leaderboards, and trusted certified-trainer connections \u2014 coming soon.' },
          { i: Activity, t: 'Built in India', d: 'For lifters in Mumbai, Bangalore, Delhi and beyond. Local gyms, local schedules, local community.' },
        ].map((b, i) => (
          <div key={i} className="glass rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center mb-3"><b.i className="w-5 h-5 text-[#00ff88]" /></div>
            <h3 className="font-bold text-white">{b.t}</h3>
            <p className="text-sm text-white/65 mt-1.5">{b.d}</p>
          </div>
        ))}
      </div>

      <div className="glass-strong rounded-3xl p-8 md:p-10 mt-6">
        <h3 className="text-2xl font-extrabold">Our mission</h3>
        <p className="mt-3 text-white/75">To make consistent training the default, not the exception. We do that by making it absurdly easy to find a trustworthy training partner — and by building a community that\u2019s safe, respectful, and proudly fitness-first.</p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Button onClick={loginWithGoogle} className="bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full">Get Started <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
          <Button onClick={() => onNav('contact')} variant="outline" className="bg-white/5 border-white/15 rounded-full">Contact us</Button>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Button variant="outline" className="bg-white/5 border-white/15 rounded-full"><Instagram className="w-4 h-4 mr-2" /> @trainr.in</Button></a>
        </div>
      </div>
    </PageShell>
  )
}

function PrivacyView({ onNav }) {
  const Section = ({ title, children }) => (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-2 text-sm text-white/70 leading-relaxed space-y-2">{children}</div>
    </div>
  )
  return (
    <PageShell title="Privacy Policy" kicker="Last updated: 2025" onNav={onNav}>
      <p className="text-white/70">Trainr (trainr.in) is committed to protecting your privacy and building a safe fitness community. This page explains what we collect, how we use it, and how we keep you safe.</p>

      <div className="grid gap-4">
        <Section title="What we collect">
          <p>Account info from Google Sign-in (name, email, profile picture), and the fitness profile you create: photos, age, gender, city, gym, height, weight, goals, schedule, bio, and optional Instagram username.</p>
        </Section>
        <Section title="Profile photos & uploads">
          <p>You may upload 3 to 5 photos. By uploading, you confirm they are of you and that you have rights to use them. We may auto-flag images that violate our community standards.</p>
        </Section>
        <Section title="Profile verification">
          <p>Verification (selfie, Instagram, gym membership) is optional but strongly encouraged. Verified profiles get a blue badge and higher visibility.</p>
        </Section>
        <Section title="Moderation & reporting">
          <p>All chat messages pass through automated moderation. Reports are reviewed within 24 hours. We follow a clear escalation: <strong>Warning → Temporary suspension → Permanent ban</strong>.</p>
        </Section>
        <Section title="Anti-harassment policy">
          <p>Trainr has zero tolerance for sexual content, harassment, hate speech, or any unwanted advance. Repeated violations result in a permanent ban without refund.</p>
        </Section>
        <Section title="Women safety">
          <p>Women safety is a core priority. Anti-creep detection, easy one-tap report and block, women-only filter options, and strict verification standards are baked into the product.</p>
        </Section>
        <Section title="Your data, your control">
          <p>You can edit, hide or delete your profile anytime from Settings. To request full account deletion, email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00ff88] underline">{SUPPORT_EMAIL}</a>.</p>
        </Section>
        <Section title="Contact">
          <p>For privacy questions, write to <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00ff88] underline">{SUPPORT_EMAIL}</a> or DM us on Instagram <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-[#00ff88] underline">@trainr.in</a>.</p>
        </Section>
      </div>
    </PageShell>
  )
}

function ContactView({ onNav }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) { toast.error('Please fill all fields'); return }
    setSending(true)
    // MOCKED: would POST to /api/contact in production
    await new Promise(r => setTimeout(r, 700))
    setSending(false)
    setForm({ name: '', email: '', message: '' })
    toast.success('Message sent!', { description: `We'll get back to you at ${form.email} within 24 hours.` })
  }
  return (
    <PageShell title="Talk to the Trainr team." kicker="Contact" onNav={onNav}>
      <p className="text-white/70 max-w-2xl">Trainr is committed to building a safe and supportive fitness community. Have a question, a partnership idea, or a safety concern? Reach out — we read every message.</p>

      <div className="grid md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-3">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="block glass rounded-2xl p-5 hover:bg-white/[0.07] transition">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Email</div>
            <div className="font-semibold text-[#00ff88]">{SUPPORT_EMAIL}</div>
            <div className="text-xs text-white/50 mt-1">For support, partnerships, press</div>
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="block glass rounded-2xl p-5 hover:bg-white/[0.07] transition">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Instagram</div>
            <div className="font-semibold text-[#00ff88] flex items-center gap-2"><Instagram className="w-4 h-4" /> @trainr.in</div>
            <div className="text-xs text-white/50 mt-1">DMs open · daily updates · community spotlights</div>
          </a>
          <div className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Response time</div>
            <div className="font-semibold">Within 24 hours</div>
            <div className="text-xs text-white/50 mt-1">Safety reports prioritized within 4 hours.</div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Community support</div>
            <div className="font-semibold">Built on trust</div>
            <div className="text-xs text-white/50 mt-1">Every report is read by a real human. No bots.</div>
          </div>
        </div>

        <form onSubmit={submit} className="glass-strong rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-white/50">Your name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-white/50">Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-white/50">Message</Label>
            <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="bg-white/5 border-white/10 min-h-[140px]" placeholder="What\u2019s on your mind?" />
          </div>
          <Button type="submit" disabled={sending} className="w-full bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full h-11">
            {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <>Send Message <ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
          <p className="text-xs text-white/40 text-center">Trainr is committed to building a safe and supportive fitness community.</p>
        </form>
      </div>
    </PageShell>
  )
}


function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [view, setView] = useState('landing')
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState(null)

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
          // Fetch full profile
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black ring-1 ring-[#00ff88]/40 shadow-2xl shadow-[#00ff88]/30 animate-pulse-glow">
            <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2.5 text-white/60 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-[#00ff88]" />
            <span>Loading Trainr...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} view={view} setView={setView} />
      {!user && view === 'landing' && <Landing onNav={setView} />}
      {!user && view === 'about' && <AboutView onNav={setView} />}
      {!user && view === 'privacy' && <PrivacyView onNav={setView} />}
      {!user && view === 'contact' && <ContactView onNav={setView} />}
      {user && view === 'profile-edit' && <ProfileEditor user={user} profile={profile} onSaved={handleProfileSaved} />}
      {user && view === 'discover' && (profile ? <Discover /> : <ProfileEditor user={user} profile={null} onSaved={handleProfileSaved} />)}
      {user && view === 'matches' && <Matches onOpenChat={(m) => { setActiveChat(m); setView('chat') }} />}
      {user && view === 'chat' && activeChat && <Chat match={activeChat} currentUserId={user.id} onBack={() => { setActiveChat(null); setView('matches') }} />}
      {user && view === 'settings' && <SettingsView user={user} profile={profile} onEditProfile={() => setView('profile-edit')} onLogout={handleLogout} onProfileUpdated={(p) => setProfile(p)} />}
    </div>
  )
}

export default App
