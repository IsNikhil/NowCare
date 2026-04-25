import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { where, orderBy } from 'firebase/firestore'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Leaf,
  Scan,
  Siren,
  Stethoscope,
  Video,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SkeletonList } from '../../components/ui/Skeleton'
import { CARE_CATEGORY_CONFIG } from '../../lib/careCategories'
import { formatDateTime, formatRelativeTime } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import type { CareCategory, CareJourney, PatientDocument } from '../../types'

type FilterTab = 'all' | 'assessments' | 'documents'

type TimelineItem =
  | { type: 'assessment'; id: string; date: any; data: CareJourney }
  | { type: 'document'; id: string; date: any; data: PatientDocument }

const CARE_ICONS: Record<CareCategory, React.ReactNode> = {
  ER_NOW: <Siren size={16} strokeWidth={1.75} />,
  URGENT_TODAY: <Clock size={16} strokeWidth={1.75} />,
  SCAN_NEEDED: <Scan size={16} strokeWidth={1.75} />,
  TELEHEALTH: <Video size={16} strokeWidth={1.75} />,
  SCHEDULE_DOCTOR: <CalendarDays size={16} strokeWidth={1.75} />,
  SELF_CARE: <Leaf size={16} strokeWidth={1.75} />,
}

function getItemId(item: TimelineItem) {
  return `${item.type}:${item.id}`
}

