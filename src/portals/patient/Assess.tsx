import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, ArrowRight, AlertTriangle,
  Siren, Clock, Scan, Video, CalendarDays, Leaf,
  RefreshCw, FileText, MapPin,
} from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '../../services/firebase'
import { triage } from '../../services/gemini'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { CARE_CATEGORY_CONFIG } from '../../lib/careCategories'
import { getSpecialtyLabel } from '../../lib/specialties'
import { fadeRise, stagger } from '../../lib/motion'
import type { TriageResult, Patient, CareCategory } from '../../types'

const MAX_CHARS = 1000

const CARE_ICONS: Record<CareCategory, React.ReactNode> = {
  ER_NOW: <Siren size={36} strokeWidth={1.5} />,
  URGENT_TODAY: <Clock size={36} strokeWidth={1.5} />,
  SCAN_NEEDED: <Scan size={36} strokeWidth={1.5} />,
  TELEHEALTH: <Video size={36} strokeWidth={1.5} />,
  SCHEDULE_DOCTOR: <CalendarDays size={36} strokeWidth={1.5} />,
  SELF_CARE: <Leaf size={36} strokeWidth={1.5} />,
}

const LOADING_MESSAGES = [
  'Reviewing your symptoms...',
  'Checking care guidelines...',
  'Finding the right recommendation...',
  'Almost ready...',
]

type SpeechRec = {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null; onend: (() => void) | null
  start(): void; stop(): void
}
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRec
    SpeechRecognition: new () => SpeechRec
  }
}

