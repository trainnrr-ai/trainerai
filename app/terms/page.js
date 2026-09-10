import TermsView from '@/components/views/TermsView'

export const metadata = {
  title: 'Terms of Service | Trainr',
  description: 'Read the Terms of Service governing use of Trainr\'s fitness accountability platform.',
  alternates: {
    canonical: 'https://trainr.in/terms',
  },
  openGraph: {
    title: 'Terms of Service | Trainr',
    description: 'Read the Terms of Service governing use of Trainr\'s fitness accountability platform.',
    url: 'https://trainr.in/terms',
    siteName: 'Trainr',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Trainr Terms of Service' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Trainr',
    description: 'Read the Terms of Service governing use of Trainr\'s fitness accountability platform.',
  },
}

export default function TermsPage() {
  return <TermsView />
}
