import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { PageHeader } from '../../components/ui/PageHeader'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useToastContext } from '../../context/ToastContext'
import { ER_STATUS_OPTIONS } from '../../lib/constants'
import type { ERStatus, Hospital } from '../../types'
import type { Timestamp } from 'firebase/firestore'

const buttonConfig: Record<ERStatus, { bg: string; text: string; selectedBg: string }> = {
  low: {
    bg: 'hover:bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    selectedBg: 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30',
  },
  moderate: {
    bg: 'hover:bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    selectedBg: 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30',
  },
  high: {
    bg: 'hover:bg-rose-50 border-rose-200',
    text: 'text-rose-600',
    selectedBg: 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30',
  },
  closed: {
    bg: 'hover:bg-slate-50 border-slate-200',
    text: 'text-slate-600',
    selectedBg: 'bg-slate-600 border-slate-600 text-white shadow-lg shadow-slate-600/20',
  },
}

const erDescription: Record<ERStatus, string> = {
  low: 'Short wait',
  moderate: 'Moderate wait',
  high: 'Long wait',
  closed: 'Not accepting',
}

function formatLastUpdated(ts: Timestamp): string {
  const d = ts.toDate()
  return d.toLocaleDateString('en-US', { weekday: 'long' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function ERStatusTogglePage() {
  const { user } = useAuth()
  const { addToast } = useToastContext()

  const { data: hospital, loading } = useFirestoreDoc<Hospital>(
    user ? `hospitals/${user.uid}` : ''
  )

  async function handleStatusChange(status: ERStatus) {
    if (!user || status === hospital?.er_status) return
    try {
      await updateDoc(doc(db, 'hospitals', user.uid), {
        er_status: status,
        er_updated: serverTimestamp(),
      })
      addToast('success', 'ER status updated.')
    } catch {
      addToast('error', 'Could not update ER status.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" className="text-teal-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="ER status"
        subtitle="Update your emergency room status. Patients see this when choosing a provider."
      />

      <div className="flex gap-2 mb-4">
        {ER_STATUS_OPTIONS.map((opt) => {
          const cfg = buttonConfig[opt.value]
          const isSelected = hospital?.er_status === opt.value

          return (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={[
                'flex-1 py-3 px-2 rounded-xl border text-center transition-all duration-200',
                'hover:scale-[1.01] active:scale-[0.99]',
                isSelected ? cfg.selectedBg : `glass-1 ${cfg.bg} ${cfg.text}`,
              ].join(' ')}
            >
              <p className={`text-sm font-semibold ${isSelected ? 'text-white' : ''}`}>
                {opt.label}
              </p>
              <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                {erDescription[opt.value]}
              </p>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-slate-400">Changes are visible to patients immediately.</p>
      {hospital?.er_updated && (
        <p className="text-xs text-slate-400 mt-1">
          Last updated: {formatLastUpdated(hospital.er_updated)}
        </p>
      )}
    </div>
  )
}
