'use client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, Sparkles, MapPin, Target, MessageCircle, BadgeCheck, ShieldCheck,
  Clock, Users, Activity, AlertTriangle, Lock, Star, Flame, Instagram,
} from 'lucide-react'
import { LOGO, INSTAGRAM_URL, SUPPORT_EMAIL } from '@/lib/client/constants'
import { loginWithGoogle } from '@/lib/client/utils'

export default function Landing({ onNav }) {
  return (
    <div className="pt-16 bg-[#F8FAFC]">
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-500/5 via-transparent to-transparent">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-28 pb-16 md:pb-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="fade-up">
              <Badge className="mb-5 bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 rounded-full px-3 py-1 font-semibold text-xs transition">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-sky-500" /> Premium fitness network
              </Badge>
              <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
                Find your <span className="text-gradient">gym partner.</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed font-medium">
                Built for accountability, not dating.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 flex-wrap">
                <Button onClick={loginWithGoogle} size="lg" className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369a1] text-white font-semibold rounded-full h-12 px-6 text-sm shadow-md shadow-sky-500/10 transition active:scale-[0.98]">
                  Continue with Google
                </Button>
                <Button onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('trainr:open-auth', { detail: { tab: 'phone' } }))
                  }
                }} size="lg" className="bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-full h-12 px-6 text-sm shadow-md transition active:scale-[0.98]">
                  Continue with Phone
                </Button>
                <Button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} variant="outline" size="lg" className="rounded-full h-12 px-6 text-sm border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition">
                  Explore Features
                </Button>
              </div>
              
              {/* Trust Strip */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600 bg-slate-100/60 border border-slate-200/50 rounded-2xl p-4 font-medium">
                <div className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-sky-500" /> Verified profiles</div>
                <div className="flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500" /> Matched by gym & goals</div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-sky-500" /> Safety-first community</div>
              </div>
            </div>

            {/* Premium Mockup Graphic */}
            <div className="relative fade-up" style={{ animationDelay: '0.15s' }}>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-sky-100/80 via-white to-emerald-50/50 border border-slate-200 shadow-xl flex flex-col items-center justify-center p-6 md:p-8">
                {/* Visual Representation of Gym Partner Card */}
                <div className="w-full max-w-[270px] bg-white rounded-2xl border border-slate-200/80 shadow-lg p-5 space-y-4 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop" alt="Aanya" className="w-full h-full object-cover" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-1">Aanya K. <BadgeCheck className="w-3.5 h-3.5 text-sky-500" /></div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> Cult Fit · 0.8 km away</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Powerlifting</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">6:00 AM</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-600 font-medium">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Why you match</div>
                    Same workouts goals, schedule & home gym
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <div className="absolute -top-4 -right-4 bg-white border border-slate-200 shadow-md rounded-2xl px-4 py-3 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-xs font-semibold text-slate-700">12 active near you</span>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur border border-slate-200/80 rounded-2xl p-4 shadow-lg animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center"><Flame className="w-5 h-5 text-[#0EA5E9]" /></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Connection found near Cult Fit</div>
                    <div className="text-xs text-slate-500">Same goal · Powerlifting · 6AM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-24 relative bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4 bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">What you get</Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">A real network behind <br/><span className="text-gradient">every workout.</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: 'Smart Matching', desc: 'Matched by gym, schedule, goal and experience — so you actually train together.', color: 'sky' },
              { icon: BadgeCheck, title: 'Verified Profiles', desc: 'Selfie, Instagram and gym checks — trust before you send the first message.', color: 'sky' },
              { icon: ShieldCheck, title: 'Safety-First Focus', desc: '24/7 moderation, anti-creep filters, one-tap block and report mechanisms.', color: 'emerald' },
            ].map((f, i) => (
              <div key={i} className="group bg-white border border-slate-200/70 rounded-2xl p-8 hover:shadow-xl hover:border-slate-300 transition-all duration-300 fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition duration-200 ${f.color === 'emerald' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-sky-50 border border-sky-100 text-sky-600'}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl text-slate-800">{f.title}</h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 md:py-24 relative bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4 bg-white border-slate-200 text-slate-600 hover:bg-white">How it works</Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Four steps to your <span className="text-gradient">strongest year.</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { n: '01', t: 'Create Profile', d: 'Tell us your gym, goals and schedule.' },
              { n: '02', t: 'Discover Partners', d: 'Browse a clean feed of matched lifters.' },
              { n: '03', t: 'Connect & Chat', d: 'Mutual connection unlocks chat.' },
              { n: '04', t: 'Train Together', d: 'Show up. Stay consistent. Grow.' },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                <div className="text-5xl font-black text-slate-100 select-none">{s.n}</div>
                <h3 className="font-bold text-lg text-slate-800 mt-2">{s.t}</h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-20 md:py-24 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="bg-slate-50 border border-slate-200/70 rounded-3xl p-8 md:p-14 relative overflow-hidden shadow-sm">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-sky-500/5 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <Badge className="mb-4 bg-red-50 text-red-700 border-red-200 hover:bg-red-50 font-semibold">Safety first</Badge>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">A safer place to train.</h2>
                <p className="mt-4 text-slate-600 leading-relaxed">Every report is read by a real person within 24 hours. Strict moderation, automatic message filters, and zero tolerance for harassment — built into the product, not bolted on later.</p>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { i: ShieldCheck, t: 'Verified Users', d: 'Selfie + ID checks' },
                  { i: AlertTriangle, t: 'Report System', d: '24/7 moderation' },
                  { i: Lock, t: 'Anti-Creep', d: 'Auto message filters' },
                  { i: Users, t: 'Safe Community', d: 'Warning → Ban escalation' },
                ].map((s, i) => (
                  <div key={i} className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-sm">
                    <s.i className="w-5 h-5 text-sky-500 mb-2.5" />
                    <div className="font-bold text-slate-800 text-sm">{s.t}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">{s.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-24 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Lifters love Trainr.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: 'Aanya K.', r: 'Found a women-only training crew at my gym in 2 days. Game changer.', g: 'Pilates · Mumbai' },
              { n: 'Arjun M.', r: 'My deadlift PR jumped 30kg with consistent partners. The accountability is real.', g: 'Powerlifting · Bangalore' },
              { n: 'Priya N.', r: 'I felt safe from day one. Verified profiles + tight moderation = peace of mind.', g: 'Powerlifting · Delhi' },
            ].map((t, i) => (
              <div key={i} className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex gap-0.5 mb-3.5">
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />)}
                  </div>
                  <p className="text-slate-700 leading-relaxed italic">"{t.r}"</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{t.n}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.g}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="relative bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] rounded-3xl p-10 md:p-16 text-center overflow-hidden shadow-xl shadow-sky-500/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">Start Your Fitness <br />Journey Together.</h2>
              <p className="mt-5 text-sky-50 max-w-md mx-auto leading-relaxed">Join thousands of lifters showing up — together — every single day.</p>
              <Button onClick={loginWithGoogle} size="lg" className="mt-8 bg-white hover:bg-slate-50 text-sky-600 hover:text-sky-700 font-bold rounded-full h-12 px-8 text-base shadow-lg transition active:scale-[0.98]">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4 group">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 transition">
                  <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" width={36} height={36} />
                </div>
                <span className="font-extrabold text-slate-800 text-lg">Trainr</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">Your fitness accountability network. Find verified workout partners nearby. Built in India.</p>
              <div className="flex items-center gap-3 mt-5">
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-slate-50 hover:bg-sky-50 hover:text-sky-500 text-slate-400 flex items-center justify-center transition border border-slate-200">
                  <Instagram className="w-4.5 h-4.5" />
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-xs text-slate-400 hover:text-sky-500 font-medium transition">{SUPPORT_EMAIL}</a>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4">Product</div>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-600 hover:text-sky-500 transition font-medium">Features</button></li>
                <li><button onClick={loginWithGoogle} className="text-slate-600 hover:text-sky-500 transition font-medium">Get Started</button></li>
                <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-sky-500 transition font-medium">Instagram</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4">Company</div>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => onNav('about')} className="text-slate-600 hover:text-sky-500 transition font-medium">About</button></li>
                <li><button onClick={() => onNav('privacy')} className="text-slate-600 hover:text-sky-500 transition font-medium">Privacy Policy</button></li>
                <li><button onClick={() => onNav('privacy')} className="text-slate-600 hover:text-sky-500 transition font-medium">Terms</button></li>
                <li><button onClick={() => onNav('contact')} className="text-slate-600 hover:text-sky-500 transition font-medium">Contact</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row gap-4 items-center justify-between text-xs text-slate-400">
            <div>© 2025 Trainr · trainr.in · All rights reserved.</div>
            <div className="flex items-center gap-1.5 font-medium"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Safety-first community</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
