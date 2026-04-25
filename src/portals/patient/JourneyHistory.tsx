import { useState } from 'react'
import { Link } from 'react-router-dom'
import { where, orderBy } from 'firebase/firestore'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { formatDate, formatDateTime } from '../../lib/format'
import { ChevronRight, Stethoscope, AlertTriangle } from 'lucide-react'
import type { CareJourney, CareType } from '../../types'

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

export default function JourneyHistory() {
  const { user } = useAuth()
  const [limit, setLimit] = useState(5)
  const [selectedJourney, setSelectedJourney] = useState<(CareJourney & { id: string }) | null>(null)

  const { data: journeys, loading } = useFirestoreCollection<CareJourney>(
    'care_journeys',
    user
      ? [where('patientId', '==', user.uid), orderBy('createdAt', 'desc')]
      : []
  )

  const visibleJourneys = journeys.slice(0, limit)

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Care history"
        subtitle="A log of all your past symptom assessments."
        action={
          <Link to="/patient/symptoms">
            <Button size="sm">
              <Stethoscope size={16} strokeWidth={1.75} />
              New assessment
            </Button>
          </Link>
        }
      />

      {loading && (
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && journeys.length === 0 && (
        <EmptyState
          title="No care history yet"
          description="Your past care journeys will appear here after you complete your first assessment."
          action={
            <Link to="/patient/symptoms">
              <Button>Start your first assessment</Button>
            </Link>
          }
        />
      )}

      <div className="flex flex-col gap-2">
        {visibleJourneys.map((journey) => (
          <Card
            key={journey.id}
            level={1}
            padding="sm"
            className={`flex items-center gap-4 cursor-pointer hover:glass-2 transition-all duration-200 overflow-hidden ${
              journey.triage_result
                ? careTypeBorder[journey.triage_result.care_type]
                : 'border-l-4 border-l-teal-400'
            }`}
            onClick={() => setSelectedJourney(journey)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
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
              <p className="text-sm text-slate-600 truncate">
                {journey.symptoms ? journey.symptoms.slice(0, 80) : 'Direct booking'}
              </p>
            </div>
            <ChevronRight size={18} strokeWidth={1.75} className="text-slate-300 shrink-0" />
          </Card>
        ))}
      </div>

      {journeys.length > limit && (
        <button
          onClick={() => setLimit((l) => l + 5)}
          className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          Load more
        </button>
      )}

      <Modal
        open={selectedJourney !== null}
        onClose={() => setSelectedJourney(null)}
        title={selectedJourney?.createdAt ? formatDateTime(selectedJourney.createdAt) : 'Visit detail'}
        maxWidth="md"
      >
        {selectedJourney && (
          <div className="flex flex-col gap-4">
            {selectedJourney.triage_result && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={careTypeBadge[selectedJourney.triage_result.care_type]}>
                  {careTypeLabel[selectedJourney.triage_result.care_type]}
                </Badge>
              </div>
            )}

            {selectedJourney.symptoms && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Symptoms</p>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedJourney.symptoms}</p>
              </div>
            )}

            {selectedJourney.triage_result && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Assessment</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedJourney.triage_result.reasoning}
                </p>
              </div>
            )}

            {selectedJourney.triage_result?.red_flags && selectedJourney.triage_result.red_flags.length > 0 && (
              <div className="glass-1 rounded-2xl p-3">
                <h4 className="text-xs font-semibold text-rose-500 flex items-center gap-2 mb-2">
                  <AlertTriangle size={12} strokeWidth={1.75} />
                  Red flags
                </h4>
                <ul className="space-y-1">
                  {selectedJourney.triage_result.red_flags.map((flag, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedJourney.pre_visit_summary && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Pre-visit summary</p>
                {selectedJourney.pre_visit_summary.split('\n').map((line, i) => (
                  <p key={i} className="text-sm text-slate-700 leading-relaxed mb-1 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
