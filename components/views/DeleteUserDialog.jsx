'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiJson } from '@/lib/client/utils'

const REASONS = [
  { id: 'fake_profile',         label: 'Fake profile' },
  { id: 'spam',                 label: 'Spam' },
  { id: 'harassment',           label: 'Harassment' },
  { id: 'inappropriate_content',label: 'Inappropriate content' },
  { id: 'user_request',         label: 'User request' },
  { id: 'other',                label: 'Other' },
]

// Permanent admin-side user deletion. Distinct from ban (ban = reversible).
// `target` shape: { userId?: string, profileId?: string, name?: string, email?: string }
export default function DeleteUserDialog({ open, onOpenChange, target, onDeleted }) {
  const [reason, setReason] = useState('fake_profile')
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => { setReason('fake_profile'); setAdminNote(''); setSubmitting(false) }

  const submit = async () => {
    setSubmitting(true)
    try {
      // Backend resolves either userId OR profileId — pass userId if available, else profileId
      const idToSend = target?.userId || target?.profileId
      if (!idToSend) throw new Error('No user/profile to delete')
      await apiJson('/api/admin/delete-user', { userId: idToSend, reason, adminNote })
      toast.success('User permanently deleted', {
        description: `${target?.name || target?.email || 'User'} and all their data have been removed.`,
      })
      onDeleted?.(target)
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e.message || 'Failed to delete')
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) { reset(); onOpenChange(false) } }}>
      <DialogContent className="bg-[#0a0b0d] border-red-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-300">
            <Trash2 className="w-5 h-5" /> Permanently delete user?
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl bg-red-500/[0.06] border border-red-500/25 p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-[2px]" />
          <div className="text-xs text-white/75 leading-relaxed">
            This is <strong className="text-white">permanent</strong> and <strong className="text-white">cannot be undone</strong>.
            Use <strong className="text-amber-300">Ban</strong> instead if you want a reversible action.
          </div>
        </div>

        {target && (
          <div className="text-sm text-white/75 -mb-1">
            Deleting <span className="font-semibold text-white">{target.name || target.email || target.userId || target.profileId}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Reason</label>
          <div className="grid grid-cols-2 gap-1.5">
            {REASONS.map(r => (
              <button
                key={r.id}
                onClick={() => setReason(r.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition border text-left ${
                  reason === r.id
                    ? 'bg-red-500/15 border-red-500/40 text-white'
                    : 'bg-white/[0.03] border-white/10 text-white/65 hover:bg-white/[0.06]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Admin note (optional)</label>
          <Textarea
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
            maxLength={500}
            placeholder="Internal note for the audit log\u2026"
            className="bg-white/5 border-white/10 min-h-[70px] text-sm"
          />
          <div className="text-[10px] text-white/35 text-right">{adminNote.length}/500</div>
        </div>

        <p className="text-xs text-white/55 leading-relaxed">
          Will permanently remove: profile, photos, matches, chats, messages, notifications, reports, blocks, verification data, sessions.
        </p>

        <div className="flex gap-2">
          <Button onClick={() => { reset(); onOpenChange(false) }} disabled={submitting} variant="outline" className="flex-1 bg-white/5 border-white/10">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</> : <>Delete permanently</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