export default function Assess() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as { prefill?: string } | null)?.prefill ?? ''

  const [phase, setPhase] = useState<'input' | 'loading' | 'result'>('input')
  const [symptoms, setSymptoms] = useState(prefill)
  const [listening, setListening] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [result, setResult] = useState<TriageResult | null>(null)
  const recognitionRef = useRef<SpeechRec | null>(null)

  const { data: patient } = useFirestoreDoc<Patient>(user ? `patients/${user.uid}` : '')

  const SpeechAPI = typeof window !== 'undefined'
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : null

  // Rotate loading messages
  useEffect(() => {
    if (phase !== 'loading') return
    const interval = setInterval(() => {
      setLoadingMsg((m) => (m + 1) % LOADING_MESSAGES.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [phase])

  const startListening = useCallback(() => {
    if (!SpeechAPI) return
    const rec = new SpeechAPI()
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join('')
      setSymptoms((prev) => (prev.replace(/\s+$/, '') + ' ' + t).trim().slice(0, MAX_CHARS))
    }
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }, [SpeechAPI])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop(); setListening(false)
  }, [])

  async function handleSubmit() {
    if (!symptoms.trim() || !user) return
    setPhase('loading')
    try {
      const ctx = patient ? { age: patient.age, gender: patient.gender } : { age: 30, gender: 'unknown' }
      const res = await triage(symptoms, ctx)
      try {
        await addDoc(collection(db, 'care_journeys'), {
          patientId: user.uid,
          symptoms: symptoms.trim(),
          triage_result: res,
          createdAt: serverTimestamp(),
        })
      } catch {
        toast.error('Could not save assessment. Results are shown below.')
      }
      setResult(res)
      setPhase('result')
    } catch {
      toast.error('Could not process your symptoms. Please try again.')
      setPhase('input')
    }
  }

  function handleFindCare() {
    const cat = result?.care_category
    navigate(`/patient/providers?category=${cat ?? ''}&specialty=${result?.recommended_specialty ?? ''}`)
  }

  // ─── Input phase ────────────────────────────────────────────────────────────
  if (phase === 'input') {
    return (
      <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-2xl mx-auto">
        <motion.div variants={fadeRise} className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            How are you feeling?
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            Describe your symptoms in plain language. We will recommend the right level of care.
          </p>
        </motion.div>

        <motion.div variants={fadeRise}>
          <GlassCard variant="elevated" className="p-5">
            <div className="relative">
              <textarea
                autoFocus
                placeholder="Describe what you are feeling. For example: sharp pain in my lower right abdomen for two hours, slight nausea and a low fever."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value.slice(0, MAX_CHARS))}
                rows={6}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none border transition-all"
                style={{
                  background: 'var(--bg-glass)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-teal)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)' }}
              />
              <span className="absolute bottom-3 right-3 text-xs pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                {symptoms.length}/{MAX_CHARS}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              {SpeechAPI && (
                <button
                  type="button"
                  onClick={listening ? stopListening : startListening}
                  className="p-2.5 rounded-xl transition-all"
                  style={{
                    background: listening ? 'hsla(8,90%,65%,0.1)' : 'var(--surface-tint)',
                    color: listening ? 'var(--accent-coral)' : 'var(--text-muted)',
                  }}
                  aria-label={listening ? 'Stop listening' : 'Start voice input'}
                >
                  {listening ? <MicOff size={18} strokeWidth={1.75} /> : <Mic size={18} strokeWidth={1.75} />}
                </button>
              )}
              {listening && (
                <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--accent-teal)' }}>
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-teal)] animate-pulse" />
                  Listening...
                </span>
              )}
              <Button
                onClick={handleSubmit}
                disabled={symptoms.trim().length < 5}
                size="lg"
                className="ml-auto"
              >
                Get recommendation
                <ArrowRight size={16} strokeWidth={1.75} />
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeRise} className="mt-4">
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Headache for 2 days with sensitivity to light',
              'Sore throat with fever and difficulty swallowing',
              'Lower back pain after lifting something heavy',
              'Mild rash on my forearm appeared this morning',
            ].map((ex) => (
              <button key={ex} onClick={() => setSymptoms(ex)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--bg-glass)' }}>
                {ex}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeRise} className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            In a life-threatening emergency, call 911 immediately. NowCare does not replace professional medical advice.
          </p>
        </motion.div>
      </motion.div>
    )
  }

  // ─── Loading phase ────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard className="p-5 mb-4">
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Your symptoms</p>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{symptoms.slice(0, 120)}{symptoms.length > 120 ? '...' : ''}</p>
        </GlassCard>

        <GlassCard variant="elevated" className="p-10 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div
              className="conic-ring absolute inset-0 rounded-full"
              style={{ background: `conic-gradient(var(--accent-teal) 0deg, transparent 180deg)`, opacity: 0.4 }}
            />
            <div
              className="absolute inset-2 rounded-full flex items-center justify-center"
              style={{ background: 'var(--surface-tint)' }}
            >
              <Scan size={28} strokeWidth={1.5} style={{ color: 'var(--accent-teal)' }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={loadingMsg}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {LOADING_MESSAGES[loadingMsg]}
            </motion.p>
          </AnimatePresence>

          <div className="flex justify-center gap-1.5 mt-4">
            {LOADING_MESSAGES.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ background: i === loadingMsg ? 'var(--accent-teal)' : 'var(--border-subtle)' }}
              />
            ))}
          </div>
        </GlassCard>
      </div>
    )
  }

  // ─── Result phase ─────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const cfg = CARE_CATEGORY_CONFIG[result.care_category]
    const urgencyLabels: Record<string, string> = {
      immediate: 'Immediate',
      soon: 'See a provider soon',
      routine: 'Routine',
    }

    return (
      <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-2xl mx-auto space-y-4">
        {/* Red flags banner - shown prominently if present */}
        {result.red_flags.length > 0 && (
          <motion.div variants={fadeRise}>
            <div
              className="rounded-2xl p-4 border"
              style={{ background: 'hsla(8,90%,65%,0.08)', borderColor: 'hsla(8,90%,65%,0.25)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} strokeWidth={1.75} style={{ color: 'var(--accent-coral)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--accent-coral)' }}>Warning signs to watch for</span>
              </div>
              <ul className="space-y-1">
                {result.red_flags.map((flag, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent-coral)' }} />
                    {flag}
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--accent-coral)' }}>
                If any of these occur, go to the ER or call 911 immediately.
              </p>
            </div>
          </motion.div>
        )}

        {/* Main result card */}
        <motion.div variants={fadeRise}>
          <GlassCard variant="elevated" className="p-6">
            <div
              className="flex items-center gap-4 p-5 rounded-2xl mb-5 border"
              style={{ background: cfg.bgClass.replace('bg-', '').replace('/10', ''), borderColor: cfg.borderClass.replace('border-', ''), backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}30` }}
            >
              <span style={{ color: cfg.color }}>{CARE_ICONS[result.care_category]}</span>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: cfg.color }}>
                  {cfg.headline}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={result.care_category === 'ER_NOW' ? 'danger' : result.care_category === 'URGENT_TODAY' ? 'warning' : 'teal'}
                  >
                    {urgencyLabels[result.urgency]}
                  </Badge>
                  {result.recommended_specialty && (
                    <Badge variant="default">
                      {getSpecialtyLabel(result.recommended_specialty)}
                    </Badge>
                  )}
                  {result.scan_type && (
                    <Badge variant="violet">{result.scan_type}</Badge>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
              {result.short_reasoning}
            </p>

            {result.what_to_expect && (
              <div
                className="rounded-xl p-3 mb-4 text-sm"
                style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}
              >
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>What to expect: </span>
                {result.what_to_expect}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button onClick={handleFindCare} size="lg" className="flex-1">
                <MapPin size={16} strokeWidth={1.75} />
                Find providers near me
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/patient/summary', { state: { symptoms, result } })}
              >
                <FileText size={16} strokeWidth={1.75} />
                Pre-visit summary
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Symptoms recap */}
        <motion.div variants={fadeRise}>
          <GlassCard className="p-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Your symptoms</p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{symptoms}</p>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeRise} className="flex justify-center">
          <button
            onClick={() => { setPhase('input'); setResult(null); setSymptoms('') }}
            className="inline-flex items-center gap-1.5 text-sm hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw size={14} strokeWidth={1.75} />
            Start a new assessment
          </button>
        </motion.div>

        <motion.div variants={fadeRise} className="text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            This is a navigation recommendation, not a medical diagnosis. In a life-threatening emergency, call 911.
          </p>
        </motion.div>
      </motion.div>
    )
  }

  return null
}
