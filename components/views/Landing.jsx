'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, Sparkles, MapPin, Target, MessageCircle, BadgeCheck, ShieldCheck,
  Clock, Users, Activity, AlertTriangle, Lock, Star, Flame, Instagram, CheckCircle2,
  Dumbbell, Compass, HeartHandshake, Shield, UserCheck, Check,
} from 'lucide-react'
import { LOGO, INSTAGRAM_URL, SUPPORT_EMAIL } from '@/lib/client/constants'
import { loginWithGoogle } from '@/lib/client/utils'

export default function Landing({ onNav }) {
  const openAuthModal = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trainr:open-auth', { detail: { tab: 'phone' } }))
    }
  }

  const navigateTo = (route) => {
    if (typeof onNav === 'function') {
      onNav(route)
    } else if (typeof window !== 'undefined') {
      window.location.href = `/${route}`
    }
  }

  const heroContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  }

  const heroItem = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
  }

  return (
    <div className="pt-16 bg-[#F8FAFC]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-500/5 via-transparent to-transparent">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Staggered Content */}
            <motion.div
              variants={heroContainer}
              initial="hidden"
              animate="show"
              className="lg:col-span-7 space-y-6"
            >
              <motion.div variants={heroItem}>
                <Badge className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 rounded-full px-3.5 py-1.5 font-semibold text-xs transition">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-sky-500" /> Fitness Accountability Network
                </Badge>
              </motion.div>
              
              <motion.h1 variants={heroItem} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.12] tracking-tight text-slate-900">
                Find your gym partner. <br className="hidden sm:inline" />
                <span className="text-gradient">Stay consistent together.</span>
              </motion.h1>
              
              <motion.p variants={heroItem} className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-normal">
                Working out alone is hard enough. Finding someone who trains at a similar time, shares your goals and actually shows up should not be.
              </motion.p>

              <motion.p variants={heroItem} className="text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed">
                Trainr helps you discover compatible workout partners nearby — based on your gym, fitness goals, preferred workout schedule and experience level. Whether you are starting your fitness journey, chasing a new personal best or simply trying to stay consistent, the right training partner can make all the difference.
              </motion.p>
              
              <motion.div variants={heroItem} className="flex flex-col sm:flex-row gap-3 pt-2">
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={openAuthModal} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369a1] text-white font-bold rounded-full h-12 px-7 text-sm shadow-md shadow-sky-500/20">
                    Find a Workout Partner <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} variant="outline" size="lg" className="w-full sm:w-auto rounded-full h-12 px-6 text-sm border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm">
                    See How It Works
                  </Button>
                </motion.div>
              </motion.div>
              
              {/* Trust Strip */}
              <motion.div
                variants={heroItem}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm text-slate-700 bg-white border border-slate-200/80 rounded-2xl p-4 font-semibold shadow-sm"
              >
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" /> Fitness accountability</div>
                <div className="flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500 shrink-0" /> Match by gym & goals</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-sky-500 shrink-0" /> Connect at own pace</div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" /> Report & block tools</div>
              </motion.div>
            </motion.div>

            {/* Right Column: Hero Visual Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="lg:col-span-5 relative"
            >
              <div className="relative aspect-[4/5] max-w-md mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50/60 border border-slate-200/90 shadow-2xl flex flex-col justify-between p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Today's Workout Partner</h4>
                      <p className="text-[11px] text-slate-500">Matched by 7:00 AM Legs & Strength</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px]">
                    <BadgeCheck className="w-3 h-3 mr-1 text-emerald-600 inline" /> Verified
                  </Badge>
                </div>

                <div className="space-y-3 bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Gold's Gym, Bandra West</span>
                    <span className="text-sky-600 font-bold">0.8 km away</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">Hypertrophy</span>
                    <span className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">Morning 6-8 AM</span>
                    <span className="text-[11px] bg-sky-50 text-sky-700 font-medium px-2 py-0.5 rounded-md">Intermediate</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Consistency: 5 days / week</span>
                    <span className="text-emerald-600 font-bold">100% Match</span>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-4 text-center space-y-1">
                  <p className="text-xs font-medium text-slate-300">"See you at the squat rack tomorrow morning."</p>
                  <p className="text-[11px] text-sky-400 font-bold">Turn "I should workout" into "See you at the gym."</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. CONSISTENCY SECTION */}
      <section className="py-16 md:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-6">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 text-xs font-bold">
            The Power of Accountability
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Consistency is easier when someone is counting on you.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Most people do not quit because they do not care about fitness. They stop because routines get busy, motivation drops and showing up alone becomes easy to postpone.
          </p>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            A good training partner changes that. Someone waiting at the gym makes the morning alarm easier. Someone chasing a similar goal gives you momentum. Someone who understands your routine helps you stay committed when motivation is low.
          </p>
          <div className="p-6 bg-sky-50/80 border border-sky-200/60 rounded-2xl">
            <p className="text-lg sm:text-xl font-bold text-sky-900">
              Trainr is built to turn <span className="underline decoration-sky-400">"I should work out"</span> into <span className="text-sky-600">"See you at the gym."</span>
            </p>
          </div>
        </div>
      </section>

      {/* 3. FOUR SIMPLE STEPS (HOW IT WORKS) */}
      <section id="how-it-works" className="py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <Badge className="bg-sky-50 text-sky-700 border-sky-200 px-3 py-1 text-xs font-bold">
            Simple Workflow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Find the right person to train with in four simple steps.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '1',
              title: 'Build your fitness profile',
              desc: 'Tell us about your city, gym, training goals, schedule and experience level. Your profile helps Trainr show you people whose routines are more likely to fit yours.',
              icon: Target,
            },
            {
              step: '2',
              title: 'Discover compatible workout partners',
              desc: 'Explore people nearby who are looking for the same kind of accountability. Filter based on what matters to you - from training goals and preferred workout time to fitness level and location.',
              icon: Compass,
            },
            {
              step: '3',
              title: 'Connect when it feels right',
              desc: 'Review profiles, send a connection request and start a conversation after mutual interest. There is no pressure to connect with anyone who does not feel like a fit.',
              icon: HeartHandshake,
            },
            {
              step: '4',
              title: 'Show up and build momentum',
              desc: 'Plan a session, meet at a public gym or workout space and start building a routine together. One consistent workout can become a habit. A habit can change everything.',
              icon: Flame,
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-extrabold text-lg">
                    {item.step}
                  </div>
                  <item.icon className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MORE THAN A MATCH */}
      <section className="py-16 md:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              More than a match. A routine that works.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Find people who train like you.</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Looking for someone who lifts before work? Trains after college? Wants to build strength, lose fat, improve endurance or simply stay active? Trainr helps you find people whose routine feels compatible with yours.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Match beyond location.</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A nearby gym is helpful, but it is not enough. Training goals, experience, schedules and commitment levels all matter. Trainr is designed around the details that make a workout partnership practical.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Keep fitness social, focused and respectful.</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Trainr is made for people looking to train - not for endless swiping or unwanted attention. Create genuine fitness connections, communicate with respect and focus on making progress together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SAFETY & CONTROL */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 md:p-12 shadow-xl">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <Badge className="bg-sky-500/20 text-sky-300 border-sky-400/30 px-3 py-1 text-xs font-bold">
                Safety First
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Your comfort and control come first.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Meeting new people should never mean compromising your safety. Trainr gives members tools to make more informed choices before connecting.
              </p>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Review profiles carefully. Keep early conversations inside the app. Meet in public gyms or workout spaces. If someone behaves inappropriately, use the report or block tools. Trainr does not tolerate harassment, threats, scams, impersonation or behaviour that makes another member feel unsafe.
              </p>
              <div className="pt-2">
                <Button onClick={() => navigateTo('safety')} variant="outline" className="bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-full px-6 text-sm">
                  Read Safety Guidelines <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
            <div className="lg:col-span-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-3 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Shield className="w-4 h-4" /> Safety Essentials
              </div>
              <p>• Verified profile badges</p>
              <p>• In-app private messaging</p>
              <p>• One-tap report & block tools</p>
              <p>• Anti-harassment community rules</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHO TRAINR IS FOR */}
      <section className="py-16 md:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Whether you are new to fitness or already committed, Trainr is for people who want to show up.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Beginners who want a friendly, dependable person to start with.',
              'Students and working professionals trying to fit fitness into a busy schedule.',
              'Strength and powerlifting enthusiasts looking for consistent training support.',
              'Cardio, mobility and general fitness members who want a routine they can enjoy.',
              'People returning to the gym after a break and looking for accountability.',
              'Anyone who believes fitness is easier with the right community.',
            ].map((audience, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">{audience}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CITIES */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 md:px-6 text-center space-y-6">
        <Badge className="bg-sky-50 text-sky-700 border-sky-200 px-3 py-1 text-xs font-bold">
          Nationwide Community
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Find fitness accountability in your city.
        </h2>
        <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
          Trainr is growing city by city, helping people create stronger fitness routines together.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {['Mumbai', 'Bangalore', 'Delhi NCR', 'Pune', 'Hyderabad', 'Chennai'].map((city) => (
            <Badge key={city} className="bg-white border-slate-200 text-slate-800 text-sm font-bold px-4 py-2 rounded-xl shadow-sm">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-sky-500 inline" /> {city}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-slate-500 pt-2">
          Do not see your city yet? Create your profile and let us know where you want Trainr next.
        </p>
      </section>

      {/* 8. TESTIMONIALS */}
      <section className="py-16 md:py-24 bg-slate-100/60 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 text-xs font-bold">
              Real Experiences
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Real people. Real routines. Real progress.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                q: "Finding a workout partner who lifts at 6:30 AM before work changed everything. Having someone waiting makes hitting snooze impossible.",
                author: "Rohan",
                city: "Mumbai",
              },
              {
                q: "As someone getting back to fitness after 2 years, having an accountability partner gave me the confidence to step into the free-weights section again.",
                author: "Priya",
                city: "Bangalore",
              },
              {
                q: "We connected through Trainr for powerlifting prep. 6 months in, we haven't missed a single leg day session.",
                author: "Ankit",
                city: "Delhi NCR",
              },
            ].map((t, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"{t.q}"</p>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{t.author}</p>
                  <p className="text-xs text-slate-500">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CLOSING CTA */}
      <section className="py-20 md:py-28 max-w-5xl mx-auto px-4 md:px-6 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Your next workout partner could be nearby.
        </h2>
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          Stop waiting for the perfect time to get consistent. Build your profile, find people who fit your routine and make fitness a habit you can keep.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button onClick={openAuthModal} size="lg" className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-full h-12 px-8 text-sm shadow-md shadow-sky-500/20">
            Get Started <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} variant="outline" size="lg" className="w-full sm:w-auto rounded-full h-12 px-6 text-sm border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm">
            Learn How Trainr Works
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" width={28} height={28} />
              </div>
              <span className="font-extrabold text-slate-900">Trainr</span>
              <span className="text-xs text-slate-500 ml-2">© {new Date().getFullYear()} Trainr. All rights reserved.</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-slate-600">
              <Link href="/about" onClick={(e) => { e.preventDefault(); navigateTo('about') }} className="hover:text-slate-900 transition">About</Link>
              <Link href="/safety" onClick={(e) => { e.preventDefault(); navigateTo('safety') }} className="hover:text-slate-900 transition">Safety</Link>
              <Link href="/faq" onClick={(e) => { e.preventDefault(); navigateTo('faq') }} className="hover:text-slate-900 transition">FAQ</Link>
              <Link href="/privacy" onClick={(e) => { e.preventDefault(); navigateTo('privacy') }} className="hover:text-slate-900 transition">Privacy Policy</Link>
              <Link href="/terms" onClick={(e) => { e.preventDefault(); navigateTo('terms') }} className="hover:text-slate-900 transition">Terms of Service</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
