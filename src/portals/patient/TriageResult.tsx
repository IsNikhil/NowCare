import { useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Siren, Clock, Video, Leaf, AlertTriangle, ArrowRight, Scan, CalendarDays } from 'lucide-react'
import type { TriageResult as TriageResultType, CareCategory } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

type LocationState = {
  triageResult: TriageResultType
  journeyId?: string
  symptoms?: string
}

type CareConfig = {
  icon: React.ReactNode
  headline: string
  colorClass: string
  badgeVariant: 'danger' | 'warning' | 'teal' | 'success'
  bgClass: string
}

const careConfig: Record<CareCategory, CareConfig> = {
  ER_NOW: {
    icon: <Siren size={40} strokeWidth={1.75} />,
    headline: 'Go to the ER now',
    colorClass: 'text-rose-500',
    badgeVariant: 'danger',
    bgClass: 'bg-rose-50',
  },
  URGENT_TODAY: {
    icon: <Clock size={40} strokeWidth={1.75} />,
    headline: 'See a doctor today',
    colorClass: 'text-amber-500',
    badgeVariant: 'warning',
    bgClass: 'bg-amber-50',
  },
  SCAN_NEEDED: {
    icon: <Scan size={40} strokeWidth={1.75} />,
    headline: 'Get a scan',
    colorClass: 'text-violet-500',
    badgeVariant: 'teal',
    bgClass: 'bg-violet-50',
  },
  TELEHEALTH: {
    icon: <Video size={40} strokeWidth={1.75} />,
    headline: 'Telehealth visit',
    colorClass: 'text-teal-500',
    badgeVariant: 'teal',
    bgClass: 'bg-teal-50',
  },
  SCHEDULE_DOCTOR: {
    icon: <CalendarDays size={40} strokeWidth={1.75} />,
    headline: 'Schedule with a doctor',
    colorClass: 'text-teal-500',
    badgeVariant: 'teal',
    bgClass: 'bg-teal-50',
  },
  SELF_CARE: {
    icon: <Leaf size={40} strokeWidth={1.75} />,
    headline: 'Safe to wait and monitor',
    colorClass: 'text-emerald-500',
    badgeVariant: 'success',
    bgClass: 'bg-emerald-50',
  },
}

const urgencyLabel: Record<string, string> = {
  immediate: 'Immediate attention needed',
  soon: 'See a provider soon',
  routine: 'Routine care',
}

export default function TriageResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null

  useEffect(() => {
    if (!state?.triageResult) {
      navigate('/patient/assess', { replace: true })
    }
  }, [state, navigate])

  if (!state?.triageResult) return null

  const { triageResult, journeyId } = state
  const config = careConfig[triageResult.care_category]

  function goToProviders() {
    navigate(`/patient/providers?category=${triageResult.care_category}&specialty=${triageResult.recommended_specialty ?? ''}`, {
      state: { journeyId },
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-800 tracking-tight mb-6">Assessment result</h1>

      <Card level={2} padding="lg" className="mb-6">
        <div className={`flex items-center gap-4 p-4 rounded-2xl mb-6 ${config.bgClass}`}>
          <span className={config.colorClass}>{config.icon}</span>
          <div>
            <h2 className={`text-2xl font-bold tracking-tight ${config.colorClass}`}>
              {config.headline}
            </h2>
            <Badge variant={config.badgeVariant} className="mt-1">
              {urgencyLabel[triageResult.urgency]}
            </Badge>
          </div>
        </div>

        <p className="text-slate-600 leading-relaxed mb-6">{triageResult.short_reasoning}</p>

        {triageResult.red_flags.length > 0 && (
          <div className="glass-1 rounded-2xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-rose-500 flex items-center gap-2 mb-3">
              <AlertTriangle size={16} strokeWidth={1.75} />
              Warning signs to watch for
            </h3>
            <ul className="space-y-2">
              {triageResult.red_flags.map((flag, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  {flag}
                </li>
              ))}
            </ul>
            <p className="text-xs text-rose-500 mt-3 font-medium">
              If any of these occur, seek immediate medical attention.
            </p>
          </div>
        )}

        <Button onClick={goToProviders} size="lg" fullWidth>
          Find providers
          <ArrowRight size={18} strokeWidth={1.75} />
        </Button>
      </Card>

      <div className="text-center">
        <Link to="/patient/history" className="text-sm text-slate-400 hover:text-slate-600">
          Back to history
        </Link>
      </div>
    </div>
  )
}
