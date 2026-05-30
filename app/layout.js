import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const OG_IMAGE = '/opengraph-image'

export const metadata = {
  metadataBase: new URL('https://trainr.in'),
  title: 'Trainr — Built for accountability, not dating',
  description: "Find verified gym partners nearby, matched by goals, schedule and experience. India's premium fitness accountability network.",
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.svg' }],
    shortcut: [{ url: '/favicon.svg' }],
  },
  openGraph: {
    title: 'Trainr — Built for accountability, not dating',
    description: "Find verified gym partners nearby, matched by goals, schedule and experience. India's premium fitness accountability network.",
    url: 'https://trainr.in',
    siteName: 'Trainr',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Trainr accountability network' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trainr — Built for accountability, not dating',
    description: "Find verified gym partners nearby, matched by goals, schedule and experience. India's premium fitness accountability network.",
    images: [OG_IMAGE],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: 'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);' }} />
      </head>
      <body>
        <noscript>
          <div style={{ padding: 16, textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Trainr needs JavaScript to help you find and message verified gym partners.
          </div>
        </noscript>
        {children}
        <Toaster theme="light" position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
