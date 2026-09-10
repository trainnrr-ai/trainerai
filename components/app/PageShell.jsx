'use client'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { LOGO } from '@/lib/client/constants'

export default function PageShell({ title, kicker, children, onNav }) {
  const handleBack = () => {
    if (typeof onNav === 'function') {
      onNav('landing')
    } else if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Sticky Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" onClick={(e) => {
            if (typeof onNav === 'function') {
              e.preventDefault()
              onNav('landing')
            }
          }} className="flex items-center gap-2 group">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 group-hover:border-sky-500/50 transition">
              <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" loading="eager" width={36} height={36} />
            </div>
            <span className="text-lg md:text-xl font-extrabold tracking-tight text-slate-800">Trainr</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              onClick={(e) => {
                if (typeof onNav === 'function') {
                  e.preventDefault()
                  onNav('landing')
                }
              }}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={(e) => {
                if (typeof onNav === 'function') {
                  e.preventDefault()
                  onNav('about')
                }
              }}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              About
            </Link>
            <Link
              href="/safety"
              onClick={(e) => {
                if (typeof onNav === 'function') {
                  e.preventDefault()
                  onNav('safety')
                }
              }}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition hidden sm:inline"
            >
              Safety
            </Link>
            <Link
              href="/faq"
              onClick={(e) => {
                if (typeof onNav === 'function') {
                  e.preventDefault()
                  onNav('faq')
                }
              }}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition hidden sm:inline"
            >
              FAQ
            </Link>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('trainr:open-auth', { detail: { tab: 'phone' } }))
                }
              }}
              className="text-xs sm:text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white px-3.5 py-1.5 rounded-full shadow-sm transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-24 md:pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="mb-6">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-sky-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to home
            </button>
          </div>
          {kicker && (
            <Badge className="mb-3 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-full px-3 py-1 font-bold text-xs">
              <Sparkles className="w-3 h-3 mr-1 text-sky-500 inline" />
              {kicker}
            </Badge>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            {title}
          </h1>
          <div className="mt-8 space-y-6 text-slate-600 leading-relaxed font-normal">
            {children}
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <img src={LOGO} alt="Trainr" className="w-full h-full object-cover" width={28} height={28} />
              </div>
              <span className="font-extrabold text-slate-900">Trainr</span>
              <span className="text-xs text-slate-500 ml-2">© {new Date().getFullYear()} Trainr. All rights reserved.</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-slate-600">
              <Link href="/about" className="hover:text-slate-900 transition">About</Link>
              <Link href="/safety" className="hover:text-slate-900 transition">Safety</Link>
              <Link href="/faq" className="hover:text-slate-900 transition">FAQ</Link>
              <Link href="/privacy" className="hover:text-slate-900 transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-900 transition">Terms of Service</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
