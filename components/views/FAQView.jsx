'use client'
import { useState } from 'react'
import PageShell from '@/components/app/PageShell'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { FAQ_ITEMS } from '@/lib/data/faqData'

export default function FAQView({ onNav }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [openIndices, setOpenIndices] = useState([0, 1])

  const categories = ['All', 'General', 'Matching', 'Profile', 'Safety', 'Privacy', 'Account']

  const toggleFAQ = (index) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const filteredItems = FAQ_ITEMS.filter((item) => {
    const matchesSearch =
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <PageShell title="Frequently Asked Questions" kicker="Help & Knowledge Base" onNav={onNav}>
      <p className="text-lg text-slate-700 font-semibold leading-relaxed">
        Find answers to common questions about Trainr, workout partners, matching, safety, profiles and account support.
      </p>

      {/* Search Bar & Category Filter */}
      <div className="space-y-4 pt-2">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search questions (e.g., safety, verification, pricing, cities)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 bg-white border-slate-200 rounded-2xl text-sm shadow-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                activeCategory === cat
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3 pt-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            No questions found matching your search. Email us at{' '}
            <a href="mailto:support@trainr.in" className="text-sky-600 font-bold underline">
              support@trainr.in
            </a>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isOpen = openIndices.includes(idx)
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(idx)}
                  className="w-full text-left p-5 md:p-6 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {item.q}
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 md:px-6 pb-6 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 pt-4 font-normal">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Still have questions? */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 text-center space-y-3 mt-8">
        <h3 className="text-xl font-bold text-slate-900">Still have questions?</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Can't find the answer you're looking for? Reach out to our community support team.
        </p>
        <div className="pt-2">
          <a
            href="mailto:support@trainr.in"
            className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-sm transition"
          >
            Contact Support (support@trainr.in)
          </a>
        </div>
      </div>
    </PageShell>
  )
}
