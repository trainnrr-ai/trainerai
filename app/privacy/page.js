import PrivacyView from '@/components/views/PrivacyView'

export const metadata = {
  title: 'Privacy Policy | Trainr',
  description: 'Learn how Trainr collects, uses, stores and protects personal information.',
  alternates: {
    canonical: 'https://trainr.in/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Trainr',
    description: 'Learn how Trainr collects, uses, stores and protects personal information.',
    url: 'https://trainr.in/privacy',
    siteName: 'Trainr',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Trainr Privacy Policy' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Trainr',
    description: 'Learn how Trainr collects, uses, stores and protects personal information.',
  },
}

export default function PrivacyPage() {
  return <PrivacyView />
}
