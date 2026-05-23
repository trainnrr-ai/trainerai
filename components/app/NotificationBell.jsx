'use client'
import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Bell, Heart, MessageCircle, Sparkles, BadgeCheck } from 'lucide-react'
import { timeAgo, apiFetch } from '@/lib/client/utils'

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)

  const load = async () => {
    try {
      const data = await apiFetch('/api/notifications')
      if (data.notifications) {
        setItems(data.notifications)
        setUnread(data.unread || 0)
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  const handleOpen = async (next) => {
    setOpen(next)
    if (next && unread > 0) {
      await fetch('/api/notifications/read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      setUnread(0)
    }
  }

  const handleClick = (n) => {
    setOpen(false)
    if (n.type === 'new_match' || n.type === 'new_message') onNavigate?.('matches')
    else if (n.type === 'connect_request') onNavigate?.('discover')
    else if (n.type === 'verification_approved' || n.type === 'verification_rejected') onNavigate?.('settings')
  }

  const iconFor = (t) => {
    if (t === 'new_match') return Heart
    if (t === 'new_message') return MessageCircle
    if (t === 'connect_request') return Sparkles
    if (t === 'verification_approved') return BadgeCheck
    return Bell
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <button className="relative w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition" title="Notifications">
          <Bell className="w-4 h-4 text-white/70" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#24d18f] text-black text-[10px] font-extrabold flex items-center justify-center ring-2 ring-[#0a0b0d]">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="bg-[#0a0b0d] border-white/10 overflow-y-auto w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#24d18f]" /> Notifications
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {items.length === 0 && (
            <div className="text-center py-12 text-white/40 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 text-white/20" />
              You’re all caught up.
            </div>
          )}
          {items.map(n => {
            const Ic = iconFor(n.type)
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left rounded-xl p-3 flex gap-3 transition ${n.read
                  ? 'bg-white/[0.02] hover:bg-white/[0.05]'
                  : 'bg-[#24d18f]/[0.06] border border-[#24d18f]/15 hover:bg-[#24d18f]/[0.08]'}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-white/5 text-white/50' : 'bg-[#24d18f]/15 text-[#24d18f]'}`}>
                  <Ic className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{n.title}</div>
                  {n.body && <div className="text-xs text-white/55 truncate mt-0.5">{n.body}</div>}
                  <div className="text-[10px] text-white/35 mt-1">{timeAgo(n.createdAt)}</div>
                </div>
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
