'use client'
import { Button } from '@/components/ui/button'
import { ArrowRight, Target, Users, ShieldCheck, Heart, Sparkles, CheckCircle2, Shield } from 'lucide-react'
import PageShell from '@/components/app/PageShell'
import { INSTAGRAM_URL } from '@/lib/client/constants'

export default function AboutView({ onNav }) {
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

  return (
    <PageShell title="Built for the people who want to keep showing up." kicker="About Trainr" onNav={onNav}>
      <p className="text-lg md:text-xl text-slate-700 font-semibold leading-relaxed">
        Fitness is rarely about one perfect workout. It is about returning the next day, the next week and the next month — even when life gets busy.
      </p>

      <div className="space-y-4 text-base text-slate-600 leading-relaxed font-normal">
        <p>
          Trainr was created for people who know that consistency is easier with support. A training partner can make an early workout feel possible, help you stay committed to a goal and turn a gym routine into something you genuinely look forward to.
        </p>
        <p>
          We are building a fitness accountability network that helps people find compatible workout partners nearby. Not just anyone nearby — people whose goals, schedules, training preferences and routines actually make sense together.
        </p>
      </div>

      {/* Make consistency easier to find */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-4 mt-8">
        <h2 className="text-2xl font-extrabold text-slate-900">Make consistency easier to find.</h2>
        <p className="text-slate-600 leading-relaxed font-medium">
          Our mission is simple: help more people build fitness routines they can sustain.
        </p>
        <p className="text-slate-600 leading-relaxed">
          We believe the right workout partner can make a meaningful difference. They can help you stay motivated, learn new habits, feel more confident in a gym and enjoy the process more than you would alone. Trainr exists to make those connections easier to discover.
        </p>
      </div>

      {/* Built for fitness, not endless swiping */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Built for fitness, not endless swiping.</h2>
        <p className="text-slate-600 leading-relaxed">
          Trainr is not designed around superficial interactions. It is built around shared routines and practical compatibility.
        </p>
        <p className="text-slate-600 leading-relaxed">
          When you create a profile, the focus is on what helps people train together: your city, gym, goals, schedule and experience level. The aim is not to create more noise. The aim is to help you find a person who makes your fitness routine easier to maintain.
        </p>
      </div>

      {/* Built around real life */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Built around real life.</h2>
        <p className="text-slate-600 leading-relaxed">
          People do not always have the same availability, experience or motivation. Some train before work. Some prefer late-evening sessions. Some are just starting, while others are chasing specific performance goals.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Trainr is designed for that reality. You decide what matters to you, explore compatible profiles and connect at your own pace.
        </p>
      </div>

      {/* What we believe */}
      <div className="mt-10 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">What we believe.</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              title: 'Consistency beats intensity.',
              desc: 'A workout routine you can maintain is more valuable than a perfect plan you abandon after two weeks.',
              icon: Target,
              color: 'text-sky-600 bg-sky-50 border-sky-100',
            },
            {
              title: 'Community creates momentum.',
              desc: 'Progress feels more possible when someone understands your goal and is willing to show up alongside you.',
              icon: Users,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            },
            {
              title: 'Fitness should feel welcoming.',
              desc: 'Gyms and fitness spaces can feel intimidating, especially when you are new. The right training partner can make that first step easier.',
              icon: Heart,
              color: 'text-purple-600 bg-purple-50 border-purple-100',
            },
            {
              title: 'Safety is not optional.',
              desc: 'Members should feel in control of who they connect with. Respectful behaviour, clear boundaries and accessible safety tools are essential.',
              icon: ShieldCheck,
              color: 'text-rose-600 bg-rose-50 border-rose-100',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${item.color} border flex items-center justify-center mb-3`}>
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1.5">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our vision */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 md:p-10 mt-8 space-y-4 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Our vision.</h2>
        <p className="text-slate-300 leading-relaxed font-medium">
          We want Trainr to become a trusted place for people who are serious about building healthier, stronger and more consistent lives.
        </p>
        <p className="text-slate-300 leading-relaxed font-medium">
          As the community grows, we aim to make it easier to find accountability, celebrate progress and build meaningful fitness connections — one city, one gym and one workout at a time.
        </p>
        <div className="flex flex-wrap gap-3 pt-4">
          <Button onClick={openAuthModal} className="bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-full px-6 shadow-md">
            Find Your Workout Partner <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
          <Button onClick={() => navigateTo('safety')} variant="outline" className="bg-transparent border-slate-600 text-white hover:bg-slate-800 rounded-full font-bold">
            Read Our Safety Guidelines
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
