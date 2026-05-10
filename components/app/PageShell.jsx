import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'

export default function PageShell({ title, kicker, children, onNav }) {
  return (
    <div className="pt-28 pb-20 fade-up">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <button onClick={() => onNav('landing')} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-[#00ff88] transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
        {kicker && <Badge className="mb-4 bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30 rounded-full px-3 py-1">{kicker}</Badge>}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight">{title}</h1>
        <div className="mt-10 space-y-6 text-white/75 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}
