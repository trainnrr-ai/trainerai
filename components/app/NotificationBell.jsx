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
        <button className="relative w-9 h-9 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition text-slate-600 hover:text-slate-800" title="Notifications">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="bg-white border-slate-200 overflow-y-auto w-full sm:max-w-sm z-[100]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-slate-800">
            <Bell className="w-5 h-5 text-sky-500" /> Notifications
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {items.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm font-medium">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
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
                  ? 'bg-white hover:bg-slate-50'
                  : 'bg-sky-50/50 border border-sky-100 hover:bg-sky-50'}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-slate-50 text-slate-400' : 'bg-sky-100 text-sky-600'}`}>
                  <Ic className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${n.read ? 'text-slate-700' : 'text-slate-800'}`}>{n.title}</div>
                  {n.body && <div className={`text-xs truncate mt-0.5 ${n.read ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>{n.body}</div>}
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">{timeAgo(n.createdAt)}</div>
                </div>
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
