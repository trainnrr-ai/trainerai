'use client'
import PageShell from '@/components/app/PageShell'
import { FileText, CheckSquare, Shield, AlertTriangle, Scale, Lock } from 'lucide-react'
import { SUPPORT_EMAIL } from '@/lib/client/constants'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-3">
      {Icon && (
        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-2">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      <div className="text-sm sm:text-base text-slate-600 leading-relaxed space-y-3 font-normal">
        {children}
      </div>
    </div>
  )
}

export default function TermsView({ onNav }) {
  return (
    <PageShell title="Terms of Service" kicker="Effective Date: September 2026" onNav={onNav}>
      <p className="text-base sm:text-lg text-slate-700 font-semibold leading-relaxed">
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Trainr&rsquo;s website, application and related services. By creating an account or using Trainr, you agree to these Terms.
      </p>

      <p className="text-sm text-slate-500 font-medium">
        If you do not agree to these Terms, do not use Trainr.
      </p>

      <div className="space-y-6 mt-6">
        {/* Eligibility */}
        <Section title="1. Eligibility" icon={CheckSquare}>
          <p>
            You must be at least <strong>18 years old</strong> to use Trainr. By using the service, you confirm that you meet this age requirement and that all information you provide is accurate and truthful.
          </p>
        </Section>

        {/* Your account */}
        <Section title="2. Your account" icon={Lock}>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs through your account.
          </p>
          <p>
            You must provide accurate information and keep it up to date. You must not create an account using another person&rsquo;s identity or use Trainr to impersonate anyone else.
          </p>
        </Section>

        {/* Purpose of Trainr */}
        <Section title="3. Purpose of Trainr & Disclaimers" icon={Shield}>
          <p>
            Trainr is a platform intended to help members discover compatible workout partners and build fitness accountability.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm space-y-1 text-slate-700">
            <p className="font-semibold text-slate-900">Please Note:</p>
            <p>• Trainr does not provide medical advice or certified personal training services.</p>
            <p>• Trainr does not perform criminal background checks.</p>
            <p>• Trainr does not provide emergency assistance or guarantee member identity, conduct, or compatibility.</p>
          </div>
        </Section>

        {/* Member conduct */}
        <Section title="4. Member conduct" icon={AlertTriangle}>
          <p>You agree to use Trainr respectfully and lawfully. You must not:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Harass, threaten, exploit or intimidate another member.</li>
            <li>Send unwanted sexual, explicit, hateful, abusive or discriminatory content.</li>
            <li>Misrepresent your identity, age, location, credentials or intentions.</li>
            <li>Use Trainr for scams, financial solicitation, spam or unauthorised commercial activity.</li>
            <li>Post unlawful, infringing, defamatory or harmful content.</li>
            <li>Collect, copy or misuse another person&rsquo;s information without permission.</li>
            <li>Circumvent safety, reporting, blocking or account restriction features.</li>
          </ul>
          <p className="text-xs text-rose-700 font-semibold pt-1">
            We may investigate violations and take action including warnings, content removal, account limitations, suspension or permanent termination.
          </p>
        </Section>

        {/* User content */}
        <Section title="5. User content" icon={FileText}>
          <p>
            You retain ownership of content you submit to Trainr, including profile information, photos and messages. By submitting content, you grant Trainr a limited, non-exclusive right to host, display and process it solely to operate and improve the service.
          </p>
          <p>
            You are responsible for ensuring that your content is accurate, lawful and does not infringe the rights of others.
          </p>
        </Section>

        {/* Interactions with other members */}
        <Section title="6. Interactions with other members" icon={Shield}>
          <p>
            You are solely responsible for your interactions with other members, including any decision to communicate, connect or meet offline.
          </p>
          <p>
            Use good judgment. Meet in public places, protect your personal information and follow the safety guidance provided by Trainr.
          </p>
        </Section>

        {/* Reports and safety */}
        <Section title="7. Reports and safety" icon={Shield}>
          <p>
            You may report behaviour that violates our guidelines. We may review reports and take action at our discretion, subject to applicable law and our internal policies.
          </p>
          <p>
            Reporting does not guarantee a specific outcome or response time. In an emergency, contact local emergency services rather than relying on Trainr.
          </p>
        </Section>

        {/* Paid features */}
        <Section title="8. Paid features & Subscriptions" icon={CheckSquare}>
          <p>
            If Trainr offers optional paid features, pricing, billing cycle, cancellation rights, refund eligibility and payment terms will be presented clearly before purchase. Unless required by law, fees are non-refundable except where expressly stated.
          </p>
        </Section>

        {/* Intellectual property */}
        <Section title="9. Intellectual property" icon={Scale}>
          <p>
            Trainr, its logos, branding, software, design and content are owned by or licensed to Trainr. You may not copy, modify, distribute, reverse engineer or use Trainr&rsquo;s intellectual property without written permission.
          </p>
        </Section>

        {/* Suspension and termination */}
        <Section title="10. Suspension and termination" icon={AlertTriangle}>
          <p>
            We may suspend or terminate your access to Trainr if we reasonably believe that you have violated these Terms, created a safety risk, engaged in fraud or misused the platform.
          </p>
          <p>
            You may stop using Trainr and request account deletion at any time through Account Settings or by emailing <a href="mailto:support@trainr.in" className="text-sky-600 font-bold underline">support@trainr.in</a>.
          </p>
        </Section>

        {/* Disclaimer and limitation of liability */}
        <Section title="11. Disclaimer and limitation of liability" icon={Scale}>
          <p>
            Trainr is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the maximum extent permitted by law, Trainr does not guarantee uninterrupted service, successful matches, fitness outcomes or the conduct of other members.
          </p>
          <p>
            To the maximum extent permitted by law, Trainr will not be liable for indirect, incidental, special, consequential or punitive damages arising from your use of Trainr or interactions with other members.
          </p>
        </Section>

        {/* Governing law and contact */}
        <Section title="12. Governing law and contact" icon={Scale}>
          <p>
            These Terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the competent courts in Mumbai, India.
          </p>
          <p>
            For questions about these Terms, contact <a href="mailto:legal@trainr.in" className="text-sky-600 font-bold underline">legal@trainr.in</a> or <a href="mailto:support@trainr.in" className="text-sky-600 font-bold underline">support@trainr.in</a>.
          </p>
        </Section>
      </div>
    </PageShell>
  )
}
