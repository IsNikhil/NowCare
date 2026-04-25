import { where } from 'firebase/firestore'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { Card } from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { Building2, CheckSquare, Users, Stethoscope } from 'lucide-react'
import { formatDate } from '../../lib/format'
import HospitalQueue from './HospitalQueue'
import type { Hospital, Doctor, Patient } from '../../types'

const erStatusLabel: Record<string, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  closed: 'Closed',
}

export default function AdminDashboard() {
  const { data: pending, loading: pLoad } = useFirestoreCollection<Hospital>(
    'hospitals', [where('status', '==', 'pending')]
  )
  const { data: approved, loading: aLoad } = useFirestoreCollection<Hospital>(
    'hospitals', [where('status', '==', 'approved')]
  )
  const { data: doctors, loading: dLoad } = useFirestoreCollection<Doctor>('doctors', [])
  const { data: patients, loading: patLoad } = useFirestoreCollection<Patient>('patients', [])
  const { data: verifiedDoctors } = useFirestoreCollection<Doctor>(
    'doctors', [where('verified', '==', true)]
  )

  const loading = pLoad || aLoad || dLoad || patLoad

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const stats = [
    {
      label: 'Pending hospitals',
      value: pending.length,
      icon: <Building2 size={24} strokeWidth={1.75} className="text-amber-500" />,
      anchor: '#pending',
      urgent: pending.length > 0,
    },
    {
      label: 'Approved hospitals',
      value: approved.length,
      icon: <CheckSquare size={24} strokeWidth={1.75} className="text-emerald-500" />,
      anchor: '#approved',
      urgent: false,
    },
    {
      label: 'Doctors',
      value: doctors.length,
      icon: <Stethoscope size={24} strokeWidth={1.75} className="text-blue-500" />,
      anchor: '#users',
      urgent: false,
    },
    {
      label: 'Patients',
      value: patients.length,
      icon: <Users size={24} strokeWidth={1.75} className="text-teal-500" />,
      anchor: '#users',
      urgent: false,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-800 tracking-tight mb-6">Admin</h1>

      <div className="grid sm:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <a key={s.label} href={s.anchor} className="block">
            <Card
              level={1}
              padding="sm"
              className={`hover:glass-2 transition-all duration-200 cursor-pointer ${s.urgent ? 'border border-amber-300' : ''}`}
            >
              <div className="flex items-center justify-between">
                {s.icon}
                {s.urgent && s.value > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <p className="text-2xl font-bold text-ink-800 mt-2">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </Card>
          </a>
        ))}
      </div>

      <section id="pending" className="mb-10">
        <h2 className="text-base font-semibold text-ink-800 mb-4">Pending approval</h2>
        <HospitalQueue embedded />
      </section>

      <section id="approved" className="mb-10">
        <h2 className="text-base font-semibold text-ink-800 mb-4">Approved hospitals</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No approved hospitals yet.</p>
        ) : (
          <Card level={1} padding="sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-white/30">
                  <th className="text-left pb-2 font-semibold">Name</th>
                  <th className="text-left pb-2 font-semibold">Approved</th>
                  <th className="text-left pb-2 font-semibold">ER status</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((h) => (
                  <tr key={h.id} className="border-b border-white/20 last:border-0">
                    <td className="py-2 font-medium text-ink-800">
                      {h.cms_data?.facility_name ?? h.name}
                    </td>
                    <td className="py-2 text-slate-500 text-xs">
                      {h.approvedAt ? formatDate(h.approvedAt) : '—'}
                    </td>
                    <td className="py-2 text-xs">
                      {h.er_status ? (
                        <span className={`font-semibold ${
                          h.er_status === 'low' ? 'text-emerald-600' :
                          h.er_status === 'moderate' ? 'text-amber-500' :
                          h.er_status === 'high' ? 'text-rose-500' : 'text-slate-400'
                        }`}>
                          {erStatusLabel[h.er_status]}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section id="users" className="mb-6">
        <h2 className="text-base font-semibold text-ink-800 mb-4">Registered users</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Card level={1} padding="sm">
            <p className="text-xs text-slate-500 mb-1">Patients</p>
            <p className="text-2xl font-bold text-ink-800">{patients.length}</p>
          </Card>
          <Card level={1} padding="sm">
            <p className="text-xs text-slate-500 mb-1">Doctors</p>
            <p className="text-2xl font-bold text-ink-800">{doctors.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">{verifiedDoctors.length} NPI verified</p>
          </Card>
          <Card level={1} padding="sm">
            <p className="text-xs text-slate-500 mb-1">Hospitals</p>
            <p className="text-2xl font-bold text-ink-800">{approved.length + pending.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">{pending.length} pending review</p>
          </Card>
        </div>
      </section>
    </div>
  )
}
