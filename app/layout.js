import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Trainr \u2014 Your Fitness Accountability Network',
  description: 'Build your fitness network. Find verified workout partners nearby — matched by gym, goals, schedule and experience. A premium, safety-first fitness community platform.',
  keywords: ['fitness network', 'gym partner', 'workout partner', 'training partner', 'fitness community', 'accountability partner', 'gym networking', 'trainr'],
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
