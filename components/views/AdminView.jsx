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
  TrendingUp, MessageSquare, Heart, Search, X, CheckCircle2, ImageIcon, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { apiFetch, apiJson, timeAgo } from '@/lib/client/utils'

const CHART_COLORS = ['#00ff88', '#22d3ee', '#a855f7', '#f59e0b', '#ef4444', '#64748b']

function StatCard({ label, value, accent, icon: Icon }) {
  return (
    <Card className="glass border-white/10 p-4 relative overflow-hidden">
      {Icon && (
        <div className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-white/50" />
        </div>
      )}
      <div className="text-[11px] uppercase tracking-wider text-white/45 font-semibold">{label}</div>
      <div className={`text-2xl md:text-3xl font-black mt-1 ${accent ? 'text-[#00ff88]' : ''}`}>{value ?? '—'}</div>
    </Card>
  )
}

function ChartCard({ title, children, subtitle }) {
  return (
    <Card className="glass border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle && <div className="text-xs text-white/45">{subtitle}</div>}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  <stop offset="0%" stopColor="#00ff88" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0a0b0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#00ff88" fill="url(#gSign)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mutual connections (last 14 days)" subtitle={`${matchSeries.reduce((a, b) => a + b.count, 0)} matches`}>
          <ResponsiveContainer>
            <BarChart data={matchSeries}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0a0b0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <ChartCard title="Top gyms">
          <ResponsiveContainer>
            <BarChart data={analytics?.topGyms || []} layout="vertical" margin={{ left: 12 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ background: '#0a0b0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#00ff88" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Gender split">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={analytics?.genderSplit || []} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {(analytics?.genderSplit || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0a0b0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Goals breakdown">
          <ResponsiveContainer>
            <BarChart data={analytics?.goalSplit || []}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0a0b0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function UsersTab({ refreshSig }) {
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [banDialog, setBanDialog] = useState(null) // user object
  const [banReason, setBanReason] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (status !== 'all') params.set('status', status)
      const data = await apiFetch('/api/admin/users?' + params.toString())
      setUsers(data.users || [])
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Search by name or email…"
            className="bg-white/5 border-white/10 pl-9"
          />
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {['all', 'active', 'banned'].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${status === s ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
        <Button onClick={load} variant="outline" className="bg-white/5 border-white/10">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}</Button>
      </div>

      <Card className="glass border-white/10 divide-y divide-white/5 overflow-hidden">
        {users.length === 0 && <div className="p-6 text-sm text-white/45 text-center">No users match.</div>}
        {users.map(u => (
          <div key={u.id} className="p-4 flex items-center gap-3 text-sm">
            <Avatar className="w-9 h-9"><AvatarImage src={u.picture} /><AvatarFallback>{u.name?.slice(0, 1)}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate flex items-center gap-2">
                {u.name || 'Unknown'}
                {u.tier === 'pro' && <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">PRO</Badge>}
              </div>
              <div className="text-xs text-white/50 truncate">{u.email}</div>
              <div className="text-[10px] text-white/35">Joined {timeAgo(u.createdAt)}</div>
            </div>
            {u.banned ? (
              <>
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">Banned</Badge>
                <Button size="sm" variant="outline" onClick={() => unban(u.id)} className="bg-white/5 border-white/10 h-8 text-xs">Unban</Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setBanDialog(u)} className="bg-white/5 border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 h-8 text-xs">Ban</Button>
            )}
          </div>
        ))}
      </Card>

      <Dialog open={!!banDialog} onOpenChange={(o) => !o && setBanDialog(null)}>
        <DialogContent className="bg-[#0a0b0d] border-white/10">
          <DialogHeader><DialogTitle>Ban {banDialog?.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-white/60">This blocks the user from logging back in. They will be notified to contact support.</p>
          <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason (visible internally)…" className="bg-white/5 border-white/10" />
          <div className="flex gap-2">
            <Button onClick={() => setBanDialog(null)} variant="outline" className="flex-1 bg-white/5 border-white/10">Cancel</Button>
            <Button onClick={submitBan} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Confirm Ban</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReportsTab({ refreshSig }) {
  const [reports, setReports] = useState([])
  const [status, setStatus] = useState('open')
  const [loading, setLoading] = useState(false)

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
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {['open', 'resolved', 'all'].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${status === s ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-white/40" />}
      </div>

      <Card className="glass border-white/10 divide-y divide-white/5 overflow-hidden">
        {reports.length === 0 && <div className="p-6 text-sm text-white/45 text-center">No reports.</div>}
        {reports.map(r => (
          <div key={r.id} className="p-4 flex items-start gap-3 text-sm">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
              {r.targetProfile?.photos?.[0]
                ? <img src={r.targetProfile.photos[0]} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-white/30" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{r.targetProfile?.name || 'Unknown profile'}</span>
                {r.targetProfile?.verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-400" />}
                {r.category && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/30">
                    {String(r.category).replace(/_/g, ' ')}
                  </span>
                )}
                <Badge variant="outline" className={r.status === 'open' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-white/5 text-white/50 border-white/10'}>{r.status}</Badge>
              </div>
              <div className="text-white/60 text-xs mt-1 leading-relaxed">{r.details ? `\u201c${r.details}\u201d` : (r.reason || 'No additional details')}</div>
              <div className="text-[10px] text-white/35 mt-1.5">
                Reported by {r.reporter?.name || r.reporter?.email || 'unknown'} · {timeAgo(r.createdAt)}
              </div>
            </div>
            {r.status === 'open' && (
              <div className="flex flex-col gap-1.5 items-stretch">
                <Button size="sm" onClick={() => resolve(r.id, 'no_action')} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-8 text-xs">Dismiss</Button>
                <Button size="sm" onClick={() => banReportedUser(r.targetProfile?.userId)} className="bg-red-500 hover:bg-red-600 text-white h-8 text-xs">Ban user</Button>
                <Button size="sm" onClick={() => resolve(r.id, 'warn')} className="bg-[#00ff88] hover:bg-[#00cc6a] text-black h-8 text-xs">Warn & resolve</Button>
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  )
}

function VerificationsTab({ refreshSig }) {
  const [profiles, setProfiles] = useState([])
  const [type, setType] = useState('all')
  const [loading, setLoading] = useState(false)
  const [previewSelfie, setPreviewSelfie] = useState(null)

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

  const renderRow = (p) => {
    const requests = p.verificationRequests || {}
    const types = ['selfie', 'gym', 'instagram'].filter(t => requests[t] === 'pending')
    return (
      <div key={p.id} className="p-4 flex items-start gap-3 text-sm">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
          {p.photos?.[0] ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/30">?</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{p.name}, {p.age}</div>
          <div className="text-xs text-white/55 truncate">{p.city} · {p.gymName}</div>
          {p.instagram && <div className="text-[11px] text-sky-400 mt-0.5">@{p.instagram}</div>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {types.map(t => (
              <span key={t} className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">{t}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {p.selfiePhoto && requests.selfie === 'pending' && (
            <Button size="sm" variant="outline" onClick={() => setPreviewSelfie(p.selfiePhoto)} className="bg-white/5 border-white/10 h-8 text-xs">View selfie</Button>
          )}
          {types.map(t => (
            <div key={t} className="flex gap-1">
              <Button size="sm" onClick={() => approve(p.id, t)} className="bg-[#00ff88] hover:bg-[#00cc6a] text-black h-8 text-xs flex-1"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approve {t}</Button>
              <Button size="sm" onClick={() => reject(p.id, t)} variant="outline" className="bg-white/5 border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 h-8 text-xs"><X className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {['all', 'selfie', 'gym', 'instagram'].map(t => (
            <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${type === t ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-white/40" />}
      </div>

      <Card className="glass border-white/10 divide-y divide-white/5 overflow-hidden">
        {profiles.length === 0 && (
          <div className="p-8 text-center text-white/45 text-sm">
            <BadgeCheck className="w-8 h-8 mx-auto mb-2 text-white/20" />
            No pending verifications.
            <p className="text-xs mt-1 text-white/35">Tip: enable manual review by setting <code className="text-[#00ff88]">MANUAL_VERIFICATION=true</code> in env.</p>
          </div>
        )}
        {profiles.map(renderRow)}
      </Card>

      <Dialog open={!!previewSelfie} onOpenChange={(o) => !o && setPreviewSelfie(null)}>
        <DialogContent className="bg-[#0a0b0d] border-white/10 max-w-md">
          <DialogHeader><DialogTitle>Selfie preview</DialogTitle></DialogHeader>
          {previewSelfie && <img src={previewSelfie} alt="selfie" className="w-full rounded-2xl" />}
        </DialogContent>
      </Dialog>
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
          <Crown className="w-6 h-6 text-[#00ff88]" />
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Admin Console</h1>
        </div>
        <Button onClick={refresh} variant="outline" size="sm" className="bg-white/5 border-white/10">
          <TrendingUp className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>
      <p className="text-white/55 text-sm mb-6">Trainr internal · access restricted to allowed admin emails.</p>

      {/* Pending alerts */}
      {stats && (stats.openReports > 0 || stats.pendingVerifications > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {stats.openReports > 0 && (
            <button onClick={() => setTab('reports')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/15 transition">
              <AlertTriangle className="w-4 h-4" /> {stats.openReports} open report{stats.openReports > 1 ? 's' : ''}
            </button>
          )}
          {stats.pendingVerifications > 0 && (
            <button onClick={() => setTab('verifications')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold hover:bg-sky-500/15 transition">
              <BadgeCheck className="w-4 h-4" /> {stats.pendingVerifications} verification{stats.pendingVerifications > 1 ? 's' : ''} awaiting review
            </button>
          )}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports {stats?.openReports ? `(${stats.openReports})` : ''}</TabsTrigger>
          <TabsTrigger value="verifications">Verifications {stats?.pendingVerifications ? `(${stats.pendingVerifications})` : ''}</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab stats={stats} analytics={analytics} /></TabsContent>
        <TabsContent value="reports"><ReportsTab refreshSig={refreshSig} /></TabsContent>
        <TabsContent value="verifications"><VerificationsTab refreshSig={refreshSig} /></TabsContent>
        <TabsContent value="users"><UsersTab refreshSig={refreshSig} /></TabsContent>
      </Tabs>
    </div>
  )
}
