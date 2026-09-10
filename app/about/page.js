import AboutView from '@/components/views/AboutView'

export const metadata = {
  title: 'About Trainr | Built for Fitness Accountability',
  description: 'Learn how Trainr helps people find compatible workout partners and build stronger, more consistent fitness routines.',
  alternates: {
    canonical: 'https://trainr.in/about',
  },
  openGraph: {
    title: 'About Trainr | Built for Fitness Accountability',
    description: 'Learn how Trainr helps people find compatible workout partners and build stronger, more consistent fitness routines.',
    url: 'https://trainr.in/about',
    siteName: 'Trainr',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'About Trainr' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Trainr | Built for Fitness Accountability',
    description: 'Learn how Trainr helps people find compatible workout partners and build stronger, more consistent fitness routines.',
  },
}

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Trainr',
    description: 'Trainr is a fitness accountability network helping people find compatible gym partners nearby.',
    url: 'https://trainr.in/about',
    mainEntity: {
      '@type': 'Organization',
      name: 'Trainr',
      url: 'https://trainr.in',
      logo: 'https://trainr.in/favicon.svg',
      sameAs: ['https://instagram.com/trainr.in'],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutView />
    </>
  )
}
