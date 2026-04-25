import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { where, orderBy, Timestamp } from 'firebase/firestore'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { VerificationBadge } from '../../components/providers/VerificationBadge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { AlertCircle } from 'lucide-react'
import { formatDate, formatTime } from '../../lib/format'
import type { Doctor, DoctorSlot } from '../../types'

export default function DoctorDashboard() {
  const { user } = useAuth()

  const { data: doctor, loading: docLoading } = useFirestoreDoc<Doctor>(
    user ? `doctors/${user.uid}` : ''
  )

  const now = useMemo(() => new Date(), [])

  const { data: bookedSlots, loading: bookedLoading } = useFirestoreCollection<DoctorSlot>(
    'doctor_slots',
    user
      ? [where('doctorId', '==', user.uid), where('available', '==', false), orderBy('datetime', 'asc')]
      : []
  )

  const { data: openSlots, loading: openLoading } = useFirestoreCollection<DoctorSlot>(
    'doctor_slots',
    user
      ? [
          where('doctorId', '==', user.uid),
          where('available', '==', true),
          where('datetime', '>=', Timestamp.fromDate(now)),
          orderBy('datetime', 'asc'),
        ]
      : []
  )

  const upcomingAppts = bookedSlots.filter(
    (s) => s.datetime.toDate() >= now && s.status === 'reserved'
  )
  const pastAppts = bookedSlots.filter((s) => s.datetime.toDate() < now).reverse()

  const loading = docLoading || bookedLoading || openLoading

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <SkeletonCard />
      </div>
    )
  }

  const doctorName =
    doctor?.npi_data?.name ??
    doctor?.displayName ??
    doctor?.name ??
    user?.email?.split('@')[0] ??
    'Provider'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-ink-800">{doctorName}</h1>
          {doctor?.specialty && (
            <span className="text-xs px-2 py-0.5 rounded-full glass-1 text-teal-600 font-medium border border-teal-200/50">
              {doctor.specialty}
            </span>
          )}
          {doctor?.npi && (
            <span className="text-xs text-slate-400">NPI: {doctor.npi}</span>
          )}
          {doctor?.verified && doctor.badge && (
            <VerificationBadge badge={doctor.badge} />
          )}
        </div>

        {!doctor?.verified && (
          <div className="mt-3 flex items-start gap-3 glass-1 rounded-2xl p-4">
            <AlertCircle size={18} strokeWidth={1.75} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-ink-800">NPI not yet verified</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify your NPI to be discoverable by patients.
              </p>
              <Link to="/doctor/verify" className="mt-2 inline-block">
                <Button variant="secondary" size="sm">Verify NPI</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card level={1} padding="sm" className="text-center">
          <p className="text-2xl font-bold text-teal-500">{upcomingAppts.length}</p>
          <p className="text-xs text-slate-500 mt-1">Upcoming appointments</p>
        </Card>
        <Card level={1} padding="sm" className="text-center">
          <p className="text-2xl font-bold text-ink-800">{openSlots.length}</p>
          <p className="text-xs text-slate-500 mt-1">Open slots</p>
        </Card>
      </div>

      <Card level={2} padding="sm" className="mb-4">
        <h2 className="text-sm font-semibold text-ink-800 mb-3">Upcoming appointments</h2>

        {upcomingAppts.length === 0 && (
          <div>
            <p className="text-sm text-slate-400">No upcoming appointments yet.</p>
            <Link
              to="/doctor/availability"
              className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-1 inline-block"
            >
              Add availability
            </Link>
          </div>
        )}

        {upcomingAppts.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/30">
                <th className="text-left pb-2 font-semibold">Date</th>
                <th className="text-left pb-2 font-semibold">Time</th>
                <th className="text-left pb-2 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {upcomingAppts.map((slot) => (
                <tr key={slot.id} className="border-b border-white/20 last:border-0">
                  <td className="py-2 text-ink-800">{formatDate(slot.datetime)}</td>
                  <td className="py-2 text-slate-500">{formatTime(slot.datetime)}</td>
                  <td className="py-2 text-slate-500">{slot.durationMinutes ? `${slot.durationMinutes} min` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card level={2} padding="sm">
        <h2 className="text-sm font-semibold text-ink-800 mb-3">Past appointments</h2>

        {pastAppts.length === 0 && (
          <p className="text-sm text-slate-400">No past appointments yet.</p>
        )}

        {pastAppts.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/30">
                <th className="text-left pb-2 font-semibold">Date</th>
                <th className="text-left pb-2 font-semibold">Time</th>
                <th className="text-left pb-2 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {pastAppts.map((slot) => (
                <tr key={slot.id} className="border-b border-white/20 last:border-0">
                  <td className="py-2 text-ink-800">{formatDate(slot.datetime)}</td>
                  <td className="py-2 text-slate-500">{formatTime(slot.datetime)}</td>
                  <td className="py-2 text-slate-500">{slot.durationMinutes ? `${slot.durationMinutes} min` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
