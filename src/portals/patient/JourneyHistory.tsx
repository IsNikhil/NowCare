import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { where, orderBy } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, FileText, AlertTriangle, Clock, Scan, Video,
  CalendarDays, Leaf, Siren, X, ArrowRight, CheckCircle,
  ChevronRight, Activity,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { SkeletonList } from '../../components/ui/Skeleton'
import { CARE_CATEGORY_CONFIG } from '../../lib/careCategories'
import { formatDate, formatDateTime, formatRelativeTime } from '../../lib/format'
import { fadeRise, stagger, slideFromRight, scaleIn } from '../../lib/motion'
import type { CareJourney, PatientDocument } from '../../types'

type FilterTab = 'all' | 'assessments' | 'documents'

type TimelineItem =
  | { type: 'assessment'; id: string; date: any; data: CareJourney }
  | { type: 'document'; id: string; date: any; data: PatientDocument }

const CARE_ICONS: Record<string, React.ReactNode> = {
  ER_NOW: <Siren size={14} strokeWidth={1.75} />,
  URGENT_TODAY: <Clock size={14} strokeWidth={1.75} />,
  SCAN_NEEDED: <Scan size={14} strokeWidth={1.75} />,
  TELEHEALTH: <Video size={14} strokeWidth={1.75} />,
  SCHEDULE_DOCTOR: <CalendarDays size={14} strokeWidth={1.75} />,
  SELF_CARE: <Leaf size={14} strokeWidth={1.75} />,
}

function formatMonthYear(ts: any): string {
  return ts.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function groupByMonth(items: TimelineItem[]) {
  const groups: Record<string, TimelineItem[]> = {}
  for (const item of items) {
    if (!item.date) continue
    const key = formatMonthYear(item.date)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

function AssessmentNode({ journey }: { journey: CareJourney }) {
  const cat = journey.triage_result?.care_category
  const cfg = cat ? CARE_CATEGORY_CONFIG[cat] : null
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{
        background: cfg ? `${cfg.color}18` : 'var(--surface-tint)',
        color: cfg?.color ?? 'var(--text-muted)',
      }}
    >
      {cat ? CARE_ICONS[cat] : <Stethoscope size={14} strokeWidth={1.75} />}
    </div>
  )
}

function DocumentNode({ doc }: { doc: PatientDocument }) {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: 'hsla(265,70%,65%,0.1)', color: 'var(--accent-violet)' }}
    >
      <FileText size={14} strokeWidth={1.75} />
    </div>
  )
}

function AssessmentDetail({ journey, onClose }: { journey: CareJourney; onClose: () => void }) {
  const navigate = useNavigate()
  const cat = journey.triage_result?.care_category
  const cfg = cat ? CARE_CATEGORY_CONFIG[cat] : null

  return (
    <div className="space-y-4">
      {cfg && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}30` }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cfg.color}20`, color: cfg.color }}>
            {cat && CARE_ICONS[cat]}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{cfg.urgencyLabel}</p>
          </div>
        </div>
      )}

      {journey.symptoms && (
        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>SYMPTOMS REPORTED</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{journey.symptoms}</p>
        </div>
      )}

      {journey.triage_result?.short_reasoning && (
        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>AI ASSESSMENT</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{journey.triage_result.short_reasoning}</p>
        </div>
      )}

      {journey.triage_result?.red_flags && journey.triage_result.red_flags.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: 'hsla(8,90%,65%,0.08)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={12} strokeWidth={1.75} style={{ color: 'var(--accent-coral)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--accent-coral)' }}>Red Flags</p>
          </div>
          <ul className="space-y-1">
            {journey.triage_result.red_flags.map((flag, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="mt-1 shrink-0 w-1 h-1 rounded-full" style={{ background: 'var(--accent-coral)' }} />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {journey.triage_result?.what_to_expect && (
        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>WHAT TO EXPECT</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{journey.triage_result.what_to_expect}</p>
        </div>
      )}

      {journey.triage_result?.recommended_specialty && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Specialty:</span>
          <Badge variant="teal">{journey.triage_result.recommended_specialty}</Badge>
        </div>
      )}

      <Button size="sm" className="w-full" onClick={() => { onClose(); navigate('/patient/assess') }}>
        New assessment
        <ArrowRight size={14} strokeWidth={1.75} />
      </Button>
    </div>
  )
}

