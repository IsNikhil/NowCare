import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { where, orderBy } from 'firebase/firestore'
import { motion } from 'framer-motion'
import {
  Stethoscope, FileText, History, Calendar, Video, HelpCircle,
  ArrowRight, Activity, Scan, Clock, Siren, Leaf, CalendarDays,
  HeartPulse, Brain, Baby, Bone, Eye, Smile, Users,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { CARE_CATEGORY_CONFIG } from '../../lib/careCategories'
import { SPECIALTIES } from '../../lib/specialties'
import { fadeRise, stagger } from '../../lib/motion'
import { formatDate } from '../../lib/format'
import type { CareJourney, PatientDocument } from '../../types'

const SPECIALTY_ICONS: Record<string, React.ReactNode> = {
  cardiology: <HeartPulse size={20} strokeWidth={1.75} />,
  neurology: <Brain size={20} strokeWidth={1.75} />,
  pediatrics: <Baby size={20} strokeWidth={1.75} />,
  orthopedics: <Bone size={20} strokeWidth={1.75} />,
  ophthalmology: <Eye size={20} strokeWidth={1.75} />,
  dentistry: <Smile size={20} strokeWidth={1.75} />,
  family_medicine: <Users size={20} strokeWidth={1.75} />,
  internal_medicine: <Stethoscope size={20} strokeWidth={1.75} />,
}

const TOP_SPECIALTIES = [
  'cardiology', 'neurology', 'family_medicine', 'pediatrics',
  'orthopedics', 'dermatology', 'ophthalmology', 'dentistry',
]

const QUICK_TILES = [
  { icon: <Stethoscope size={24} strokeWidth={1.75} />, title: 'New Assessment', desc: 'Get a care recommendation', to: '/patient/assess', color: 'var(--accent-teal)' },
  { icon: <FileText size={24} strokeWidth={1.75} />, title: 'Upload a Report', desc: 'Analyze lab results or scans', to: '/patient/documents', color: 'var(--accent-violet)' },
  { icon: <History size={24} strokeWidth={1.75} />, title: 'My History', desc: 'Assessments and visits', to: '/patient/history', color: 'var(--accent-amber)' },
  { icon: <Calendar size={24} strokeWidth={1.75} />, title: 'Book a Slot', desc: 'Open appointments near you', to: '/patient/providers', color: 'var(--accent-teal)' },
  { icon: <Video size={24} strokeWidth={1.75} />, title: 'Telehealth', desc: 'Remote provider visit', to: '/patient/providers?category=TELEHEALTH', color: 'var(--accent-violet)' },
  { icon: <HelpCircle size={24} strokeWidth={1.75} />, title: 'Help & FAQ', desc: 'Product guide and support', to: '#help-bot', color: 'var(--text-muted)' },
]

const CARE_ICONS: Record<string, React.ReactNode> = {
  ER_NOW: <Siren size={14} strokeWidth={1.75} />,
  URGENT_TODAY: <Clock size={14} strokeWidth={1.75} />,
  SCAN_NEEDED: <Scan size={14} strokeWidth={1.75} />,
  TELEHEALTH: <Video size={14} strokeWidth={1.75} />,
  SCHEDULE_DOCTOR: <CalendarDays size={14} strokeWidth={1.75} />,
  SELF_CARE: <Leaf size={14} strokeWidth={1.75} />,
}

export default function PatientHome() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [symptomDraft, setSymptomDraft] = useState('')

  const { data: journeys, loading: journeysLoading } = useFirestoreCollection<CareJourney>(
    'care_journeys',
    user ? [where('patientId', '==', user.uid), orderBy('createdAt', 'desc')] : []
  )

  const { data: documents, loading: docsLoading } = useFirestoreCollection<PatientDocument>(
    'patient_documents',
    user ? [where('patientId', '==', user.uid), orderBy('uploadedAt', 'desc')] : []
  )

  const recentActivity = useMemo(() => {
    const items = [
      ...journeys.slice(0, 4).map((j) => ({ type: 'assessment' as const, id: j.id ?? '', date: j.createdAt, data: j })),
      ...documents.slice(0, 3).map((d) => ({ type: 'document' as const, id: d.id ?? '', date: d.uploadedAt, data: d })),
    ]
    return items.sort((a, b) => b.date?.toMillis() - a.date?.toMillis()).slice(0, 5)
  }, [journeys, documents])

  const firstName = (profile?.email?.split('@')[0] ?? 'there')
    .replace(/[._-]/g, ' ')
    .split(' ')[0]
    .replace(/^\w/, (c) => c.toUpperCase())

  function handleQuickAction(to: string) {
    if (to === '#help-bot') {
      document.dispatchEvent(new CustomEvent('open-helpbot'))
      return
    }
    navigate(to)
  }

  function handleSymptomSubmit() {
    if (!symptomDraft.trim()) return
    navigate('/patient/assess', { state: { prefill: symptomDraft } })
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="mx-auto max-w-4xl space-y-6 md:space-y-8">
      {/* Hero greeting */}
      <motion.div variants={fadeRise}>
        <GlassCard variant="elevated" className="p-5 sm:p-6 md:p-8 relative overflow-hidden">
          {/* Decorative conic ring */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 conic-ring"
            style={{ background: `conic-gradient(var(--accent-teal) 0deg, transparent 120deg, transparent 360deg)` }} />

          <div className="relative z-10">
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--accent-teal)' }}>
              Good day
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
              Hello, {firstName}
            </h1>
            <p className="text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
              What can we help you with today?
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Describe what you are feeling..."
                  value={symptomDraft}
                  onChange={(e) => setSymptomDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSymptomSubmit() }}
                  className="w-full h-12 px-4 rounded-xl text-sm outline-none border transition-all"
                  style={{
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <Button
                onClick={handleSymptomSubmit}
                disabled={!symptomDraft.trim()}
                className="sm:w-auto"
                size="lg"
              >
                Find care now
                <ArrowRight size={16} strokeWidth={1.75} />
              </Button>
            </div>

            {/* Example symptoms */}
            <div className="flex flex-wrap gap-2 mt-3">
              {['Headache for 2 days', 'Sore throat with fever', 'Lower back pain'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setSymptomDraft(ex)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', background: 'var(--surface-tint)' }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Quick action tiles */}
      <motion.div variants={fadeRise}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Quick actions</h2>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3">
          {QUICK_TILES.map((tile, i) => (
            <motion.div key={tile.title} variants={fadeRise} style={{ transitionDelay: `${i * 40}ms` }}>
              <GlassCard
                variant="interactive"
                className="p-4 cursor-pointer min-h-[124px]"
                onClick={() => handleQuickAction(tile.to)}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${tile.color}15`, color: tile.color }}>
                  {tile.icon}
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{tile.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{tile.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Specialty chips */}
      <motion.div variants={fadeRise}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Find a specialist</h2>
          <button
            onClick={() => navigate('/patient/providers')}
            className="text-xs font-semibold hover:underline"
            style={{ color: 'var(--accent-teal)' }}
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 min-[420px]:grid-cols-4 sm:grid-cols-8 gap-2">
          {TOP_SPECIALTIES.map((id) => {
            const spec = SPECIALTIES.find((s) => s.id === id)
            if (!spec) return null
            return (
              <button
                key={id}
                onClick={() => navigate(`/patient/providers?specialty=${id}`)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all hover:border-[var(--accent-teal)] hover:bg-[var(--surface-tint)] group"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-glass)' }}
              >
                <span className="transition-colors group-hover:text-[var(--accent-teal)]" style={{ color: 'var(--text-secondary)' }}>
                  {SPECIALTY_ICONS[id] ?? <Activity size={20} strokeWidth={1.75} />}
                </span>
                <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  {spec.label.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Recent assessments */}
      <motion.div variants={fadeRise}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Recent assessments</h2>
          <button onClick={() => navigate('/patient/history')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--accent-teal)' }}>
            View all
          </button>
        </div>

        {(journeysLoading || docsLoading) && <SkeletonCard lines={3} />}

        {!journeysLoading && !docsLoading && recentActivity.length === 0 && (
          <GlassCard className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface-tint)' }}>
              <Activity size={24} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No activity yet</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your assessments and uploaded documents will appear here.</p>
            <Button size="sm" className="mt-4" onClick={() => navigate('/patient/assess')}>
              Run your first assessment
            </Button>
          </GlassCard>
        )}

        {recentActivity.length > 0 && (
          <GlassCard className="divide-y" style={{ ['--tw-divide-opacity' as string]: 1 }}>
            {recentActivity.map((item) => {
              if (item.type === 'assessment') {
                const j = item.data as CareJourney
                const cat = j.triage_result?.care_category
                const cfg = cat ? CARE_CATEGORY_CONFIG[cat] : null
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 cursor-pointer hover:bg-[var(--surface-tint)] transition-colors"
                    onClick={() => navigate('/patient/history')}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cfg ? `${cfg.color}15` : 'var(--surface-tint)', color: cfg?.color ?? 'var(--text-muted)' }}>
                      {cat ? CARE_ICONS[cat] : <Stethoscope size={16} strokeWidth={1.75} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {j.symptoms ? j.symptoms.slice(0, 60) : 'Assessment'}
                      </p>
                      {cfg && (
                        <Badge variant={cat === 'ER_NOW' ? 'danger' : cat === 'URGENT_TODAY' ? 'warning' : 'teal'} className="mt-0.5">
                          {cfg.label}
                        </Badge>
                      )}
                    </div>
                    <span className="hidden min-[420px]:block text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {j.createdAt && formatDate(j.createdAt)}
                    </span>
                  </div>
                )
              } else {
                const d = item.data as PatientDocument
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 cursor-pointer hover:bg-[var(--surface-tint)] transition-colors"
                    onClick={() => navigate(`/patient/documents/${d.docId}`)}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'hsla(265,70%,65%,0.1)', color: 'var(--accent-violet)' }}>
                      <FileText size={16} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{d.filename}</p>
                      <Badge variant={d.analysisStatus === 'complete' ? 'success' : d.analysisStatus === 'failed' ? 'danger' : 'teal'} className="mt-0.5">
                        {d.analysisStatus === 'complete' ? 'Analyzed' : d.analysisStatus === 'failed' ? 'Failed' : 'Pending'}
                      </Badge>
                    </div>
                    <span className="hidden min-[420px]:block text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {d.uploadedAt && formatDate(d.uploadedAt)}
                    </span>
                  </div>
                )
              }
            })}
          </GlassCard>
        )}
      </motion.div>
    </motion.div>
  )
}
