import FAQView from '@/components/views/FAQView'
import { FAQ_ITEMS } from '@/lib/data/faqData'

export const metadata = {
  title: 'Trainr FAQ | Workout Partners and Fitness Accountability',
  description: 'Find answers to common questions about Trainr, workout partners, matching, safety, profiles and account support.',
  alternates: {
    canonical: 'https://trainr.in/faq',
  },
  openGraph: {
    title: 'Trainr FAQ | Workout Partners and Fitness Accountability',
    description: 'Find answers to common questions about Trainr, workout partners, matching, safety, profiles and account support.',
    url: 'https://trainr.in/faq',
    siteName: 'Trainr',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Trainr FAQ' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trainr FAQ | Workout Partners and Fitness Accountability',
    description: 'Find answers to common questions about Trainr, workout partners, matching, safety, profiles and account support.',
  },
}

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQView />
    </>
  )
}
