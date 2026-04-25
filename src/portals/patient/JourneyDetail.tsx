import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { formatDateTime } from '../../lib/format'
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

export default function JourneyDetail() {
  const { id: journeyId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: journey, loading } = useFirestoreDoc<CareJourney>(
    journeyId ? `care_journeys/${journeyId}` : ''
  )

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" className="text-teal-500" />
      </div>
    )
  }

  if (!journey || journey.patientId !== user?.uid) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-slate-500 mb-4">Journey not found.</p>
        <Link to="/patient/history">
          <Button variant="secondary">Back to history</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/patient/history" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-ink-700 transition-colors">
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back to history
        </Link>
      </div>

      <PageHeader
        title="Care journey detail"
        subtitle={journey.createdAt ? formatDateTime(journey.createdAt) : ''}
      />

      <div className="flex flex-col gap-6">
        <Card level={2} padding="md">
          <h3 className="text-sm font-semibold text-ink-800 mb-2">Reported symptoms</h3>
          <p className="text-slate-600 leading-relaxed">{journey.symptoms}</p>
        </Card>

        {journey.triage_result && (
        <Card level={2} padding="md">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm font-semibold text-ink-800">Assessment result</h3>
            <Badge variant={careTypeBadge[journey.triage_result.care_type]}>
              {careTypeLabel[journey.triage_result.care_type]}
            </Badge>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4">{journey.triage_result.reasoning}</p>
          {journey.triage_result.red_flags.length > 0 && (
            <div className="glass-1 rounded-2xl p-4">
              <h4 className="text-xs font-semibold text-rose-500 flex items-center gap-2 mb-2">
                <AlertTriangle size={13} strokeWidth={1.75} />
                Red flags
              </h4>
              <ul className="space-y-1">
                {journey.triage_result.red_flags.map((flag, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
        )}

        {journey.pre_visit_summary && (
          <Card level={2} padding="md">
            <h3 className="text-sm font-semibold text-ink-800 mb-4">Pre-visit summary</h3>
            <div>
              {journey.pre_visit_summary.split('\n').map((line, i) => (
                <p key={i} className="text-slate-600 leading-relaxed mb-2 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
