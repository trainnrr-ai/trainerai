import { CheckCircle2 } from 'lucide-react'

export default function VerificationBadge({ verified, size = 'sm' }) {
  if (!verified) return null
  const dim = size === 'lg' ? 'w-6 h-6' : 'w-[18px] h-[18px]'
  const ic = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
  return (
    <span
      className={`inline-flex items-center justify-center ${dim} rounded-full bg-gradient-to-br from-sky-400 to-blue-600 ring-2 ring-background shadow-sm shadow-blue-500/40`}
      title="Verified profile"
    >
      <CheckCircle2 className={`${ic} text-white`} strokeWidth={3} />
    </span>
  )
}
