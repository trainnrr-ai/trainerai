import SafetyView from '@/components/views/SafetyView'

export const metadata = {
  title: 'Safety at Trainr | Community Guidelines and Support',
  description: 'Learn how to use Trainr safely, connect respectfully and report or block inappropriate behaviour.',
  alternates: {
    canonical: 'https://trainr.in/safety',
  },
  openGraph: {
    title: 'Safety at Trainr | Community Guidelines and Support',
    description: 'Learn how to use Trainr safely, connect respectfully and report or block inappropriate behaviour.',
    url: 'https://trainr.in/safety',
    siteName: 'Trainr',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Safety at Trainr' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Safety at Trainr | Community Guidelines and Support',
    description: 'Learn how to use Trainr safely, connect respectfully and report or block inappropriate behaviour.',
  },
}

export default function SafetyPage() {
  return <SafetyView />
}
