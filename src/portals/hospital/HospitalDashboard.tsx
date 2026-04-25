import { Link } from 'react-router-dom'
import { where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { Card } from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useToastContext } from '../../context/ToastContext'
import { Activity, HardDrive, Phone, MapPin } from 'lucide-react'
import { formatDateTime } from '../../lib/format'
import { ER_STATUS_OPTIONS } from '../../lib/constants'
import type { Hospital, MRISlot, ERStatus } from '../../types'

const erButtonConfig: Record<ERStatus, { bg: string; text: string; selectedBg: string }> = {
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

export default function HospitalDashboard() {
  const { user } = useAuth()
  const { addToast } = useToastContext()

  const { data: hospital, loading: hospLoading } = useFirestoreDoc<Hospital>(
    user ? `hospitals/${user.uid}` : ''
  )

  const { data: slots, loading: slotsLoading } = useFirestoreCollection<MRISlot>(
    'mri_slots',
    user
      ? [where('hospitalId', '==', user.uid), orderBy('datetime', 'desc')]
      : []
  )

  const recentSlots = slots.slice(0, 5)
  const availableCount = slots.filter((s) => s.available).length

  async function handleERStatusChange(status: ERStatus) {
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

  if (hospLoading || slotsLoading) {
    return <div className="max-w-2xl mx-auto"><SkeletonCard /></div>
  }

  const cms = hospital?.cms_data
  const benchmarks = hospital?.cms_benchmarks

  return (
    <div className="max-w-2xl mx-auto">
      {cms ? (
        <Card level={2} padding="sm" className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-ink-800 tracking-tight">
                {cms.facility_name ?? hospital?.name}
              </h1>
              <p className="text-sm text-slate-500 mt-1 truncate">
                {[cms.address && `${cms.address}, ${cms.city}, ${cms.state}`, cms.phone_number]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {(cms.overall_rating || benchmarks?.avgERWaitMinutes != null) && (
                <div className="flex gap-4 mt-2">
                  {cms.overall_rating && (
                    <div>
                      <span className="text-xs text-slate-500">CMS rating: </span>
                      <span className="text-xs font-semibold text-ink-800">{cms.overall_rating}/5</span>
                    </div>
                  )}
                  {benchmarks?.avgERWaitMinutes != null && (
                    <div>
                      <span className="text-xs text-slate-500">Avg ER wait: </span>
                      <span className="text-xs font-semibold text-ink-800">{benchmarks.avgERWaitMinutes} min</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {cms.phone_number && (
                <a href={`tel:${cms.phone_number}`} className="flex items-center gap-1 text-xs text-teal-600">
                  <Phone size={11} strokeWidth={1.75} />
                  {cms.phone_number}
                </a>
              )}
              {cms.hospital_type && (
                <span className="text-xs text-slate-400">{cms.hospital_type}</span>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="mb-4 px-4 py-2.5 rounded-xl border border-slate-200/80 glass-1 text-xs text-slate-400 flex items-center gap-2">
          <MapPin size={12} strokeWidth={1.75} className="shrink-0" />
          Hospital profile data will populate after admin approval.
        </div>
      )}

      <Card level={2} padding="sm" className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink-800 flex items-center gap-2">
            <Activity size={16} strokeWidth={1.75} className="text-amber-500" />
            ER status
          </h2>
          {hospital?.er_updated && (
            <p className="text-xs text-slate-400">
              Updated: {formatDateTime(hospital.er_updated)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {ER_STATUS_OPTIONS.map((opt) => {
            const cfg = erButtonConfig[opt.value]
            const isSelected = hospital?.er_status === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleERStatusChange(opt.value)}
                className={[
                  'py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-200',
                  isSelected ? cfg.selectedBg : `glass-1 ${cfg.bg} ${cfg.text}`,
                ].join(' ')}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-white/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <HardDrive size={15} strokeWidth={1.75} className="text-blue-500" />
            <span>
              Imaging slots:{' '}
              <span className="font-semibold text-ink-800">{availableCount}</span>{' '}
              available
            </span>
          </div>
          <Link to="/hospital/mri" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
            Manage
          </Link>
        </div>
      </Card>

      {recentSlots.length > 0 && (
        <Card level={1} padding="sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-800">Recent imaging slots</h2>
            <Link to="/hospital/mri" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
              View all
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/30">
                <th className="text-left pb-2 font-semibold">Date</th>
                <th className="text-left pb-2 font-semibold">Type</th>
                <th className="text-left pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSlots.map((slot) => (
                <tr key={slot.id} className="border-b border-white/20 last:border-0">
                  <td className="py-2 text-ink-800">{formatDateTime(slot.datetime)}</td>
                  <td className="py-2 text-slate-500">{slot.type}</td>
                  <td className="py-2">
                    <span className={`text-xs font-semibold ${slot.available ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {slot.available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
