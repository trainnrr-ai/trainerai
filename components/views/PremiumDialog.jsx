'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Crown, Sparkles, Heart, Filter, BadgeCheck, Zap, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch, apiJson } from '@/lib/client/utils'

// MOCKED upgrade flow — displays plans and "upgrades" instantly via /api/billing/upgrade.
// Real payment provider (Razorpay/Stripe) to be wired up later.
export default function PremiumDialog({ open, onOpenChange, onUpgraded }) {
  const [plans, setPlans] = useState([])
  const [tier, setTier] = useState('free')
  const [loading, setLoading] = useState(false)
  const [pickPlan, setPickPlan] = useState('pro_yearly')

  useEffect(() => {
    if (!open) return
    apiFetch('/api/billing/me').then(d => {
      setPlans(d.plans || [])
      setTier(d.tier || 'free')
    }).catch(() => {})
  }, [open])

  const upgrade = async () => {
    setLoading(true)
    try {
      const data = await apiJson('/api/billing/upgrade', { planId: pickPlan })
      toast.success('Welcome to Trainr Pro!', { description: 'All premium features unlocked.' })
      setTier(data.tier)
      onUpgraded?.(data)
      onOpenChange(false)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  const features = [
    { i: Heart, t: 'Unlimited connections', d: 'Send connect requests without daily limits' },
    { i: Sparkles, t: 'See who liked you', d: 'View profiles that connected with you first' },
    { i: Filter, t: 'Advanced filters', d: 'Filter by experience, goal blends, gym chain' },
    { i: BadgeCheck, t: 'Priority placement', d: 'Your profile shows higher in discover feed' },
    { i: Zap, t: 'Read receipts plus', d: 'Real-time online indicator + read timestamps' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0b0d] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" /> Trainr Pro
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-white/65">Get the most out of Trainr. Show up stronger, find partners faster.</p>

        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <f.i className="w-4 h-4 text-amber-300" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{f.t}</div>
                <div className="text-xs text-white/55">{f.d}</div>
              </div>
              <Check className="w-4 h-4 text-[#00ff88]" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => setPickPlan(p.id)}
              className={`p-4 rounded-2xl border text-left transition ${pickPlan === p.id
                ? 'bg-amber-400/10 border-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]'
                : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'}`}
            >
              <div className="text-xs uppercase tracking-wider text-white/45 font-semibold">{p.id === 'pro_yearly' ? 'Best value' : 'Monthly'}</div>
              <div className="text-xl font-extrabold mt-1">₹{p.priceInr}</div>
              <div className="text-xs text-white/55">{p.id === 'pro_yearly' ? 'per year · save 44%' : 'per month'}</div>
            </button>
          ))}
        </div>

        {tier === 'pro' ? (
          <Button disabled className="bg-[#00ff88]/60 text-black font-semibold h-11">
            <Check className="w-4 h-4 mr-2" /> You are on Pro
          </Button>
        ) : (
          <Button onClick={upgrade} disabled={loading} className="bg-amber-400 hover:bg-amber-500 text-black font-semibold h-11">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</> : <>Upgrade to Pro</>}
          </Button>
        )}
        <p className="text-[10px] text-white/35 text-center">MOCKED upgrade for MVP. Real payments via Razorpay coming soon.</p>
      </DialogContent>
    </Dialog>
  )
}
