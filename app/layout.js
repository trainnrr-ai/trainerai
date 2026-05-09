import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const LOGO = 'https://customer-assets.emergentagent.com/job_workout-match-19/artifacts/u3kk6eqv_file_00000000e428720badf6b7f599a3a7f4.png'

export const metadata = {
  metadataBase: new URL('https://trainr.in'),
  title: 'Trainr — Your Fitness Accountability Network',
  description: 'Build your fitness network. Find verified workout partners nearby — matched by gym, goals, schedule and experience. A premium, safety-first fitness community platform.',
  keywords: ['fitness network', 'gym partner', 'workout partner', 'training partner', 'fitness community', 'accountability partner', 'gym networking', 'trainr', 'trainr.in'],
  icons: {
    icon: [{ url: LOGO, type: 'image/png' }],
    apple: [{ url: LOGO }],
    shortcut: [{ url: LOGO }],
  },
  openGraph: {
    title: 'Trainr — Your Fitness Accountability Network',
    description: 'Find verified workout partners nearby. Built for accountability, not dating.',
    url: 'https://trainr.in',
    siteName: 'Trainr',
    images: [{ url: LOGO, width: 1024, height: 1024 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trainr',
    description: 'Your fitness accountability network',
    images: [LOGO],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        {children}
        <Toaster theme="dark" position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
