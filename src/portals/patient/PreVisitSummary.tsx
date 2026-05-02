import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Printer, Share2, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '../../services/firebase'
import { summary as generateSummary } from '../../services/gemini'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { fadeRise, stagger } from '../../lib/motion'
import type { Patient, CareJourney } from '../../types'

export default function PreVisitSummary() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const journeyId = (location.state as { journeyId?: string } | null)?.journeyId

  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const started = useRef(false)

  const { data: patient } = useFirestoreDoc<Patient>(user ? `patients/${user.uid}` : '')
  const { data: journey } = useFirestoreDoc<CareJourney>(journeyId ? `care_journeys/${journeyId}` : '')

  const summaryText = journey?.pre_visit_summary ?? generatedSummary

  useEffect(() => {
    if (!journey || !patient || journey.pre_visit_summary || started.current) return
    if (!journey.symptoms || !journey.triage_result) return
    started.current = true
    let cancelled = false
    setGenerating(true)
    generateSummary(journey.symptoms, journey.triage_result, {
      age: (patient as any).age,
      gender: (patient as any).gender,
      height: (patient as any).height,
      weight: (patient as any).weight,
    })
      .then(async (text) => {
        if (cancelled) return
        setGeneratedSummary(text)
        if (journeyId) {
          await updateDoc(doc(db, 'care_journeys', journeyId), { pre_visit_summary: text }).catch(() => {})
        }
      })
      .catch(() => { if (!cancelled) setGeneratedSummary('Summary could not be generated.') })
      .finally(() => { if (!cancelled) setGenerating(false) })
    return () => { cancelled = true }
  }, [journey?.id, patient?.uid])

  async function handleShare() {
    const text = summaryText ?? ''
    if (navigator.share) {
      await navigator.share({ title: 'NowCare Visit Summary', text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text)
      toast.success('Summary copied to clipboard')
    }
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-2xl mx-auto space-y-6">
      <motion.div variants={fadeRise}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>Visit Summary</h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Show this to your provider when you arrive.</p>
          </div>
          {summaryText && !generating && (
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer size={14} strokeWidth={1.75} /> Print
              </Button>
              <Button variant="secondary" size="sm" onClick={handleShare}>
                <Share2 size={14} strokeWidth={1.75} /> Share
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {generating && (
        <motion.div variants={fadeRise}>
          <GlassCard className="p-12 flex flex-col items-center gap-4">
            <Loader2 size={32} strokeWidth={1.5} className="animate-spin" style={{ color: 'var(--accent-teal)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generating your visit summary...</p>
          </GlassCard>
        </motion.div>
      )}

      {!generating && summaryText && (
        <motion.div variants={fadeRise}>
          <GlassCard variant="elevated" className="p-6 print:shadow-none">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
                <FileText size={15} strokeWidth={1.75} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI-generated pre-visit brief</p>
            </div>
            <div className="space-y-2">
              {summaryText.split('\n').map((line, i) =>
                line.trim() ? (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{line}</p>
                ) : null
              )}
            </div>
            <p className="text-xs mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              This summary is AI-generated and for informational purposes only. Not a substitute for professional medical advice.
            </p>
          </GlassCard>
        </motion.div>
      )}

      {!generating && !summaryText && (
        <motion.div variants={fadeRise}>
          <GlassCard className="p-10 text-center">
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>No summary available. Complete an assessment first.</p>
            <Button size="sm" onClick={() => navigate('/patient/assess')}>Start assessment</Button>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  )
}
