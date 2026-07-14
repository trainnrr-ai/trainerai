'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiJson } from '@/lib/client/utils'

const CATEGORIES = [
  { id: 'fake_profile', label: 'Fake profile', desc: 'Photos or info that don\u2019t look real' },
  { id: 'spam', label: 'Spam', desc: 'Promotional, repetitive or off-topic' },
  { id: 'harassment', label: 'Harassment', desc: 'Bullying, threats or unwanted advances' },
  { id: 'inappropriate_photos', label: 'Inappropriate photos', desc: 'Sexual, violent or graphic content' },
  { id: 'underage', label: 'Underage', desc: 'User appears under 18' },
  { id: 'other', label: 'Other', desc: 'Tell us what\u2019s wrong below' },
]

export default function ReportDialog({ open, onOpenChange, profile, onDone }) {
  const [category, setCategory] = useState(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => { setCategory(null); setDetails(''); setSubmitting(false) }

  const submit = async () => {
    if (!category) { toast.error('Please pick a category'); return }
    setSubmitting(true)
    try {
      await apiJson('/api/reports', { profileId: profile.id, category, details })
      // Auto-block on report — protects the reporter
      await apiJson('/api/blocks', { profileId: profile.id })
      toast.success('Report submitted', { description: 'User blocked. Our team reviews within 24h.' })
      onDone?.(profile)
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e.message || 'Failed to submit')
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="bg-[#0a0b0d] border-white/10 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Report {profile?.name || 'user'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-white/60 -mt-1">Help us keep Trainr safe. We review every report within 24 hours.</p>

        <div className="space-y-2">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`w-full text-left p-3 rounded-xl border transition active:scale-[0.99] ${
                category === c.id
                  ? 'bg-red-500/10 border-red-500/40 text-white'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              <div className="font-semibold text-sm flex items-center justify-between">
                <span>{c.label}</span>
                {category === c.id && <span className="w-2 h-2 rounded-full bg-red-400" />}
              </div>
              <div className="text-xs text-white/50 mt-0.5">{c.desc}</div>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wide text-white/50 font-semibold">Additional details (optional)</label>
          <Textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            maxLength={500}
            placeholder="Anything else we should know\u2026"
            className="bg-white/5 border-white/10 min-h-[80px]"
          />
          <div className="text-[10px] text-white/35 text-right">{details.length}/500</div>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-xs text-white/60 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00ff88] flex-shrink-0 mt-[1px]" />
          <span>This user will also be <strong className="text-white">blocked</strong> from contacting you.</span>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => { reset(); onOpenChange(false) }} variant="outline" className="flex-1 bg-white/5 border-white/10">Cancel</Button>
          <Button onClick={submit} disabled={submitting || !category} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit & Block
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
