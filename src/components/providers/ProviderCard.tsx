import type { WithId, Hospital, Doctor } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { ERStatusDisplay } from './ERStatusDisplay'
import { VerificationBadge } from './VerificationBadge'
import { stockUrl, STOCK } from '../../lib/stockPhotos'
import { formatDistance } from '../../lib/format'
import { MapPin } from 'lucide-react'

type HospitalCardProps = {
  provider: WithId<Hospital> & { distanceKm: number }
  onSelect: () => void
}

type DoctorCardProps = {
  provider: WithId<Doctor> & { distanceKm: number }
  onSelect: () => void
  onBook?: () => void
}

const avatars = [STOCK.doctorAvatar1, STOCK.doctorAvatar2, STOCK.doctorAvatar3]

function getAvatar(uid: string): string {
  const idx = uid.charCodeAt(0) % avatars.length
  return avatars[idx]
}

export function HospitalProviderCard({ provider, onSelect }: HospitalCardProps) {
  return (
    <Card level={1} className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <img
          src={stockUrl('heroHospital', 80)}
          alt="Hospital"
          className="w-14 h-14 rounded-2xl object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink-800 truncate">{provider.name}</h3>
          {provider.cms_data?.city && (
            <p className="text-xs text-slate-500 mt-0.5">
              {provider.cms_data.city}, {provider.cms_data.state}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {provider.er_status && (
              <ERStatusDisplay status={provider.er_status} updatedAt={provider.er_updated} />
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} strokeWidth={1.75} />
          {formatDistance(provider.distanceKm)}
        </span>
        <Button size="sm" onClick={onSelect}>
          Select
        </Button>
      </div>
    </Card>
  )
}

export function DoctorProviderCard({ provider, onSelect, onBook }: DoctorCardProps) {
  return (
    <Card level={1} className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <img
          src={`${getAvatar(provider.uid)}?w=80&q=80&auto=format&fit=crop`}
          alt="Doctor"
          className="w-14 h-14 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink-800 truncate">
            {provider.npi_data?.name ?? 'Doctor'}
          </h3>
          {provider.specialty && (
            <p className="text-xs text-slate-500 mt-0.5">{provider.specialty}</p>
          )}
          {provider.verified && (
            <div className="mt-1">
              <VerificationBadge badge={provider.badge} />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} strokeWidth={1.75} />
          {formatDistance(provider.distanceKm)}
        </span>
        <div className="flex gap-2">
          {onBook && (
            <Button size="sm" variant="secondary" onClick={onBook}>
              Book appointment
            </Button>
          )}
          <Button size="sm" onClick={onSelect}>
            Select
          </Button>
        </div>
      </div>
    </Card>
  )
}
