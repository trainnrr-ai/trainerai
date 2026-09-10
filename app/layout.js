import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const OG_IMAGE = '/opengraph-image'

export const metadata = {
  metadataBase: new URL('https://trainr.in'),
  title: 'Find Gym Partners Near You | Trainr',
  description: 'Find compatible workout partners nearby based on your fitness goals, gym, schedule and experience. Build a routine you can actually stick to with Trainr.',
  alternates: {
    canonical: 'https://trainr.in',
  },
  icons: {
    icon: [{ url: '/favicon.svg?v=2', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.svg?v=2' }],
    shortcut: [{ url: '/favicon.svg?v=2' }],
  },
  openGraph: {
    title: 'Find Gym Partners Near You | Trainr',
    description: 'Find compatible workout partners nearby based on your fitness goals, gym, schedule and experience. Build a routine you can actually stick to with Trainr.',
    url: 'https://trainr.in',
    siteName: 'Trainr',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Trainr - Find Gym Partners Near You' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Gym Partners Near You | Trainr',
    description: 'Find compatible workout partners nearby based on your fitness goals, gym, schedule and experience. Build a routine you can actually stick to with Trainr.',
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