function getMonthLabel(ts: any) {
  if (!ts?.toDate) return 'Undated'
  return ts.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function groupByMonth(items: TimelineItem[]) {
  const groups: Record<string, TimelineItem[]> = {}
  for (const item of items) {
    const key = getMonthLabel(item.date)
    groups[key] ??= []
    groups[key].push(item)
  }
  return groups
}

function assessmentVariant(cat?: CareCategory): 'danger' | 'warning' | 'success' | 'teal' {
  if (cat === 'ER_NOW') return 'danger'
  if (cat === 'URGENT_TODAY') return 'warning'
  if (cat === 'SELF_CARE') return 'success'
  return 'teal'
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getAssessmentTitle(journey: CareJourney) {
  const cat = journey.triage_result?.care_category
  const cfg = cat ? CARE_CATEGORY_CONFIG[cat] : null
  return cfg?.headline ?? 'Assessment result not saved'
}

function EventCard({
  item,
  selected,
  onSelect,
}: {
  item: TimelineItem
  selected: boolean
  onSelect: () => void
}) {
  if (item.type === 'assessment') {
    const journey = item.data
    const cat = journey.triage_result?.care_category
    const cfg = cat ? CARE_CATEGORY_CONFIG[cat] : null
    const color = cfg?.color ?? 'var(--accent-teal)'
    const resultChips = [
      cat ? cfg?.label ?? titleCase(cat) : null,
      journey.triage_result?.urgency ? titleCase(journey.triage_result.urgency) : null,
      journey.triage_result?.recommended_specialty,
      journey.triage_result?.scan_type,
    ].filter(Boolean)

    return (
      <button onClick={onSelect} className="block w-full text-left">
        <GlassCard
          className="p-4 transition-all"
          style={{
            borderColor: selected ? `color-mix(in oklch, ${color} 45%, transparent)` : undefined,
            background: selected ? `linear-gradient(135deg, color-mix(in oklch, ${color} 10%, var(--bg-glass)), var(--bg-glass))` : undefined,
          }}
        >
          <div className="flex gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
              style={{
                background: `color-mix(in oklch, ${color} 14%, transparent)`,
                borderColor: `color-mix(in oklch, ${color} 35%, transparent)`,
                color,
              }}
            >
              {cat ? CARE_ICONS[cat] : <Stethoscope size={16} strokeWidth={1.75} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={cat ? assessmentVariant(cat) : 'teal'}>
                  {cat ? 'Gemini result' : 'Symptoms only'}
                </Badge>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {item.date ? formatRelativeTime(item.date) : 'No date'}
                </span>
              </div>
              <p className="line-clamp-2 text-base font-extrabold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {getAssessmentTitle(journey)}
              </p>
              {resultChips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {resultChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-lg border px-2 py-1 text-[11px] font-semibold"
                      style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Symptoms: </span>
                {journey.symptoms || 'No symptoms recorded'}
              </p>
              {journey.triage_result?.short_reasoning && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {journey.triage_result.short_reasoning}
                </p>
              )}
              {!journey.triage_result && (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  This older entry has symptoms but no saved Gemini triage result.
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      </button>
    )
  }

  const doc = item.data
  return (
    <button onClick={onSelect} className="block w-full text-left">
      <GlassCard
        className="p-4 transition-all"
        style={{
          borderColor: selected ? 'hsla(265,70%,72%,0.42)' : undefined,
          background: selected ? 'linear-gradient(135deg, hsla(265,70%,72%,0.08), var(--bg-glass))' : undefined,
        }}
      >
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[hsla(265,70%,72%,0.35)] bg-[hsla(265,70%,72%,0.12)] text-[var(--accent-violet)]">
            <FileText size={16} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="violet">{doc.category.replace(/_/g, ' ')}</Badge>
              <Badge variant={doc.analysisStatus === 'complete' ? 'success' : doc.analysisStatus === 'failed' ? 'danger' : 'teal'}>
                {doc.analysisStatus === 'complete' ? 'Analyzed' : doc.analysisStatus === 'failed' ? 'Failed' : 'Pending'}
              </Badge>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {item.date ? formatRelativeTime(item.date) : 'No date'}
              </span>
            </div>
            <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.filename}</p>
            {doc.analysis?.summary && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {doc.analysis.summary}
              </p>
            )}
          </div>
        </div>
      </GlassCard>
    </button>
  )
}

function EmptyDetail() {
  return (
    <GlassCard className="p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
        <Activity size={24} strokeWidth={1.5} />
      </div>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Select an item</p>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        Pick an assessment or document to review the details here.
      </p>
    </GlassCard>
  )
}

function AssessmentDetail({ journey }: { journey: CareJourney }) {
  const navigate = useNavigate()
  const cat = journey.triage_result?.care_category
  const cfg = cat ? CARE_CATEGORY_CONFIG[cat] : null
  const color = cfg?.color ?? 'var(--accent-teal)'
  const savedResultRows = [
    { label: 'Care category', value: cat ? `${cfg?.label ?? titleCase(cat)} (${cat})` : null },
    { label: 'Urgency', value: journey.triage_result?.urgency ? titleCase(journey.triage_result.urgency) : null },
    { label: 'Specialty', value: journey.triage_result?.recommended_specialty },
    { label: 'Scan type', value: journey.triage_result?.scan_type },
    { label: 'Provider type', value: cfg?.providerType ? titleCase(cfg.providerType) : null },
  ].filter((row) => row.value)

  return (
    <GlassCard variant="elevated" className="p-5">
      <div className="mb-5 flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
          style={{
            background: `color-mix(in oklch, ${color} 14%, transparent)`,
            borderColor: `color-mix(in oklch, ${color} 35%, transparent)`,
            color,
          }}
        >
          {cat ? CARE_ICONS[cat] : <Stethoscope size={18} strokeWidth={1.75} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Assessment</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {cfg?.headline ?? 'Care recommendation'}
          </h2>
          {cfg?.subhead && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{cfg.subhead}</p>
          )}
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(journey.createdAt)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {journey.triage_result ? (
          <section className="rounded-2xl border p-4" style={{ borderColor: `color-mix(in oklch, ${color} 36%, transparent)`, background: `color-mix(in oklch, ${color} 9%, var(--surface-tint))` }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Saved Gemini result</p>
              <Badge variant={assessmentVariant(cat)}>{cfg?.urgencyLabel ?? titleCase(journey.triage_result.urgency)}</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {savedResultRows.map((row) => (
                <div key={row.label} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-glass)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{row.label}</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{row.value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tint)' }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Symptoms saved only</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              This assessment was saved before the Gemini triage result was stored. New assessments will show the recommendation here.
            </p>
          </section>
        )}

        <section>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Symptoms reported</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{journey.symptoms || 'No symptoms recorded.'}</p>
        </section>

        {journey.triage_result?.short_reasoning && (
          <section className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tint)' }}>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Why this recommendation</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{journey.triage_result.short_reasoning}</p>
          </section>
        )}

        {journey.triage_result?.red_flags && journey.triage_result.red_flags.length > 0 && (
          <section className="rounded-xl border p-3" style={{ background: 'hsla(8,90%,68%,0.08)', borderColor: 'hsla(8,90%,68%,0.25)' }}>
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle size={13} strokeWidth={1.75} style={{ color: 'var(--accent-coral)' }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-coral)' }}>Go to ER if these appear</p>
            </div>
            <ul className="space-y-1">
              {journey.triage_result.red_flags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--accent-coral)' }} />
                  {flag}
                </li>
              ))}
            </ul>
          </section>
        )}

        {journey.triage_result?.what_to_expect && (
          <section>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>What to expect</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{journey.triage_result.what_to_expect}</p>
          </section>
        )}

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Button className="flex-1" onClick={() => navigate('/patient/providers')}>
            Find care
            <ArrowRight size={14} strokeWidth={1.75} />
          </Button>
          <Button className="flex-1" variant="secondary" onClick={() => navigate('/patient/assess')}>
            New assessment
          </Button>
        </div>
      </div>
    </GlassCard>
  )
}

function DocumentDetail({ document }: { document: PatientDocument }) {
  const navigate = useNavigate()

  return (
    <GlassCard variant="elevated" className="p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[hsla(265,70%,72%,0.35)] bg-[hsla(265,70%,72%,0.12)] text-[var(--accent-violet)]">
          <FileText size={18} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Document</p>
          <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {document.analysis?.document_type || document.filename}
          </h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(document.uploadedAt)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <section>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>File</p>
          <p className="break-words text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{document.filename}</p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Badge variant={document.analysisStatus === 'complete' ? 'success' : document.analysisStatus === 'failed' ? 'danger' : 'teal'}>
            {document.analysisStatus === 'complete' ? (
              <>
                <CheckCircle size={10} className="mr-1" />
                Analyzed
              </>
            ) : document.analysisStatus === 'failed' ? 'Analysis failed' : 'Analyzing'}
          </Badge>
          <Badge variant="default">{document.category.replace(/_/g, ' ')}</Badge>
        </div>

        {document.analysis?.summary ? (
          <section className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tint)' }}>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Report summary</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{document.analysis.summary}</p>
          </section>
        ) : (
          <section className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tint)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {document.analysisStatus === 'pending' ? 'Analysis is still running.' : 'No summary is available for this document.'}
            </p>
          </section>
        )}

        {document.analysis?.red_flags && document.analysis.red_flags.length > 0 && (
          <section className="rounded-xl border p-3" style={{ background: 'hsla(8,90%,68%,0.08)', borderColor: 'hsla(8,90%,68%,0.25)' }}>
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle size={13} strokeWidth={1.75} style={{ color: 'var(--accent-coral)' }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-coral)' }}>Needs attention</p>
            </div>
            <ul className="space-y-1">
              {document.analysis.red_flags.map((flag, i) => (
                <li key={i} className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{flag}</li>
              ))}
            </ul>
          </section>
        )}

        <Button className="w-full" onClick={() => navigate(`/patient/documents/${document.docId}`)}>
          View full analysis
          <ArrowRight size={14} strokeWidth={1.75} />
        </Button>
      </div>
    </GlassCard>
  )
}

export default function JourneyHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: journeys, loading: journeysLoading } = useFirestoreCollection<CareJourney>(
    'care_journeys',
    user ? [where('patientId', '==', user.uid), orderBy('createdAt', 'desc')] : []
  )

  const { data: documents, loading: docsLoading } = useFirestoreCollection<PatientDocument>(
    'patient_documents',
    user ? [where('patientId', '==', user.uid), orderBy('uploadedAt', 'desc')] : []
  )

  const loading = journeysLoading || docsLoading

  const allItems = useMemo<TimelineItem[]>(() => {
    const assessments = journeys.map((j) => ({
      type: 'assessment' as const,
      id: j.id ?? `assessment-${j.createdAt?.toMillis?.() ?? Math.random()}`,
      date: j.createdAt,
      data: j,
    }))
    const docs = documents.map((d) => ({
      type: 'document' as const,
      id: d.id ?? d.docId,
      date: d.uploadedAt,
      data: d,
    }))
    return [...assessments, ...docs].sort((a, b) => (b.date?.toMillis?.() ?? 0) - (a.date?.toMillis?.() ?? 0))
  }, [journeys, documents])

  const filteredItems = useMemo(() => {
    if (activeTab === 'assessments') return allItems.filter((item) => item.type === 'assessment')
    if (activeTab === 'documents') return allItems.filter((item) => item.type === 'document')
    return allItems
  }, [activeTab, allItems])

  const groupedItems = useMemo(() => groupByMonth(filteredItems), [filteredItems])

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filteredItems.some((item) => getItemId(item) === selectedId)) {
      setSelectedId(getItemId(filteredItems[0]))
    }
  }, [filteredItems, selectedId])

  const selectedItem = filteredItems.find((item) => getItemId(item) === selectedId) ?? null

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allItems.length },
    { id: 'assessments', label: 'Assessments', count: journeys.length },
    { id: 'documents', label: 'Documents', count: documents.length },
  ]

  const stats = [
    { label: 'Assessments', value: journeys.length, color: 'var(--accent-teal)' },
    { label: 'Results saved', value: journeys.filter((j) => Boolean(j.triage_result)).length, color: 'var(--accent-teal-2)' },
    { label: 'Documents', value: documents.length, color: 'var(--accent-violet)' },
    {
      label: 'Needs attention',
      value:
        journeys.filter((j) => (j.triage_result?.red_flags?.length ?? 0) > 0).length +
        documents.filter((d) => (d.analysis?.red_flags?.length ?? 0) > 0).length,
      color: 'var(--accent-coral)',
    },
  ]

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="mx-auto max-w-7xl space-y-6 overflow-hidden">
      <motion.div variants={fadeRise} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--accent-teal)' }}>Care timeline</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>My History</h1>
          <p className="mt-1 text-base" style={{ color: 'var(--text-secondary)' }}>
            Assessments and uploaded reports in one clean timeline.
          </p>
        </div>
        <Button onClick={() => navigate('/patient/assess')}>
          <Stethoscope size={16} strokeWidth={1.75} />
          New assessment
        </Button>
      </motion.div>

      <motion.div variants={fadeRise} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            <p className="mt-2 font-mono text-3xl font-black leading-none" style={{ color: stat.color }}>{stat.value}</p>
          </GlassCard>
        ))}
      </motion.div>

      <motion.div variants={fadeRise}>
        <div className="flex w-full gap-1 overflow-x-auto rounded-xl p-1 sm:w-fit" style={{ background: 'var(--surface-tint)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                border: activeTab === tab.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
              }}
            >
              {tab.label}
              <span className="rounded-md px-1.5 py-0.5 font-mono text-xs" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div variants={fadeRise} className="min-w-0 space-y-6">
          {loading && <SkeletonList count={4} />}

          {!loading && filteredItems.length === 0 && (
            <GlassCard className="p-6 sm:p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
                <Activity size={30} strokeWidth={1.5} />
              </div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {activeTab === 'documents' ? 'No documents yet' : activeTab === 'assessments' ? 'No assessments yet' : 'No history yet'}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {activeTab === 'documents' ? 'Upload your first lab result or scan report.' : 'Start an assessment to build your care timeline.'}
              </p>
              <Button className="mt-5" size="sm" onClick={() => navigate(activeTab === 'documents' ? '/patient/documents' : '/patient/assess')}>
                {activeTab === 'documents' ? 'Upload document' : 'Start assessment'}
              </Button>
            </GlassCard>
          )}

          {!loading && Object.entries(groupedItems).map(([month, items]) => (
            <section key={month}>
              <div className="mb-3 flex items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{month}</p>
                <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
                <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{items.length}</p>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <EventCard
                    key={getItemId(item)}
                    item={item}
                    selected={getItemId(item) === selectedId}
                    onSelect={() => setSelectedId(getItemId(item))}
                  />
                ))}
              </div>
            </section>
          ))}
        </motion.div>

        <motion.div variants={fadeRise} className="min-w-0">
          <div className="lg:sticky lg:top-24">
            {selectedItem ? (
              selectedItem.type === 'assessment' ? (
                <AssessmentDetail journey={selectedItem.data as CareJourney} />
              ) : (
                <DocumentDetail document={selectedItem.data as PatientDocument} />
              )
            ) : (
              <EmptyDetail />
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
