'use client'
import PageShell from '@/components/app/PageShell'
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle, Mail } from 'lucide-react'
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

export default function PrivacyView({ onNav }) {
  return (
    <PageShell title="Privacy Policy" kicker="Last updated: September 2026" onNav={onNav}>
      <p className="text-base sm:text-lg text-slate-700 font-semibold leading-relaxed">
        Trainr (&ldquo;Trainr&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;) operates the Trainr website, application and related services. This Privacy Policy explains how we collect, use, share and protect personal data when you use Trainr.
      </p>

      <p className="text-sm text-slate-500 font-medium">
        Please read this Policy carefully before creating an account or using our services.
      </p>

      <div className="space-y-6 mt-6">
        {/* Information we collect */}
        <Section title="1. Information we collect" icon={Database}>
          <p className="font-semibold text-slate-800">Account information</p>
          <p>When you create an account, we may collect information such as your name, email address, phone number, authentication details and profile image.</p>

          <p className="font-semibold text-slate-800 pt-2">Profile information</p>
          <p>To provide matching and community features, we may collect information you choose to add to your profile, including photos, age, gender, city or general location, gym name or preferred workout area, fitness goals, training schedule, fitness experience level, bio and optional social profile details.</p>

          <p className="font-semibold text-slate-800 pt-2">Connections and communications</p>
          <p>We may collect information relating to connection requests, matches, reports, blocks and messages sent through Trainr.</p>

          <p className="font-semibold text-slate-800 pt-2">Location information</p>
          <p>If you choose to grant location permission, Trainr may use approximate or device location information to support relevant location-based features. You can control location permissions through your device settings.</p>

          <p className="font-semibold text-slate-800 pt-2">Technical information</p>
          <p>We may collect device, browser, IP address, log, cookie and usage information to operate, secure and improve Trainr.</p>
        </Section>

        {/* How we use information */}
        <Section title="2. How we use information" icon={Eye}>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Create, operate and manage your account.</li>
            <li>Display your profile and help you discover compatible members.</li>
            <li>Enable connection requests and in-app messaging.</li>
            <li>Respond to support requests.</li>
            <li>Review reports, investigate misuse and maintain community safety.</li>
            <li>Improve product features, performance and user experience.</li>
            <li>Communicate service-related notices.</li>
            <li>Comply with legal obligations and enforce our Terms of Service.</li>
          </ul>
        </Section>

        {/* Profile visibility */}
        <Section title="3. Profile visibility" icon={UserCheck}>
          <p>Information you add to your Trainr profile may be visible to other Trainr members, depending on the product settings and features available at the time.</p>
          <p className="font-medium text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200/60">
            Do not include sensitive personal information in your public profile or messages unless you are comfortable sharing it with other members.
          </p>
        </Section>

        {/* How we share information */}
        <Section title="4. How we share information" icon={Lock}>
          <p>We may share personal data with trusted service providers that support Trainr, including providers for hosting, authentication, databases, analytics, customer support, security and communications.</p>
          <p>We may also disclose information where required by law, to protect the safety of users, to investigate fraud or abuse, or to enforce our Terms of Service.</p>
          <p className="font-bold text-slate-900">We do not sell personal data.</p>
        </Section>

        {/* Data retention */}
        <Section title="5. Data retention" icon={Database}>
          <p>We retain personal data only for as long as reasonably necessary to provide Trainr, meet legal obligations, resolve disputes, enforce agreements and maintain records.</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Active account data:</strong> Retained while your account remains active.</li>
            <li><strong>Deleted account data:</strong> Purged from active databases within 30 days of deletion request.</li>
            <li><strong>Safety & report records:</strong> Retained for compliance, fraud prevention, and user safety enforcement.</li>
          </ul>
        </Section>

        {/* Your choices and rights */}
        <Section title="6. Your choices and rights" icon={Shield}>
          <p>Depending on applicable law, you may have the right to access your personal data, correct inaccurate information, update your profile, withdraw consent for optional processing, request deletion of your account and personal data, and raise a privacy concern or complaint.</p>
          <p>To exercise these rights, contact <a href="mailto:privacy@trainr.in" className="text-sky-600 font-bold underline">privacy@trainr.in</a> or use available account settings.</p>
        </Section>

        {/* Data security */}
        <Section title="7. Data security" icon={Lock}>
          <p>We use reasonable technical and organisational measures designed to protect personal data. However, no internet-based service can guarantee absolute security. You are responsible for keeping your login credentials secure and for using Trainr responsibly.</p>
        </Section>

        {/* Children */}
        <Section title="8. Age restriction & Children" icon={AlertCircle}>
          <p>Trainr is not intended for individuals under <strong>18 years of age</strong>. We do not knowingly collect personal data from children. If you believe a child has provided us personal data, contact us at <a href="mailto:privacy@trainr.in" className="text-sky-600 font-bold underline">privacy@trainr.in</a>.</p>
        </Section>

        {/* Contact and grievances */}
        <Section title="9. Contact and grievances" icon={Mail}>
          <p>For privacy queries, data requests or grievances, please reach out to our team:</p>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm space-y-1">
            <p><strong>Platform:</strong> Trainr</p>
            <p><strong>Privacy Email:</strong> <a href="mailto:privacy@trainr.in" className="text-sky-600 font-semibold underline">privacy@trainr.in</a></p>
            <p><strong>Support & Safety:</strong> <a href="mailto:support@trainr.in" className="text-sky-600 font-semibold underline">support@trainr.in</a></p>
            <p><strong>Jurisdiction:</strong> India</p>
          </div>
        </Section>
      </div>
    </PageShell>
  )
}
