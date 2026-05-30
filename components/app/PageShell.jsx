import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'

export default function PageShell({ title, kicker, children, onNav }) {
  return (
    <div className="pt-28 pb-20 fade-up">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div>
          <button onClick={() => onNav('landing')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-sky-600 transition mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>
        </div>
        {kicker && <Badge className="mb-4 bg-sky-50 hover:bg-sky-50 text-sky-600 border border-sky-150 rounded-full px-3 py-1 font-bold text-xs">{kicker}</Badge>}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800">{title}</h1>
        <div className="mt-8 space-y-6 text-slate-600 leading-relaxed font-medium">
          {children}
        </div>
      </div>
    </div>
  )
}
