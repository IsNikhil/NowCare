import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Siren, Clock, Video, Leaf, AlertTriangle, ArrowRight, Scan, CalendarDays } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { triage } from '../../services/gemini'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'
import type { Patient, TriageResult, CareCategory } from '../../types'

const MAX_CHARS = 1000

type SpeechRec = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRec
    SpeechRecognition: new () => SpeechRec
  }
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
    icon: <Siren size={36} strokeWidth={1.75} />,
    headline: 'Go to the ER now',
    colorClass: 'text-rose-500',
    badgeVariant: 'danger',
    bgClass: 'bg-rose-50',
  },
  URGENT_TODAY: {
    icon: <Clock size={36} strokeWidth={1.75} />,
    headline: 'See a doctor today',
    colorClass: 'text-amber-500',
    badgeVariant: 'warning',
    bgClass: 'bg-amber-50',
  },
  SCAN_NEEDED: {
    icon: <Scan size={36} strokeWidth={1.75} />,
    headline: 'Get a scan',
    colorClass: 'text-violet-500',
    badgeVariant: 'teal',
    bgClass: 'bg-violet-50',
  },
  TELEHEALTH: {
    icon: <Video size={36} strokeWidth={1.75} />,
    headline: 'Telehealth visit',
    colorClass: 'text-teal-500',
    badgeVariant: 'teal',
    bgClass: 'bg-teal-50',
  },
  SCHEDULE_DOCTOR: {
    icon: <CalendarDays size={36} strokeWidth={1.75} />,
    headline: 'Schedule with a doctor',
    colorClass: 'text-teal-500',
    badgeVariant: 'teal',
    bgClass: 'bg-teal-50',
  },
  SELF_CARE: {
    icon: <Leaf size={36} strokeWidth={1.75} />,
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

export default function SymptomInput() {
  const { user } = useAuth()
  const navigate = useNavigate()
  

  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null)
  const [journeyId, setJourneyId] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRec | null>(null)

  const { data: patient } = useFirestoreDoc<Patient>(
    user ? `patients/${user.uid}` : ''
  )

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition
      : null

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) return
    const rec = new SpeechRecognitionAPI()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('')
      setSymptoms((prev) => {
        const base = prev.replace(/\s+$/, '')
        return (base + ' ' + transcript).trim().slice(0, MAX_CHARS)
      })
    }
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }, [SpeechRecognitionAPI])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  async function handleSubmit() {
    if (!symptoms.trim() || !user) return
    setLoading(true)
    try {
      const patientCtx = patient
        ? { age: patient.age, gender: patient.gender }
        : { age: 30, gender: 'unknown' }

      const result: TriageResult = await triage(symptoms, patientCtx)

      try {
        const docRef = await addDoc(collection(db, 'care_journeys'), {
          patientId: user.uid,
          symptoms: symptoms.trim(),
          triage_result: result,
          createdAt: serverTimestamp(),
        })
        setJourneyId(docRef.id)
      } catch {
        toast.error('Could not save your assessment. Results are still shown below.')
      }

      setTriageResult(result)
    } catch {
      toast.error('Could not process your symptoms. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleFindCare() {
    navigate(`/patient/providers?category=${triageResult!.care_category}&specialty=${triageResult!.recommended_specialty ?? ''}`, {
      state: { journeyId, triageResult },
    })
  }

  if (triageResult) {
    const config = careConfig[triageResult.care_category]
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-ink-800 tracking-tight mb-6">What are your symptoms?</h1>

        <Card level={2} padding="sm" className="mb-4">
          <div className={`flex items-center gap-4 p-4 rounded-2xl mb-5 ${config.bgClass}`}>
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

          <p className="text-slate-600 leading-relaxed mb-5">{triageResult.short_reasoning}</p>

          {triageResult.red_flags.length > 0 && (
            <div className="glass-1 rounded-2xl p-4 mb-5">
              <h3 className="text-sm font-semibold text-rose-500 flex items-center gap-2 mb-3">
                <AlertTriangle size={15} strokeWidth={1.75} />
                Warning signs to watch for
              </h3>
              <ul className="space-y-1.5">
                {triageResult.red_flags.map((flag, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={handleFindCare} size="lg" fullWidth>
            Find care near me
            <ArrowRight size={18} strokeWidth={1.75} />
          </Button>
        </Card>

        <p className="text-xs text-slate-400 text-center">
          In a life-threatening emergency, call 911 immediately.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-800 tracking-tight mb-1">What are your symptoms?</h1>
      <p className="text-slate-500 mb-6">Describe how you feel and find what type of care to seek right now.</p>

      <Card level={2} padding="sm">
        <div className="relative">
          <Textarea
            placeholder="Describe what you are feeling. For example: sharp pain in my lower right abdomen for two hours, slight nausea."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value.slice(0, MAX_CHARS))}
            rows={4}
            className="pb-6 min-h-28"
          />
          <span className="absolute bottom-3 right-3 text-xs text-slate-400 pointer-events-none">
            {symptoms.length}/{MAX_CHARS}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {SpeechRecognitionAPI && (
            <>
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                className={[
                  'p-2 rounded-xl transition-all duration-200',
                  listening
                    ? 'bg-rose-100 text-rose-500 animate-pulse'
                    : 'text-slate-400 hover:text-teal-500 hover:glass-1',
                ].join(' ')}
                aria-label={listening ? 'Stop listening' : 'Start voice input'}
              >
                {listening ? (
                  <MicOff size={18} strokeWidth={1.75} />
                ) : (
                  <Mic size={18} strokeWidth={1.75} />
                )}
              </button>
              {listening && (
                <span className="text-xs text-teal-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse inline-block" />
                  Listening...
                </span>
              )}
            </>
          )}
          <div className="ml-auto">
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={loading || symptoms.trim().length < 5}
              size="lg"
            >
              {loading ? 'Checking your symptoms...' : 'Find my care'}
            </Button>
          </div>
        </div>
      </Card>

      <p className="mt-3 text-xs text-slate-400 text-center">
        In a life-threatening emergency, call 911 immediately.
      </p>
    </div>
  )
}
