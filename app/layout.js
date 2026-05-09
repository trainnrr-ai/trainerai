import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Spottr \u2014 Find Your Perfect Workout Partner',
  description: 'Connect with fitness partners nearby based on gym, goals, and workout schedule. A premium, women-safety-first fitness networking platform.',
  keywords: ['fitness', 'gym partner', 'workout buddy', 'fitness community', 'gym', 'spottr'],
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
