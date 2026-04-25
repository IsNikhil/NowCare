import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { where, orderBy } from 'firebase/firestore'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { ArrowRight } from 'lucide-react'
import { formatDate } from '../../lib/format'
import type { CareJourney, CareType, Doctor } from '../../types'

const FALLBACK_SPECIALTIES = [
  'Internal Medicine',
  'Cardiology',
  'Pediatrics',
  'Family Medicine',
  'Orthopedics',
  'Dermatology',
  'Neurology',
]

const careTypeBadge: Record<CareType, 'danger' | 'warning' | 'teal' | 'success'> = {
  er: 'danger',
  urgent: 'warning',
  telehealth: 'teal',
  wait: 'success',
}

const careTypeLabel: Record<CareType, string> = {
  er: 'Emergency Room',
  urgent: 'Same-day care',
  telehealth: 'Telehealth',
  wait: 'Monitor at Home',
}

const careTypeBorder: Record<CareType, string> = {
  er: 'border-l-4 border-l-rose-400',
  urgent: 'border-l-4 border-l-amber-400',
  telehealth: 'border-l-4 border-l-teal-400',
  wait: 'border-l-4 border-l-slate-300',
}

export default function PatientHome() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: journeys, loading } = useFirestoreCollection<CareJourney>(
    'care_journeys',
    user ? [where('patientId', '==', user.uid), orderBy('createdAt', 'desc')] : []
  )

  const { data: allDoctors } = useFirestoreCollection<Doctor>('doctors', [])

  const specialties = useMemo(() => {
    const seen = new Set<string>()
    for (const d of allDoctors) {
      if (d.specialty?.trim()) seen.add(d.specialty.trim())
    }
    return [...seen].sort().slice(0, 8)
  }, [allDoctors])

  const pillSpecialties = specialties.length > 0 ? specialties : FALLBACK_SPECIALTIES

  const recentJourneys = journeys.slice(0, 5)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-800 tracking-tight mb-2">Find care</h1>
        <p className="text-base text-slate-500 mb-6">Describe your symptoms and find the right medical care near you right now.</p>
        <div className="max-w-xs">
          <Link to="/patient/symptoms">
            <Button size="lg" fullWidth>
              Find care now
              <ArrowRight size={18} strokeWidth={1.75} />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 mb-1">Find a specialist</h2>
        <p className="text-xs text-slate-400 mb-3">Browse doctors by specialty.</p>
        <div className="flex overflow-x-auto pb-1 gap-2 flex-nowrap">
          {pillSpecialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => navigate(`/patient/providers?type=wait&specialty=${encodeURIComponent(specialty)}`)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white/60 border border-white/60 text-ink-800 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-all duration-150"
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 mb-3">Recent visits</h2>

        {loading && <SkeletonCard />}

        {!loading && recentJourneys.length === 0 && (
          <p className="text-sm text-slate-400 py-4">No past visits yet.</p>
        )}

        <div className="flex flex-col gap-2">
          {recentJourneys.map((journey) => (
            <Card
              key={journey.id}
              level={1}
              padding="sm"
              className={`flex items-center gap-3 cursor-pointer hover:glass-2 transition-all duration-200 overflow-hidden ${
                journey.triage_result
                  ? careTypeBorder[journey.triage_result.care_type]
                  : 'border-l-4 border-l-teal-400'
              }`}
              onClick={() => navigate('/patient/history')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  {journey.triage_result ? (
                    <Badge variant={careTypeBadge[journey.triage_result.care_type]}>
                      {careTypeLabel[journey.triage_result.care_type]}
                    </Badge>
                  ) : (
                    <Badge variant="teal">Appointment</Badge>
                  )}
                  {journey.createdAt && (
                    <span className="text-xs text-slate-400 shrink-0">{formatDate(journey.createdAt)}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {journey.symptoms ? journey.symptoms.slice(0, 80) : 'Direct booking'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
