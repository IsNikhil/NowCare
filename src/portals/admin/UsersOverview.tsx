import { where } from 'firebase/firestore'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { User, Stethoscope, Building2, ShieldCheck } from 'lucide-react'
import type { Hospital, Doctor, Patient } from '../../types'

export default function UsersOverview() {
  const { data: patients, loading: pLoad } = useFirestoreCollection<Patient>('patients', [])
  const { data: doctors, loading: dLoad } = useFirestoreCollection<Doctor>('doctors', [])
  const { data: hospitals, loading: hLoad } = useFirestoreCollection<Hospital>('hospitals', [])
  const { data: approved, loading: aLoad } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'approved')])
  const { data: pending } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'pending')])
  const { data: verified } = useFirestoreCollection<Doctor>('doctors', [where('verified', '==', true)])

  const loading = pLoad || dLoad || hLoad || aLoad

  if (loading) {
    return <div className="max-w-2xl mx-auto"><SkeletonCard /></div>
  }

  const groups = [
    {
      title: 'Patients',
      icon: <User size={28} strokeWidth={1.75} className="text-teal-500" />,
      stats: [{ label: 'Total patients', value: patients.length }],
    },
    {
      title: 'Doctors',
      icon: <Stethoscope size={28} strokeWidth={1.75} className="text-blue-500" />,
      stats: [
        { label: 'Total doctors', value: doctors.length },
        { label: 'NPI verified', value: verified.length },
      ],
    },
    {
      title: 'Hospitals',
      icon: <Building2 size={28} strokeWidth={1.75} className="text-amber-500" />,
      stats: [
        { label: 'Total hospitals', value: hospitals.length },
        { label: 'Approved', value: approved.length },
        { label: 'Pending review', value: pending.length },
      ],
    },
    {
      title: 'Admin',
      icon: <ShieldCheck size={28} strokeWidth={1.75} className="text-emerald-500" />,
      stats: [{ label: 'Admin accounts', value: 1 }],
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Users overview" subtitle="Breakdown of all users by role." />

      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <Card key={g.title} level={1} padding="md">
            <div className="flex items-center gap-3 mb-4">
              {g.icon}
              <h3 className="font-semibold text-ink-800">{g.title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {g.stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-ink-800">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
