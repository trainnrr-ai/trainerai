'use client'
import { Button } from '@/components/ui/button'
import { Send, Instagram, ArrowRight } from 'lucide-react'
import PageShell from '@/components/app/PageShell'
import { INSTAGRAM_URL, SUPPORT_EMAIL } from '@/lib/client/constants'

export default function ContactView({ onNav }) {
  const openEmail = () => {
    const subject = encodeURIComponent('Hello Trainr team')
    const body = encodeURIComponent('Hi Trainr team,\n\nI wanted to reach out about ')
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
  }
  return (
    <PageShell title="Talk to the Trainr team." kicker="Contact" onNav={onNav}>
      <p className="text-white/70 max-w-2xl">Trainr is committed to building a safe and supportive fitness community. Have a question, a partnership idea, or a safety concern? Reach out — we read every message.</p>

      <div className="grid md:grid-cols-2 gap-4 pt-2">
        <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Hello Trainr team')}`} className="block glass-strong rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/15 transition group">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Email us directly</div>
          <div className="text-2xl md:text-3xl font-extrabold text-[#00ff88] group-hover:underline">{SUPPORT_EMAIL}</div>
          <div className="text-sm text-white/55 mt-2">For support, partnerships, press &amp; safety concerns.</div>
          <Button onClick={openEmail} className="mt-5 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold rounded-full">
            <Send className="w-4 h-4 mr-2" /> Open email app
          </Button>
        </a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="block glass-strong rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/15 transition group">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-1">DM us on Instagram</div>
          <div className="text-2xl md:text-3xl font-extrabold flex items-center gap-2 text-[#00ff88] group-hover:underline">
            <Instagram className="w-6 h-6" /> @trainr.in
          </div>
          <div className="text-sm text-white/55 mt-2">DMs open · daily updates · community spotlights.</div>
          <Button variant="outline" className="mt-5 bg-white/5 border-white/15 rounded-full">
            Open Instagram <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
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
      <p className="text-xs text-white/45 text-center pt-4">Trainr is committed to building a safe and supportive fitness community.</p>
    </PageShell>
  )
}
