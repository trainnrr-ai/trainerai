'use client'
import { Button } from '@/components/ui/button'
import { ArrowRight, Target, Users, ShieldCheck, BadgeCheck, Sparkles, Activity, Instagram } from 'lucide-react'
import PageShell from '@/components/app/PageShell'
import { INSTAGRAM_URL } from '@/lib/client/constants'
import { loginWithGoogle } from '@/lib/client/utils'

export default function AboutView({ onNav }) {
  return (
    <PageShell title="Built for the lifters who show up." kicker="About Trainr" onNav={onNav}>
      <p className="text-lg md:text-xl text-white/80">
        Trainr is your fitness accountability network. We help people in India find verified workout partners nearby — matched by gym, training schedule, goals, and experience level. No swiping. No dating. Just consistent, community-driven progress.
      </p>

      <div className="grid md:grid-cols-2 gap-4 pt-4">
        {[
          { i: Target, t: 'Why Trainr exists', d: 'Most fitness journeys fail alone. We make showing up easier by giving every lifter a partner who shares their goal and schedule.' },
          { i: Users, t: 'Accountability culture', d: 'Trainr isn’t a feed of highlight reels. It’s a network where someone is waiting for you at the rack.' },
          { i: ShieldCheck, t: 'Women safety commitment', d: 'Strict moderation, verified profiles, anti-creep filters and zero-tolerance on harassment. Reports are reviewed within 24 hours.' },
          { i: BadgeCheck, t: 'Verified profiles', d: 'Selfie verification, Instagram linking, and gym membership checks build trust before the first message.' },
          { i: Sparkles, t: 'Future vision', d: 'Workout streaks, partner check-ins, gym-level leaderboards, and trusted certified-trainer connections — coming soon.' },
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
        <p className="mt-3 text-white/75">To make consistent training the default, not the exception. We do that by making it absurdly easy to find a trustworthy training partner — and by building a community that’s safe, respectful, and proudly fitness-first.</p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Button onClick={loginWithGoogle} className="bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full">Get Started <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
          <Button onClick={() => onNav('contact')} variant="outline" className="bg-white/5 border-white/15 rounded-full">Contact us</Button>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Button variant="outline" className="bg-white/5 border-white/15 rounded-full"><Instagram className="w-4 h-4 mr-2" /> @trainr.in</Button></a>
        </div>
      </div>
    </PageShell>
  )
}
