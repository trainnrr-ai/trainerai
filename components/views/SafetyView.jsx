'use client'
import PageShell from '@/components/app/PageShell'
import { Badge } from '@/components/ui/badge'
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Lock, Eye, Flag,
  Ban, MapPin, PhoneCall, CheckCircle2, XCircle, HeartHandshake,
} from 'lucide-react'
import { SUPPORT_EMAIL } from '@/lib/client/constants'

export default function SafetyView({ onNav }) {
  return (
    <PageShell title="Fitness connections should feel respectful, comfortable and in your control." kicker="Community Safety & Guidelines" onNav={onNav}>
      <p className="text-lg text-slate-700 font-semibold leading-relaxed">
        Trainr is designed to help people find workout partners and build healthier routines. Every member deserves an experience that is focused on fitness, respectful communication and personal safety.
      </p>

      <p className="text-base text-slate-600 leading-relaxed font-normal">
        No online platform can guarantee every interaction or every person's behaviour. That is why we encourage members to use good judgment, set clear boundaries and use Trainr's safety tools whenever needed.
      </p>

      {/* What we expect from every member */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Ban className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">What we expect from every member.</h2>
        </div>

        <p className="text-slate-600 leading-relaxed font-medium">
          Trainr is for people looking for genuine fitness accountability. By using Trainr, you agree to treat every member with respect. <strong>You must never:</strong>
        </p>

        <div className="grid gap-3">
          {[
            'Harass, threaten, shame or intimidate another person.',
            'Send unwanted sexual, explicit or inappropriate messages.',
            'Share hateful, discriminatory or abusive content.',
            'Misrepresent your identity, age, location or intentions.',
            'Request money, send scams or promote fraudulent offers.',
            'Share another person\'s private information without permission.',
            'Use the platform for unwanted solicitation or commercial spam.',
            'Pressure anyone to meet, share personal details or continue a conversation.',
          ].map((rule, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl font-medium">
              <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{rule}</span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-rose-50/70 border border-rose-200/70 rounded-2xl text-xs sm:text-sm text-rose-900 font-semibold leading-relaxed">
          Violations may result in content removal, account restrictions, suspension or permanent removal from Trainr, subject to our review process and Terms of Service.
        </div>
      </div>

      {/* Take your time. You are always in control */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Take your time. You are always in control.</h2>
        </div>

        <p className="text-slate-600 font-medium">Before sending a connection request or replying to a message:</p>

        <div className="grid gap-3">
          {[
            'Review the person\'s profile carefully.',
            'Consider whether their goals, schedule and gym routine are genuinely compatible with yours.',
            'Keep early conversations focused on fitness and logistics.',
            'Do not feel pressured to reply, connect or meet.',
            'Do not share your home address, financial information, passwords or sensitive documents.',
            'Trust your instincts. If something feels off, stop the conversation.',
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl font-medium">
              <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Meet safely and keep the first session simple */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <MapPin className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Meet safely and keep the first session simple.</h2>
        </div>

        <p className="text-slate-600 font-medium">If you decide to meet someone through Trainr:</p>

        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'Choose a public gym, fitness studio, park or other public workout location.',
            'Avoid meeting for the first time at a private home or isolated place.',
            'Tell a trusted friend or family member where you are going.',
            'Arrange your own transportation to and from the meeting.',
            'Keep your phone charged and accessible.',
            'Leave immediately if you feel uncomfortable at any point.',
            'If there is immediate danger, contact local emergency services first.',
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 bg-emerald-50/40 border border-emerald-100/80 p-3.5 rounded-xl font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 italic pt-2">
          Trainr is not responsible for offline interactions between members. Please make decisions that protect your comfort and safety.
        </p>
      </div>

      {/* Speak up when something does not feel right */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Flag className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Speak up when something does not feel right.</h2>
        </div>

        <p className="text-slate-600 leading-relaxed">
          If someone sends inappropriate messages, misrepresents themselves, pressures you or behaves in a way that violates these guidelines, use the <strong>report or block function</strong> in the app.
        </p>

        <p className="text-slate-600 leading-relaxed">
          <strong>Blocking</strong> prevents a member from contacting you through Trainr. <strong>Reporting</strong> lets our team review behaviour that may violate our rules.
        </p>

        <p className="text-slate-600 leading-relaxed">
          When submitting a report, include accurate details and relevant context. False or malicious reports are also not allowed.
        </p>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700">
          <span className="font-bold text-slate-900">Safety & Support Contact:</span>{' '}
          <a href={`mailto:safety@trainr.in`} className="text-sky-600 hover:text-sky-700 font-bold underline">
            safety@trainr.in
          </a>
        </div>
      </div>

      {/* Verification disclaimers */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Verification can support trust, but it is not a guarantee.</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Trainr may offer verification features or profile markers to help members make more informed choices. Verification does not guarantee identity, behaviour, intentions or safety. Always use your judgment before connecting or meeting.
        </p>
      </div>

      {/* Emergency Alert Callout */}
      <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-3xl p-6 shadow-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-base text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>Emergency Assistance Notice</span>
        </div>
        <p className="text-sm leading-relaxed font-medium">
          <strong>Important:</strong> Trainr cannot provide emergency assistance. If you believe you are in immediate danger or someone is threatening you, contact local emergency services (112 / 100 in India) or a trusted person immediately.
        </p>
      </div>
    </PageShell>
  )
}