function DocumentDetail({ document: doc, onClose }: { document: PatientDocument; onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: 'hsla(265,70%,65%,0.08)', border: '1px solid hsla(265,70%,65%,0.2)' }}>
        <p className="text-sm font-bold" style={{ color: 'var(--accent-violet)' }}>{doc.filename}</p>
        {doc.analysis?.document_type && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{doc.analysis.document_type}</p>
        )}
      </div>

      {doc.analysis?.summary && (
        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>SUMMARY</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{doc.analysis.summary}</p>
        </div>
      )}

      {doc.analysis?.red_flags && doc.analysis.red_flags.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: 'hsla(8,90%,65%,0.08)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={12} strokeWidth={1.75} style={{ color: 'var(--accent-coral)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--accent-coral)' }}>
              {doc.analysis.red_flags.length} item{doc.analysis.red_flags.length > 1 ? 's' : ''} need attention
            </p>
          </div>
          <ul className="space-y-1">
            {doc.analysis.red_flags.map((flag, i) => (
              <li key={i} className="text-xs" style={{ color: 'var(--text-secondary)' }}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Badge variant={doc.analysisStatus === 'complete' ? 'success' : doc.analysisStatus === 'failed' ? 'danger' : 'teal'}>
          {doc.analysisStatus === 'complete' ? (
            <><CheckCircle size={10} className="mr-1" />Analyzed</>
          ) : doc.analysisStatus === 'failed' ? 'Analysis failed' : 'Analyzing...'}
        </Badge>
      </div>

      <Button size="sm" className="w-full" onClick={() => { onClose(); navigate(`/patient/documents/${doc.docId}`) }}>
        View full analysis
        <ArrowRight size={14} strokeWidth={1.75} />
      </Button>
    </div>
  )
}

export default function JourneyHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: journeys, loading: journeysLoading } = useFirestoreCollection<CareJourney>(
    'care_journeys',
    user ? [where('patientId', '==', user.uid), orderBy('createdAt', 'desc')] : []
  )

  const { data: documents, loading: docsLoading } = useFirestoreCollection<PatientDocument>(
    'patient_documents',
    user ? [where('patientId', '==', user.uid), orderBy('uploadedAt', 'desc')] : []
  )

  const loading = journeysLoading || docsLoading

  const allItems: TimelineItem[] = useMemo(() => {
    const assessments = journeys.map((j) => ({
      type: 'assessment' as const,
      id: j.id ?? '',
      date: j.createdAt,
      data: j,
    }))
    const docs = documents.map((d) => ({
      type: 'document' as const,
      id: d.id ?? '',
      date: d.uploadedAt,
      data: d,
    }))
    return [...assessments, ...docs].sort((a, b) => {
      if (!a.date || !b.date) return 0
      return b.date.toMillis() - a.date.toMillis()
    })
  }, [journeys, documents])

  const filteredItems = useMemo(() => {
    if (activeTab === 'assessments') return allItems.filter((i) => i.type === 'assessment')
    if (activeTab === 'documents') return allItems.filter((i) => i.type === 'document')
    return allItems
  }, [allItems, activeTab])

  const groupedItems = useMemo(() => groupByMonth(filteredItems), [filteredItems])

  function handleSelect(item: TimelineItem) {
    setSelectedItem(item)
    setSheetOpen(true)
  }

  function handleClose() {
    setSheetOpen(false)
    setTimeout(() => setSelectedItem(null), 300)
  }

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allItems.length },
    { id: 'assessments', label: 'Assessments', count: journeys.length },
    { id: 'documents', label: 'Documents', count: documents.length },
  ]

  return (
    <div className="max-w-5xl mx-auto flex gap-6">
      {/* Main timeline */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="flex-1 min-w-0 space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeRise}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              My History
            </h1>
            <Button size="sm" onClick={() => navigate('/patient/assess')}>
              <Stethoscope size={14} strokeWidth={1.75} />
              New assessment
            </Button>
          </div>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            All your assessments and uploaded documents in one place.
          </p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div variants={fadeRise}>
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-elevated)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5"
                style={{
                  background: activeTab === tab.id ? 'var(--bg-glass)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: activeTab === tab.id ? 'var(--shadow-card)' : 'none',
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md font-mono"
                    style={{
                      background: activeTab === tab.id ? 'var(--accent-teal-glow)' : 'var(--surface-tint)',
                      color: activeTab === tab.id ? 'var(--accent-teal)' : 'var(--text-muted)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loading */}
        {loading && <SkeletonList count={4} />}

        {/* Empty state */}
        {!loading && filteredItems.length === 0 && (
          <motion.div variants={fadeRise}>
            <GlassCard className="p-10 text-center">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
                <Activity size={32} strokeWidth={1.25} />
              </div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {activeTab === 'all' ? 'No history yet' : `No ${activeTab} yet`}
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {activeTab === 'documents'
                  ? 'Upload your first lab result or scan report.'
                  : 'Start an assessment to get personalized care recommendations.'}
              </p>
              <Button size="sm" onClick={() => navigate(activeTab === 'documents' ? '/patient/documents' : '/patient/assess')}>
                {activeTab === 'documents' ? 'Upload document' : 'Start assessment'}
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {/* Timeline grouped by month */}
        {!loading && Object.keys(groupedItems).length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([month, items]) => (
              <motion.div key={month} variants={fadeRise}>
                {/* Month header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                    {month}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {items.length} event{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Timeline items */}
                <div className="relative">
                  {/* Vertical spine */}
                  <div
                    className="absolute left-[17px] top-5 bottom-5 w-px"
                    style={{ background: 'var(--border-subtle)' }}
                  />

                  <div className="space-y-3">
                    {items.map((item, idx) => {
                      const isSelected = selectedItem?.id === item.id

                      if (item.type === 'assessment') {
                        const journey = item.data as CareJourney
                        const cat = journey.triage_result?.care_category
                        const cfg = cat ? CARE_CATEGORY_CONFIG[cat] : null

                        return (
                          <motion.div
                            key={item.id}
                            variants={fadeRise}
                            style={{ transitionDelay: `${idx * 30}ms` }}
                            className="flex gap-4 items-start cursor-pointer"
                            onClick={() => handleSelect(item)}
                          >
                            {/* Node */}
                            <div className="shrink-0 relative z-10">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                style={{
                                  background: cfg ? `${cfg.color}18` : 'var(--surface-tint)',
                                  color: cfg?.color ?? 'var(--text-muted)',
                                  boxShadow: isSelected && cfg ? `0 0 0 2px ${cfg.color}40` : 'none',
                                }}
                              >
                                {cat ? CARE_ICONS[cat] : <Stethoscope size={14} strokeWidth={1.75} />}
                              </div>
                            </div>

                            {/* Card */}
                            <GlassCard
                              variant="interactive"
                              className="flex-1 p-3.5"
                              style={{
                                borderColor: isSelected && cfg ? `${cfg.color}40` : undefined,
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {journey.symptoms ? journey.symptoms.slice(0, 72) : 'Assessment'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {cfg && (
                                      <Badge variant={
                                        cat === 'ER_NOW' ? 'danger' :
                                        cat === 'URGENT_TODAY' ? 'warning' :
                                        cat === 'SELF_CARE' ? 'success' : 'teal'
                                      }>
                                        {cfg.label}
                                      </Badge>
                                    )}
                                    {journey.triage_result?.red_flags && journey.triage_result.red_flags.length > 0 && (
                                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--accent-coral)' }}>
                                        <AlertTriangle size={10} strokeWidth={1.75} />
                                        {journey.triage_result.red_flags.length} flag{journey.triage_result.red_flags.length > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {item.date && formatRelativeTime(item.date)}
                                  </span>
                                  <ChevronRight size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
                                </div>
                              </div>
                            </GlassCard>
                          </motion.div>
                        )
                      }

                      // Document item
                      const doc = item.data as PatientDocument
                      return (
                        <motion.div
                          key={item.id}
                          variants={fadeRise}
                          style={{ transitionDelay: `${idx * 30}ms` }}
                          className="flex gap-4 items-start cursor-pointer"
                          onClick={() => handleSelect(item)}
                        >
                          {/* Node */}
                          <div className="shrink-0 relative z-10">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                              style={{
                                background: 'hsla(265,70%,65%,0.1)',
                                color: 'var(--accent-violet)',
                                boxShadow: isSelected ? '0 0 0 2px hsla(265,70%,65%,0.3)' : 'none',
                              }}
                            >
                              <FileText size={14} strokeWidth={1.75} />
                            </div>
                          </div>

                          {/* Card */}
                          <GlassCard variant="interactive" className="flex-1 p-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                  {doc.filename}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="default">{doc.category.replace(/_/g, ' ')}</Badge>
                                  <Badge variant={
                                    doc.analysisStatus === 'complete' ? 'success' :
                                    doc.analysisStatus === 'failed' ? 'danger' : 'teal'
                                  }>
                                    {doc.analysisStatus === 'complete' ? 'Analyzed' :
                                     doc.analysisStatus === 'failed' ? 'Failed' : 'Pending'}
                                  </Badge>
                                  {doc.analysis?.red_flags && doc.analysis.red_flags.length > 0 && (
                                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--accent-coral)' }}>
                                      <AlertTriangle size={10} strokeWidth={1.75} />
                                      {doc.analysis.red_flags.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {item.date && formatRelativeTime(item.date)}
                                </span>
                                <ChevronRight size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
                              </div>
                            </div>
                          </GlassCard>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Desktop detail panel */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            key="detail-panel"
            variants={slideFromRight}
            initial="initial"
            animate="animate"
            exit="exit"
            className="hidden lg:block w-[400px] shrink-0"
          >
            <div className="sticky top-6">
              <GlassCard variant="elevated" className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {selectedItem.type === 'assessment' ? 'Assessment' : 'Document'}
                    </p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {selectedItem.date && formatDateTime(selectedItem.date)}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--surface-tint)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={16} strokeWidth={1.75} />
                  </button>
                </div>

                {selectedItem.type === 'assessment' ? (
                  <AssessmentDetail journey={selectedItem.data as CareJourney} onClose={handleClose} />
                ) : (
                  <DocumentDetail document={selectedItem.data as PatientDocument} onClose={handleClose} />
                )}
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet */}
      <BottomSheet
        open={sheetOpen && !!selectedItem}
        onClose={handleClose}
        title={selectedItem?.type === 'assessment' ? 'Assessment detail' : 'Document detail'}
      >
        {selectedItem && (
          <div className="pb-safe">
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {selectedItem.date && formatDateTime(selectedItem.date)}
            </p>
            {selectedItem.type === 'assessment' ? (
              <AssessmentDetail journey={selectedItem.data as CareJourney} onClose={handleClose} />
            ) : (
              <DocumentDetail document={selectedItem.data as PatientDocument} onClose={handleClose} />
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
