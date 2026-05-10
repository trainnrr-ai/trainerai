'use client'
import PageShell from '@/components/app/PageShell'
import { INSTAGRAM_URL, SUPPORT_EMAIL } from '@/lib/client/constants'

function Section({ title, children }) {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-2 text-sm text-white/70 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function PrivacyView({ onNav }) {
  return (
    <PageShell title="Privacy Policy" kicker="Last updated: 2025" onNav={onNav}>
      <p className="text-white/70">Trainr (trainr.in) is committed to protecting your privacy and building a safe fitness community. This page explains what we collect, how we use it, and how we keep you safe.</p>

      <div className="grid gap-4">
        <Section title="What we collect">
          <p>Account info from Google Sign-in (name, email, profile picture), and the fitness profile you create: photos, age, gender, city, gym, height, weight, goals, schedule, bio, and optional Instagram username.</p>
        </Section>
        <Section title="Profile photos & uploads">
          <p>You may upload 3 to 5 photos. By uploading, you confirm they are of you and that you have rights to use them. We may auto-flag images that violate our community standards.</p>
        </Section>
        <Section title="Profile verification">
          <p>Verification (selfie, Instagram, gym membership) is optional but strongly encouraged. Verified profiles get a blue badge and higher visibility.</p>
        </Section>
        <Section title="Moderation & reporting">
          <p>All chat messages pass through automated moderation. Reports are reviewed within 24 hours. We follow a clear escalation: <strong>Warning → Temporary suspension → Permanent ban</strong>.</p>
        </Section>
        <Section title="Anti-harassment policy">
          <p>Trainr has zero tolerance for sexual content, harassment, hate speech, or any unwanted advance. Repeated violations result in a permanent ban without refund.</p>
        </Section>
        <Section title="Women safety">
          <p>Women safety is a core priority. Anti-creep detection, easy one-tap report and block, women-only filter options, and strict verification standards are baked into the product.</p>
        </Section>
        <Section title="Your data, your control">
          <p>You can edit, hide or delete your profile anytime from Settings. To request full account deletion, email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00ff88] underline">{SUPPORT_EMAIL}</a>.</p>
        </Section>
        <Section title="Contact">
          <p>For privacy questions, write to <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00ff88] underline">{SUPPORT_EMAIL}</a> or DM us on Instagram <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-[#00ff88] underline">@trainr.in</a>.</p>
        </Section>
      </div>
    </PageShell>
  )
}
