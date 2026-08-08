'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Crown, AlertTriangle, BadgeCheck, ShieldCheck, Users, Activity,
  TrendingUp, MessageSquare, Heart, Search, X, CheckCircle2, ImageIcon, Loader2, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { apiFetch, apiJson, timeAgo } from '@/lib/client/utils'
import DeleteUserDialog from './DeleteUserDialog'

const CHART_COLORS = ['#0EA5E9', '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#64748B']

function StatCard({ label, value, accent, icon: Icon }) {
  return (
    <Card className="bg-white border border-slate-200/80 p-5 rounded-2xl relative overflow-hidden shadow-sm">
      {Icon && (
        <div className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-450" />
        </div>
      )}
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">{label}</div>
      <div className={`text-2xl md:text-3xl font-black mt-2 ${accent ? 'text-emerald-600' : 'text-slate-800'}`}>{value ?? '—'}</div>
    </Card>
  )
}

function ChartCard({ title, children, subtitle }) {
  return (
    <Card className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-extrabold text-slate-850">{title}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-0.5 font-semibold">{subtitle}</div>}
        </div>
      </div>
      <div style={{ width: '100%', height: 220 }}>{children}</div>
    </Card>
  )
}

function OverviewTab({ stats, analytics }) {
  const series = analytics?.signups || []
  const matchSeries = analytics?.matches || []
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats?.users} icon={Users} />
        <StatCard label="Active 24h" value={stats?.activeNow} accent icon={Activity} />
        <StatCard label="Real profiles" value={stats?.profiles} icon={Users} />
        <StatCard label="Verified" value={stats?.verified} icon={BadgeCheck} />
        <StatCard label="Matches" value={stats?.matches} icon={Heart} />
        <StatCard label="Messages" value={stats?.messages} icon={MessageSquare} />
        <StatCard label="Open reports" value={stats?.openReports} icon={AlertTriangle} />
        <StatCard label="Banned" value={stats?.banned} icon={ShieldCheck} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Signups (last 14 days)" subtitle={`${series.reduce((a, b) => a + b.count, 0)} new users`}>
          <ResponsiveContainer>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="gSign" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12, color: '#1e293b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
              <Area type="monotone" dataKey="count" stroke="#0EA5E9" fill="url(#gSign)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mutual connections (last 14 days)" subtitle={`${matchSeries.reduce((a, b) => a + b.count, 0)} matches`}>
          <ResponsiveContainer>
            <BarChart data={matchSeries}>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12, color: '#1e293b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
              <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <ChartCard title="Top gyms">
          <ResponsiveContainer>
            <BarChart data={analytics?.topGyms || []} layout="vertical" margin={{ left: 12 }}>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12, color: '#1e293b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
              <Bar dataKey="count" fill="#0EA5E9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Gender split">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={analytics?.genderSplit || []} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {(analytics?.genderSplit || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12, color: '#1e293b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Goals breakdown">
          <ResponsiveContainer>
            <BarChart data={analytics?.goalSplit || []}>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12, color: '#1e293b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
              <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function UsersTab({ refreshSig, onChanged }) {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [banDialog, setBanDialog] = useState(null) // user object
  const [banReason, setBanReason] = useState('')
  const [deleteDialog, setDeleteDialog] = useState(null) // user object

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (status !== 'all') params.set('status', status)
      const data = await apiFetch('/api/admin/users?' + params.toString())
      setUsers(data.users || [])
      setTotal(typeof data.total === 'number' ? data.total : (data.users?.length || 0))
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [status, refreshSig]) // eslint-disable-line

  const submitBan = async () => {
    try {
      await apiJson('/api/admin/ban', { userId: banDialog.id, reason: banReason })
      toast.success(`${banDialog.name || 'User'} banned`)
      setBanDialog(null); setBanReason('')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const unban = async (uid) => {
    try { await apiJson('/api/admin/unban', { userId: uid }); toast.success('Unbanned'); load() }
    catch (e) { toast.error(e.message) }
  }

  const toggleVerify = async (profileId, verified) => {
    try {
      await apiJson('/api/admin/verify-profile', { profileId, verified })
      toast.success(verified ? 'Profile verified ✓' : 'Profile unverified')
      load()
      onChanged?.()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Search by name or email…"
            className="bg-white border-slate-200 pl-9 text-slate-800"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 border border-slate-200/60 rounded-lg p-1">
          {['all', 'active', 'banned'].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition capitalize ${status === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {s}
            </button>
          ))}
        </div>
        <Button onClick={load} variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}</Button>
      </div>

      <Card className="bg-white border border-slate-200 divide-y divide-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {users.length === 0 && <div className="p-6 text-sm text-slate-400 text-center">No users match.</div>}
        {users.length > 0 && (
          <div className="px-4 py-2 text-[11px] text-slate-500 bg-slate-50/50 flex items-center justify-between border-b border-slate-150">
            <span>Showing <span className="text-slate-700 font-bold">{users.length}</span>{total > users.length ? <> of <span className="text-slate-700 font-bold">{total}</span></> : ''} user{total === 1 ? '' : 's'}</span>
            {total > users.length && <span className="text-amber-600 font-semibold">Narrow with search to see more</span>}
          </div>
        )}
        {users.map(u => {
          const displayName = u.profileName || u.name || 'Unknown'
          const cleanName = displayName.replace(/[\s\-\+]/g, '')
          const fallbackChar = /^\d+$/.test(cleanName)
            ? (cleanName.slice(0, 1) || 'U')
            : (displayName.slice(0, 1).toUpperCase() || 'U')
          return (
            <div key={u.id} className="p-4 flex items-center gap-3 text-sm">
              <Avatar className="w-9 h-9">
                <AvatarImage src={u.profilePicture || u.picture} />
                <AvatarFallback>{fallbackChar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800 truncate flex items-center gap-2">
                {u.profileName || u.name || 'Unknown'}
                {u.verified && <BadgeCheck className="w-4 h-4 text-sky-500 fill-sky-500/10" />}
                {u.tier === 'pro' && <Badge className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold">PRO</Badge>}
                {u.hasProfile === false && (
                  <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[10px] font-medium">No profile</Badge>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 space-y-0.5 font-medium">
                {u.email && <div className="truncate">📧 {u.email}</div>}
                {u.phoneNumber && <div className="truncate">📞 {u.phoneNumber}</div>}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Joined {timeAgo(u.createdAt)}</div>
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              {u.hasProfile && (
                u.verified ? (
                  <Button size="sm" variant="outline" onClick={() => toggleVerify(u.profileId, false)} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 h-8 text-xs font-semibold">Unverify</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => toggleVerify(u.profileId, true)} className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 h-8 text-xs font-semibold">Verify</Button>
                )
              )}
              {u.banned ? (
                <>
                  <Badge variant="outline" className="bg-red-50 text-red-500 border border-red-250 font-bold">Banned</Badge>
                  <Button size="sm" variant="outline" onClick={() => unban(u.id)} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs font-semibold">Unban</Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setBanDialog(u)} title="Ban (reversible)" className="bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 h-8 text-xs font-semibold">Ban</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setDeleteDialog({ userId: u.id, name: u.name, email: u.email })} title="Delete permanently" className="bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 hover:text-red-650 h-8 px-2.5">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
      </Card>

      <Dialog open={!!banDialog} onOpenChange={(o) => !o && setBanDialog(null)}>
        <DialogContent className="bg-white border border-slate-200 rounded-2xl max-w-sm p-6">
          <DialogHeader><DialogTitle className="text-slate-800 font-extrabold text-lg">Ban {banDialog?.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500 leading-relaxed font-semibold">This blocks the user from logging back in. They will be notified to contact support.</p>
          <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason (visible internally)…" className="bg-slate-50 border-slate-200/85 focus-visible:ring-sky-500 text-slate-800 my-3" />
          <div className="flex gap-2">
            <Button onClick={() => setBanDialog(null)} variant="outline" className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-11 font-semibold">Cancel</Button>
            <Button onClick={submitBan} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl h-11">Confirm Ban</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteUserDialog
        open={!!deleteDialog}
        onOpenChange={(o) => !o && setDeleteDialog(null)}
        target={deleteDialog}
        onDeleted={() => { setDeleteDialog(null); load(); onChanged?.() }}
      />
    </div>
  )
}

function ReportsTab({ refreshSig, onChanged }) {
  const [reports, setReports] = useState([])
  const [status, setStatus] = useState('open')
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/reports?status=' + status)
      setReports(data.reports || [])
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [status, refreshSig]) // eslint-disable-line

  const resolve = async (id, action) => {
    try {
      await apiJson('/api/admin/report-resolve', { id, action })
      toast.success('Report resolved')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const banReportedUser = async (userId) => {
    if (!userId) return toast.error('No user linked to this profile')
    try {
      await apiJson('/api/admin/ban', { userId, reason: 'Banned via report' })
      toast.success('User banned')
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 border border-slate-200/60 rounded-lg p-1">
          {['open', 'resolved', 'all'].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition capitalize ${status === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {s}
            </button>
          ))}
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      <Card className="bg-white border border-slate-200 divide-y divide-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {reports.length === 0 && <div className="p-6 text-sm text-slate-400 text-center">No reports.</div>}
        {reports.map(r => (
          <div key={r.id} className="p-4 flex items-start gap-3 text-sm">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
              {r.targetProfile?.photos?.[0]
                ? <img src={r.targetProfile.photos[0]} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-300" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800">{r.targetProfile?.name || 'Unknown profile'}</span>
                {r.targetProfile?.verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500/10" />}
                {r.category && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-650 border border-red-150">
                    {String(r.category).replace(/_/g, ' ')}
                  </span>
                )}
                <Badge variant="outline" className={r.status === 'open' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}>{r.status}</Badge>
              </div>
              <div className="text-slate-650 text-xs mt-1.5 leading-relaxed font-semibold">{r.details ? `“${r.details}”` : (r.reason || 'No additional details')}</div>
              <div className="text-[10px] text-slate-400 mt-2 font-medium">
                Reported by {r.reporter?.name || r.reporter?.email || 'unknown'} · {timeAgo(r.createdAt)}
              </div>
            </div>
            {r.status === 'open' && (
              <div className="flex flex-col gap-1.5 items-stretch shrink-0">
                <Button size="sm" onClick={() => resolve(r.id, 'no_action')} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 h-8 text-xs font-semibold">Dismiss</Button>
                <Button size="sm" onClick={() => banReportedUser(r.targetProfile?.userId)} title="Ban (reversible)" className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 h-8 text-xs font-semibold">Ban user</Button>
                <Button size="sm" onClick={() => resolve(r.id, 'warn')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-8 text-xs">Warn & resolve</Button>
                <Button size="sm" onClick={() => setDeleteDialog({ userId: r.targetProfile?.userId, profileId: r.targetProfile?.id, name: r.targetProfile?.name })} title="Delete permanently" className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-550 h-8 text-xs font-semibold">
                  <Trash2 className="w-3 h-3 mr-1" /> Delete user
                </Button>
              </div>
            )}
          </div>
        ))}
      </Card>

      <DeleteUserDialog
        open={!!deleteDialog}
        onOpenChange={(o) => !o && setDeleteDialog(null)}
        target={deleteDialog}
        onDeleted={() => { setDeleteDialog(null); load(); onChanged?.() }}
      />
    </div>
  )
}

function VerificationsTab({ refreshSig, onChanged }) {
  const [profiles, setProfiles] = useState([])
  const [type, setType] = useState('all')
  const [loading, setLoading] = useState(false)
  const [previewSelfie, setPreviewSelfie] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = type === 'all' ? '' : `?type=${type}`
      const data = await apiFetch('/api/admin/verifications' + params)
      setProfiles(data.profiles || [])
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [type, refreshSig]) // eslint-disable-line

  const approve = async (profileId, t) => {
    try { await apiJson('/api/admin/verify-approve', { profileId, type: t }); toast.success('Approved'); load() }
    catch (e) { toast.error(e.message) }
  }
  const reject = async (profileId, t) => {
    try { await apiJson('/api/admin/verify-reject', { profileId, type: t, reason: 'Photo unclear or mismatch' }); toast.success('Rejected'); load() }
    catch (e) { toast.error(e.message) }
  }

  const toggleVerify = async (profileId, verified) => {
    try {
      await apiJson('/api/admin/verify-profile', { profileId, verified })
      toast.success(verified ? 'Profile verified ✓' : 'Profile unverified')
      load()
      onChanged?.()
    } catch (e) { toast.error(e.message) }
  }

  const renderRow = (p) => {
    const requests = p.verificationRequests || {}
    const types = ['selfie', 'gym', 'instagram'].filter(t => requests[t] === 'pending')
    return (
      <div key={p.id} className="p-4 flex items-start gap-3 text-sm">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
          {p.photos?.[0] ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300">?</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            {p.name}, {p.age}
            {p.verified && <BadgeCheck className="w-4 h-4 text-sky-500 fill-sky-500/10" />}
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5 font-medium">{p.city} · {p.gymName}</div>
          {p.instagram && <div className="text-[11px] text-sky-650 mt-1 font-bold">@{p.instagram}</div>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {types.map(t => (
              <span key={t} className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{t}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {p.selfiePhoto && requests.selfie === 'pending' && (
            <Button size="sm" variant="outline" onClick={() => setPreviewSelfie(p.selfiePhoto)} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs font-semibold">View selfie</Button>
          )}
          {types.map(t => (
            <div key={t} className="flex gap-1">
              <Button size="sm" onClick={() => approve(p.id, t)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-8 text-xs flex-1"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approve {t}</Button>
              <Button size="sm" onClick={() => reject(p.id, t)} variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-500 hover:border-red-200 h-8 text-xs font-semibold"><X className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
          {p.verified ? (
            <Button size="sm" variant="outline" onClick={() => toggleVerify(p.id, false)} className="bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 h-8 text-xs font-semibold">Unverify</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => toggleVerify(p.id, true)} className="bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 h-8 text-xs font-semibold">Verify</Button>
          )}
          <Button size="sm" onClick={() => setDeleteDialog({ userId: p.userId, profileId: p.id, name: p.name })} title="Delete permanently" className="bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 h-8 text-xs font-semibold">
            <Trash2 className="w-3 h-3 mr-1" /> Delete user
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 border border-slate-200/60 rounded-lg p-1">
          {['all', 'selfie', 'gym', 'instagram'].map(t => (
            <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition capitalize ${type === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {t}
            </button>
          ))}
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      <Card className="bg-white border border-slate-200 divide-y divide-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {profiles.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm font-semibold">
            <BadgeCheck className="w-8 h-8 mx-auto mb-2 text-slate-250" />
            No pending verifications.
            <p className="text-xs mt-1.5 text-slate-400 font-medium">Tip: enable manual review by setting <code className="text-emerald-600 font-bold">MANUAL_VERIFICATION=true</code> in env.</p>
          </div>
        )}
        {profiles.map(renderRow)}
      </Card>

      <Dialog open={!!previewSelfie} onOpenChange={(o) => !o && setPreviewSelfie(null)}>
        <DialogContent className="bg-white border border-slate-200 max-w-md p-4">
          <DialogHeader><DialogTitle className="text-slate-850 font-bold">Selfie preview</DialogTitle></DialogHeader>
          {previewSelfie && <img src={previewSelfie} alt="selfie" className="w-full rounded-2xl shadow-sm border border-slate-100 mt-2" />}
        </DialogContent>
      </Dialog>

      <DeleteUserDialog
        open={!!deleteDialog}
        onOpenChange={(o) => !o && setDeleteDialog(null)}
        target={deleteDialog}
        onDeleted={() => { setDeleteDialog(null); load(); onChanged?.() }}
      />
    </div>
  )
}

export default function AdminView() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [tab, setTab] = useState('overview')
  const [refreshSig, setRefreshSig] = useState(0)

  const refresh = async () => {
    try {
      const [s, a] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/analytics?days=14'),
      ])
      setStats(s.stats || null)
      setAnalytics(a)
      setRefreshSig(Date.now())
    } catch { toast.error('Failed to load admin data') }
  }

  useEffect(() => { refresh() }, [])

  return (
    <div className="pt-20 pb-12 max-w-6xl mx-auto px-4 md:px-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-sky-500" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800">Admin Console</h1>
        </div>
        <Button onClick={refresh} variant="outline" size="sm" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
          <TrendingUp className="w-4 h-4 mr-1.5 text-slate-500" /> Refresh
        </Button>
      </div>
      <p className="text-slate-500 text-sm mb-6 font-semibold">Trainr internal · access restricted to allowed admin emails.</p>

      {/* Pending alerts */}
      {stats && (stats.openReports > 0 || stats.pendingVerifications > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {stats.openReports > 0 && (
            <button onClick={() => setTab('reports')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition shadow-sm">
              <AlertTriangle className="w-4 h-4" /> {stats.openReports} open report{stats.openReports > 1 ? 's' : ''}
            </button>
          )}
          {stats.pendingVerifications > 0 && (
            <button onClick={() => setTab('verifications')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold hover:bg-sky-100 transition shadow-sm">
              <BadgeCheck className="w-4 h-4" /> {stats.pendingVerifications} verification{stats.pendingVerifications > 1 ? 's' : ''} awaiting review
            </button>
          )}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-slate-100 border border-slate-200/80 mb-6 p-1 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-600 font-bold rounded-lg px-4 py-2 transition">Overview</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-600 font-bold rounded-lg px-4 py-2 transition">Reports {stats?.openReports ? `(${stats.openReports})` : ''}</TabsTrigger>
          <TabsTrigger value="verifications" className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-600 font-bold rounded-lg px-4 py-2 transition">Verifications {stats?.pendingVerifications ? `(${stats.pendingVerifications})` : ''}</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-600 font-bold rounded-lg px-4 py-2 transition">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab stats={stats} analytics={analytics} /></TabsContent>
        <TabsContent value="reports"><ReportsTab refreshSig={refreshSig} onChanged={refresh} /></TabsContent>
        <TabsContent value="verifications"><VerificationsTab refreshSig={refreshSig} onChanged={refresh} /></TabsContent>
        <TabsContent value="users"><UsersTab refreshSig={refreshSig} onChanged={refresh} /></TabsContent>
      </Tabs>
    </div>
  )
}
