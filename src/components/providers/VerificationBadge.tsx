import { ShieldCheck } from 'lucide-react'
import type { VerificationBadge as VBType } from '../../types'

const config: Record<VBType, { label: string; color: string }> = {
  hospital_verified: { label: 'Hospital Verified', color: 'text-emerald-600' },
  npi_verified: { label: 'NPI Verified', color: 'text-blue-600' },
}

export function VerificationBadge({ badge }: { badge: VBType }) {
  const { label, color } = config[badge]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${color}`}>
      <ShieldCheck size={13} strokeWidth={1.75} />
      {label}
    </span>
  )
}
