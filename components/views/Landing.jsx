'use client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, Sparkles, MapPin, Target, MessageCircle, BadgeCheck, ShieldCheck,
  Clock, Users, Activity, AlertTriangle, Lock, Star, Flame, Instagram,
} from 'lucide-react'
import { HERO_IMG, LOGO, INSTAGRAM_URL, SUPPORT_EMAIL } from '@/lib/client/constants'
import { loginWithGoogle } from '@/lib/client/utils'

export default function Landing({ onNav }) {
  return (
    <div className="pt-16">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-28 pb-16 md:pb-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="fade-up">
              <Badge className="mb-5 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15 border-sky-400/30 rounded-full px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1.5" /> Premium fitness network
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">
                Find your <span className="text-gradient">gym partner.</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-white/70 max-w-lg leading-relaxed">
                Built for accountability, not dating.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button onClick={loginWithGoogle} size="lg" className="bg-[#24d18f] hover:bg-[#17b978] text-black font-semibold rounded-full h-12 px-7 text-base neon-glow">
                  Find partners near me <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} variant="outline" size="lg" className="rounded-full h-12 px-7 text-base bg-white/5 border-white/15 hover:bg-white/10 text-white">
                  Explore Partners
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-white/60">
                <div className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#24d18f]" /> Verified profiles</div>
                <div className="flex items-center gap-2"><Target className="w-4 h-4 text-sky-300" /> Matched by gym & goals</div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#24d18f]" /> Safety-first community</div>
              </div>
            </div>
            <div className="relative fade-up" style={{ animationDelay: '0.15s' }}>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden glass-strong">
                <img src={HERO_IMG} alt="Trainr" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="glass rounded-2xl p-4 animate-float">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#24d18f]/20 flex items-center justify-center"><Flame className="w-5 h-5 text-[#24d18f]" /></div>
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
                  <div className="w-2 h-2 rounded-full bg-[#24d18f] animate-pulse" />
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
            <Badge className="mb-4 bg-white/5 text-white/70 border-white/10">What you get</Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">A real network behind <br/><span className="text-gradient">every workout.</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Sparkles, title: 'Smart Matching', desc: 'Matched by gym, schedule, goal and experience — so you actually train together.' },
              { icon: MapPin, title: 'Nearby Gym Partners', desc: 'See lifters at your gym, training when you train.' },
              { icon: Target, title: 'Workout Accountability', desc: 'Show up because someone is waiting at the rack.' },
              { icon: MessageCircle, title: 'In-App Chat', desc: 'Coordinate sessions, share PRs, send a quick "you in for 6am?".' },
              { icon: BadgeCheck, title: 'Verified Profiles', desc: 'Selfie, Instagram and gym checks — trust before the first message.' },
              { icon: ShieldCheck, title: 'Women Safety Focus', desc: '24/7 moderation, anti-creep filters, one-tap block and report.' },
              { icon: Clock, title: 'Schedule Matching', desc: 'Find partners who train at your timing — morning, evening or late night.' },
              { icon: Users, title: 'Community First', desc: 'No swiping, no dating. Just lifters helping lifters.' },
              { icon: Activity, title: 'Track Together', desc: 'Coming soon: streaks, check-ins and shared session logs.' },
            ].map((f, i) => (
              <div key={i} className="group glass rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/15 transition-colors fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="w-11 h-11 rounded-xl bg-[#24d18f]/10 border border-[#24d18f]/20 flex items-center justify-center mb-4 group-hover:bg-[#24d18f]/15 transition">
                  <f.icon className="w-5 h-5 text-[#24d18f]" />
                </div>
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="text-sm text-white/60 mt-1.5 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative bg-gradient-to-b from-transparent via-[#24d18f]/[0.02] to-transparent">
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
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#24d18f]/10 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <Badge className="mb-4 bg-pink-500/10 text-pink-300 border-pink-500/30">Safety first</Badge>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">A safer place to train.</h2>
                <p className="mt-4 text-white/70 max-w-md">Every report is read by a real person within 24 hours. Strict moderation, automatic message filters, and zero tolerance for harassment — built into the product, not bolted on later.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { i: ShieldCheck, t: 'Verified Users', d: 'Selfie + ID checks' },
                  { i: AlertTriangle, t: 'Report System', d: '24/7 moderation' },
                  { i: Lock, t: 'Anti-Creep', d: 'Auto message filters' },
                  { i: Users, t: 'Safe Community', d: 'Warning → Ban escalation' },
                ].map((s, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <s.i className="w-5 h-5 text-[#24d18f] mb-2" />
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
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-[#24d18f] text-[#24d18f]" />)}
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
            <div className="absolute inset-0 bg-gradient-to-br from-[#24d18f]/10 via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight">Start Your Fitness <br /><span className="text-gradient">Journey Together.</span></h2>
              <p className="mt-5 text-white/70 max-w-md mx-auto">Join thousands of lifters showing up — together — every single day.</p>
              <Button onClick={loginWithGoogle} size="lg" className="mt-8 bg-[#24d18f] hover:bg-[#17b978] text-black font-semibold rounded-full h-12 px-8 text-base neon-glow">
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
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-black ring-1 ring-[#24d18f]/30">
                  <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" />
                </div>
                <span className="font-extrabold text-white text-lg">Trainr</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">Your fitness accountability network. Find verified workout partners nearby. Built in India.</p>
              <div className="flex items-center gap-3 mt-4">
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#24d18f]/15 hover:text-[#24d18f] flex items-center justify-center transition border border-white/10">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-xs text-white/50 hover:text-[#24d18f] transition">{SUPPORT_EMAIL}</a>
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
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#24d18f]" /> Safety-first community</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
