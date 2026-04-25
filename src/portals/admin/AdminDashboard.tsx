import { where } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Building2, AlertTriangle, Users, Stethoscope, Activity } from 'lucide-react'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { formatDate } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import HospitalQueue from './HospitalQueue'
import type { Hospital, Doctor, Patient } from '../../types'

const ER_COLORS: Record<string, string> = {
  low: 'var(--accent-green)',
  moderate: 'var(--accent-amber)',
  high: 'var(--accent-coral)',
  closed: 'var(--text-muted)',
}

export default function AdminDashboard() {
  const { data: pending, loading: pLoad } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'pending')])
  const { data: approved, loading: aLoad } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'approved')])
  const { data: doctors, loading: dLoad } = useFirestoreCollection<Doctor>('doctors', [])
  const { data: patients, loading: patLoad } = useFirestoreCollection<Patient>('patients', [])
  const { data: verifiedDoctors } = useFirestoreCollection<Doctor>('doctors', [where('verified', '==', true)])

  const loading = pLoad || aLoad || dLoad || patLoad

  const stats = [
    { label: 'Pending review', value: pending.length, icon: <AlertTriangle size={16} strokeWidth={1.75} />, color: 'var(--accent-amber)', urgent: pending.length > 0 },
    { label: 'Approved hospitals', value: approved.length, icon: <Building2 size={16} strokeWidth={1.75} />, color: 'var(--accent-teal)', urgent: false },
    { label: 'Doctors', value: doctors.length, icon: <Stethoscope size={16} strokeWidth={1.75} />, color: 'var(--accent-violet)', urgent: false },
    { label: 'Patients', value: patients.length, icon: <Users size={16} strokeWidth={1.75} />, color: 'var(--accent-teal)', urgent: false },
  ]

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl mx-auto space-y-6">
      <motion.div variants={fadeRise}>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>Admin</h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Hospital approvals, provider oversight, and platform stats.</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <motion.div variants={fadeRise} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <GlassCard key={s.label} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                {s.urgent && s.value > 0 && (
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: s.color }} />
                )}
              </div>
              <p className="text-2xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </GlassCard>
          ))}
        </motion.div>
      )}

      <motion.div variants={fadeRise}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} strokeWidth={1.75} style={{ color: 'var(--accent-amber)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pending Approval</h2>
          {pending.length > 0 && <Badge variant="warning">{pending.length}</Badge>}
        </div>
        <HospitalQueue embedded />
      </motion.div>

      {approved.length > 0 && (
        <motion.div variants={fadeRise}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={15} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Live Hospitals</h2>
            <Badge variant="teal">{approved.length}</Badge>
          </div>
          <GlassCard>
            <div className="divide-y" style={{ ['--tw-divide-opacity' as string]: 1 }}>
              {approved.map((h) => (
                <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                    <Building2 size={14} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {h.cms_data?.facility_name ?? h.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {h.cms_data?.city ? `${h.cms_data.city}, ${h.cms_data.state}` : ''}
                      {h.approvedAt ? ` · Approved ${formatDate(h.approvedAt)}` : ''}
                    </p>
                  </div>
                  {h.er_status && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: ER_COLORS[h.er_status] ?? 'var(--text-muted)' }} />
                      <span className="text-xs font-semibold capitalize" style={{ color: ER_COLORS[h.er_status] ?? 'var(--text-muted)' }}>
                        {h.er_status}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      <motion.div variants={fadeRise}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Provider Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <GlassCard className="p-4">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Patients</p>
            <p className="text-2xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>{patients.length}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Doctors</p>
            <p className="text-2xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>{doctors.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--accent-teal)' }}>{verifiedDoctors.length} NPI verified</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total hospitals</p>
            <p className="text-2xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>{approved.length + pending.length}</p>
            {pending.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--accent-amber)' }}>{pending.length} awaiting review</p>
            )}
          </GlassCard>
        </div>
      </motion.div>
    </motion.div>
  )
}
