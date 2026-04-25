import { useEffect, useRef, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { summary as generateSummary } from '../../services/gemini'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useToastContext } from '../../context/ToastContext'
import { Printer, Share2 } from 'lucide-react'
import type { Patient, CareJourney } from '../../types'

type LocationState = {
  journeyId?: string
}

export default function PreVisitSummary() {
  const { user } = useAuth()
  const location = useLocation()
  const { addToast } = useToastContext()
  const state = location.state as LocationState | null
  const journeyId = state?.journeyId

  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const generationStarted = useRef(false)

  const { data: patient } = useFirestoreDoc<Patient>(
    user ? `patients/${user.uid}` : ''
  )

  const { data: journey } = useFirestoreDoc<CareJourney>(
    journeyId ? `care_journeys/${journeyId}` : ''
  )

  const summaryText = journey?.pre_visit_summary ?? generatedSummary

  useEffect(() => {
    if (!journey || !patient) return
    if (journey.pre_visit_summary || generationStarted.current) return
    if (!journey.symptoms || !journey.triage_result) return

    generationStarted.current = true
    let cancelled = false

    Promise.resolve()
      .then(() => {
        if (!cancelled) setGeneratingSummary(true)
        return generateSummary(journey.symptoms!, journey.triage_result!, {
          age: patient.age,
          gender: patient.gender,
        })
      })
      .then(async (text) => {
        if (cancelled) return
        setGeneratedSummary(text)
        if (journeyId) {
          try {
            await updateDoc(doc(db, 'care_journeys', journeyId), {
              pre_visit_summary: text,
            })
          } catch {
            // ignore
          }
        }
      })
      .catch(() => { if (!cancelled) setGeneratedSummary('Summary could not be generated.') })
      .finally(() => { if (!cancelled) setGeneratingSummary(false) })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey?.id, patient?.uid])

  async function handleShare() {
    const text = summaryText ?? ''
    if (navigator.share) {
      try {
        await navigator.share({ title: 'NowCare Visit Summary', text })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text)
      addToast('success', 'Summary copied to clipboard')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-800 tracking-tight">Your visit summary</h1>
          <p className="text-slate-500 mt-1 text-sm">Show this to your provider when you arrive.</p>
        </div>
        {summaryText && (
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer size={15} strokeWidth={1.75} />
              Print
            </Button>
            <Button variant="secondary" size="sm" onClick={handleShare}>
              <Share2 size={15} strokeWidth={1.75} />
              Share
            </Button>
          </div>
        )}
      </div>

      {generatingSummary && (
        <Card level={2} padding="lg" className="flex flex-col items-center gap-4 py-12">
          <LoadingSpinner size="lg" className="text-teal-500" />
          <p className="text-sm text-slate-500 text-center">
            Generating your visit summary...
          </p>
        </Card>
      )}

      {!generatingSummary && summaryText && (
        <Card level={2} padding="lg" className="print:shadow-none print:border-0">
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Symptoms</h2>
              <div>
                {summaryText.split('\n').map((line: string, i: number) =>
                  line.trim() ? (
                    <p key={i} className="text-slate-700 leading-relaxed mb-2 last:mb-0">
                      {line}
                    </p>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {!generatingSummary && !summaryText && (
        <Card level={2} padding="lg" className="text-center py-12">
          <p className="text-slate-500 mb-4">No summary available.</p>
          <Link to="/patient/symptoms">
            <Button>Start a new assessment</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
