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
      <p className="text-slate-650 max-w-2xl font-semibold leading-relaxed">Trainr is committed to building a safe and supportive fitness community. Have a question, a partnership idea, or a safety concern? Reach out — we read every message.</p>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Hello Trainr team')}`} className="block bg-white border border-slate-200/80 rounded-2xl p-6 hover:bg-slate-50/50 hover:border-slate-300 hover:shadow-md transition group">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Email us directly</div>
          <div className="text-2xl md:text-3xl font-extrabold text-sky-600 group-hover:text-sky-700 transition">{SUPPORT_EMAIL}</div>
          <div className="text-sm text-slate-500 mt-2 font-semibold">For support, partnerships, press &amp; safety concerns.</div>
          <Button onClick={openEmail} className="mt-5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-full shadow-sm transition active:scale-[0.98]">
            <Send className="w-4 h-4 mr-2" /> Open email app
          </Button>
        </a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="block bg-white border border-slate-200/80 rounded-2xl p-6 hover:bg-slate-50/50 hover:border-slate-300 hover:shadow-md transition group">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">DM us on Instagram</div>
          <div className="text-2xl md:text-3xl font-extrabold flex items-center gap-2 text-sky-600 group-hover:text-sky-700 transition">
            <Instagram className="w-6 h-6" /> @trainr.in
          </div>
          <div className="text-sm text-slate-500 mt-2 font-semibold">DMs open · daily updates · community spotlights.</div>
          <Button variant="outline" className="mt-5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full shadow-sm font-bold">
            Open Instagram <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </a>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Response time</div>
          <div className="font-bold text-slate-800 text-lg">Within 24 hours</div>
          <div className="text-xs text-slate-500 mt-1 font-semibold">Safety reports prioritized within 4 hours.</div>
        </div>
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Community support</div>
          <div className="font-bold text-slate-800 text-lg">Built on trust</div>
          <div className="text-xs text-slate-500 mt-1 font-semibold">Every report is read by a real human. No bots.</div>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center font-bold pt-4">Trainr is committed to building a safe and supportive fitness community.</p>
    </PageShell>
  )
}
