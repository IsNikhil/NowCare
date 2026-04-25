import { useState } from 'react'
import { where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, AlertTriangle, Users, Stethoscope, Activity,
  CheckCircle2, XCircle, Clock, LayoutDashboard, CheckSquare,
  ExternalLink, Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { db } from '../../services/firebase'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { fetchHospitalData, fetchBenchmarks } from '../../services/cms'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton'
import { formatDate } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import type { Hospital, Doctor, Patient, Role, User } from '../../types'

type Tab = 'overview' | 'hospitals' | 'doctors' | 'patients' | 'users'
type EditableKind = 'hospital' | 'doctor' | 'patient' | 'user'
type EditableItem =
  | { kind: 'hospital'; item: Hospital & { id: string } }
  | { kind: 'doctor'; item: Doctor & { id: string } }
  | { kind: 'patient'; item: Patient & { id: string } }
  | { kind: 'user'; item: User & { id: string } }

const ER_COLORS: Record<string, string> = {
  low: 'var(--accent-green)',
  moderate: 'var(--accent-amber)',
  high: 'var(--accent-coral)',
  closed: 'var(--text-muted)',
}

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'patient', label: 'Patient' },
]

const hospitalStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
]

const erStatusOptions = [
  { value: '', label: 'Not set' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'closed', label: 'Closed' },
]

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Nonbinary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

function csv(value?: string[]) {
  return value?.join(', ') ?? ''
}

function splitCsv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function optionalNumber(value: string) {
  if (value.trim() === '') return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

// ─── Overview Panel ─────────────────────────────────────────────────────────

function OverviewPanel({
  pending, approved, doctors, patients,
  onApprove, onDeny, processing,
}: {
  pending: (Hospital & { id: string })[]
  approved: (Hospital & { id: string })[]
  doctors: (Doctor & { id: string })[]
  patients: (Patient & { id: string })[]
  onApprove: (h: Hospital & { id: string }) => void
  onDeny: (h: Hospital & { id: string }) => void
  processing: string | null
}) {
  const stats = [
    { label: 'Pending review', value: pending.length, icon: <AlertTriangle size={16} strokeWidth={1.75} />, color: 'var(--accent-amber)', urgent: pending.length > 0 },
    { label: 'Approved hospitals', value: approved.length, icon: <Building2 size={16} strokeWidth={1.75} />, color: 'var(--accent-teal)', urgent: false },
    { label: 'Doctors', value: doctors.length, icon: <Stethoscope size={16} strokeWidth={1.75} />, color: 'var(--accent-violet)', urgent: false },
    { label: 'Patients', value: patients.length, icon: <Users size={16} strokeWidth={1.75} />, color: 'var(--accent-teal)', urgent: false },
  ]

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
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

      {/* Pending approvals queue */}
      <motion.div variants={fadeRise}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} strokeWidth={1.75} style={{ color: 'var(--accent-amber)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pending Approval</h2>
          {pending.length > 0 && <Badge variant="warning">{pending.length}</Badge>}
        </div>

        {pending.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
              <Building2 size={22} strokeWidth={1.25} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No hospitals pending</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>New registrations will appear here for review.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {pending.map((hospital) => (
              <GlassCard key={hospital.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsla(38,90%,65%,0.1)', color: 'var(--accent-amber)' }}>
                    <Clock size={15} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{hospital.name}</p>
                    {hospital.email && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{hospital.email}</p>
                    )}
                    {hospital.createdAt && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Submitted {formatDate(hospital.createdAt)}
                      </p>
                    )}
                    {hospital.supportingDocuments ? (
                      <a
                        href={hospital.supportingDocuments}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold mt-1 hover:underline"
                        style={{ color: 'var(--accent-teal)' }}
                      >
                        <ExternalLink size={10} strokeWidth={1.75} />
                        View documents
                      </a>
                    ) : (
                      <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)' }}>No documents provided</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={processing === hospital.id}
                    disabled={processing !== null}
                    onClick={() => onApprove(hospital)}
                  >
                    <CheckCircle2 size={14} strokeWidth={1.75} />
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={processing === hospital.id}
                    disabled={processing !== null}
                    onClick={() => onDeny(hospital)}
                  >
                    <XCircle size={14} strokeWidth={1.75} />
                    Deny
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </motion.div>

      {/* Live hospitals */}
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
    </motion.div>
  )
}

// ─── Hospitals Panel ─────────────────────────────────────────────────────────

function HospitalsPanel({
  pending, approved,
  onApprove, onDeny, onEdit, processing,
}: {
  pending: (Hospital & { id: string })[]
  approved: (Hospital & { id: string })[]
  onApprove: (h: Hospital & { id: string }) => void
  onDeny: (h: Hospital & { id: string }) => void
  onEdit: (h: Hospital & { id: string }) => void
  processing: string | null
}) {
  const all = [...pending, ...approved]

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={fadeRise}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          All Hospitals <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({all.length})</span>
        </h2>
      </motion.div>

      {all.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hospitals registered yet.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="divide-y" style={{ ['--tw-divide-opacity' as string]: 1 }}>
            {all.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                  <Building2 size={14} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {h.cms_data?.facility_name ?? h.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {h.email ?? ''}
                    {h.createdAt ? ` · Registered ${formatDate(h.createdAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={h.status === 'approved' ? 'success' : h.status === 'denied' ? 'danger' : 'warning'}>
                    {h.status}
                  </Badge>
                  <button
                    onClick={() => onEdit(h)}
                    className="text-xs px-2 py-1 rounded-lg font-semibold transition-colors inline-flex items-center gap-1"
                    style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}
                  >
                    <Pencil size={12} strokeWidth={1.75} />
                    Edit
                  </button>
                  {h.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onApprove(h)}
                        disabled={processing !== null}
                        className="text-xs px-2 py-1 rounded-lg font-semibold transition-colors"
                        style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onDeny(h)}
                        disabled={processing !== null}
                        className="text-xs px-2 py-1 rounded-lg font-semibold transition-colors"
                        style={{ background: 'hsla(8,90%,65%,0.1)', color: 'var(--accent-coral)' }}
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </motion.div>
  )
}

// ─── Doctors Panel ───────────────────────────────────────────────────────────

function DoctorsPanel({
  doctors,
  onEdit,
}: {
  doctors: (Doctor & { id: string })[]
  onEdit: (d: Doctor & { id: string }) => void
}) {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={fadeRise}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Doctors <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({doctors.length})</span>
        </h2>
      </motion.div>

      {doctors.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No doctors registered yet.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="divide-y" style={{ ['--tw-divide-opacity' as string]: 1 }}>
            {doctors.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                  <Stethoscope size={14} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {d.npi_data?.name ?? d.displayName ?? 'Provider'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    NPI {d.npi}
                    {d.specialty ? ` · ${d.specialty}` : ''}
                  </p>
                </div>
                <Badge variant={d.verified ? 'success' : 'warning'}>
                  {d.verified ? 'NPI verified' : 'Unverified'}
                </Badge>
                <button
                  onClick={() => onEdit(d)}
                  className="text-xs px-2 py-1 rounded-lg font-semibold transition-colors inline-flex items-center gap-1"
                  style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}
                >
                  <Pencil size={12} strokeWidth={1.75} />
                  Edit
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </motion.div>
  )
}

// ─── Patients Panel ──────────────────────────────────────────────────────────

function PatientsPanel({
  patients, loading, onEdit,
}: {
  patients: (Patient & { id: string })[]
  loading: boolean
  onEdit: (p: Patient & { id: string }) => void
}) {
  if (loading) return <SkeletonList count={4} />

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={fadeRise}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Patients <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({patients.length})</span>
        </h2>
      </motion.div>

      {patients.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No patients registered yet.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="divide-y" style={{ ['--tw-divide-opacity' as string]: 1 }}>
            {patients.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}
                >
                  {(p.displayName ?? p.uid ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {p.displayName ?? `Patient ${p.uid?.slice(-6)}`}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.age ? `Age ${p.age}` : ''}
                    {p.gender ? ` · ${p.gender}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => onEdit(p)}
                  className="text-xs px-2 py-1 rounded-lg font-semibold transition-colors inline-flex items-center gap-1"
                  style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}
                >
                  <Pencil size={12} strokeWidth={1.75} />
                  Edit
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </motion.div>
  )
}

// ─── Users Panel ─────────────────────────────────────────────────────────────

function UsersPanel({
  users, loading, onEdit,
}: {
  users: (User & { id: string })[]
  loading: boolean
  onEdit: (u: User & { id: string }) => void
}) {
  if (loading) return <SkeletonList count={4} />

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={fadeRise}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Users <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({users.length})</span>
        </h2>
      </motion.div>

      {users.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users registered yet.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="divide-y" style={{ ['--tw-divide-opacity' as string]: 1 }}>
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}
                >
                  {(u.email ?? u.id).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {u.email}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {u.role}
                    {u.createdAt ? ` · Joined ${formatDate(u.createdAt)}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => onEdit(u)}
                  className="text-xs px-2 py-1 rounded-lg font-semibold transition-colors inline-flex items-center gap-1"
                  style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}
                >
                  <Pencil size={12} strokeWidth={1.75} />
                  Edit
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </motion.div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [processing, setProcessing] = useState<string | null>(null)

  const { data: pending, loading: pLoad } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'pending')])
  const { data: approved, loading: aLoad } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'approved')])
  const { data: doctors, loading: dLoad } = useFirestoreCollection<Doctor>('doctors', [])
  const { data: patients, loading: patLoad } = useFirestoreCollection<Patient>('patients', [])

  const statsLoading = pLoad || aLoad || dLoad

  const tabs: { value: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { value: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} strokeWidth={1.75} /> },
    { value: 'hospitals', label: 'Hospitals', icon: <Building2 size={15} strokeWidth={1.75} />, count: (pending.length + approved.length) },
    { value: 'doctors', label: 'Doctors', icon: <Stethoscope size={15} strokeWidth={1.75} />, count: doctors.length },
    { value: 'patients', label: 'Patients', icon: <Users size={15} strokeWidth={1.75} />, count: patients.length },
  ]

  async function handleApprove(hospital: Hospital & { id: string }) {
    setProcessing(hospital.id)
    try {
      let cmsData = null
      let cmsBenchmarks = null
      let cmsWarning = false
      try {
        cmsData = await fetchHospitalData(hospital.name)
        if (cmsData) {
          try { cmsBenchmarks = await fetchBenchmarks(hospital.name) } catch { /* ignore */ }
        }
      } catch { cmsWarning = true }

      await updateDoc(doc(db, 'hospitals', hospital.id), {
        status: 'approved',
        cms_data: cmsData ?? null,
        cms_benchmarks: cmsBenchmarks ?? null,
        approvedAt: serverTimestamp(),
      })
      toast.success(cmsWarning || !cmsData
        ? `${hospital.name} approved.`
        : `${hospital.name} approved with CMS data.`)
    } catch {
      toast.error('Could not approve hospital.')
    } finally {
      setProcessing(null)
    }
  }

  async function handleDeny(hospital: Hospital & { id: string }) {
    setProcessing(hospital.id)
    try {
      await updateDoc(doc(db, 'hospitals', hospital.id), { status: 'denied' })
      toast(`${hospital.name} denied.`)
    } catch {
      toast.error('Could not deny hospital.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>Admin</h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Hospital approvals, provider oversight, and platform stats.</p>
      </div>

      {/* Tab bar — uses client state, never anchor links */}
      <div
        className="flex gap-1 p-1 rounded-2xl"
        style={{ background: 'var(--surface-tint)', border: '1px solid var(--border-subtle)' }}
      >
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{
              background: tab === t.value ? 'var(--bg-elevated)' : 'transparent',
              color: tab === t.value ? 'var(--accent-teal)' : 'var(--text-muted)',
              boxShadow: tab === t.value ? 'var(--shadow-card)' : 'none',
            }}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab === t.value ? 'var(--accent-teal-glow)' : 'var(--border-subtle)',
                  color: tab === t.value ? 'var(--accent-teal)' : 'var(--text-muted)',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content — AnimatePresence ensures no layout jump */}
      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
              </div>
            ) : (
              <OverviewPanel
                pending={pending as (Hospital & { id: string })[]}
                approved={approved as (Hospital & { id: string })[]}
                doctors={doctors as (Doctor & { id: string })[]}
                patients={patients as (Patient & { id: string })[]}
                onApprove={handleApprove}
                onDeny={handleDeny}
                processing={processing}
              />
            )}
          </motion.div>
        )}

        {tab === 'hospitals' && (
          <motion.div
            key="hospitals"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {(pLoad || aLoad) ? <SkeletonList count={3} /> : (
              <HospitalsPanel
                pending={pending as (Hospital & { id: string })[]}
                approved={approved as (Hospital & { id: string })[]}
                onApprove={handleApprove}
                onDeny={handleDeny}
                processing={processing}
              />
            )}
          </motion.div>
        )}

        {tab === 'doctors' && (
          <motion.div
            key="doctors"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {dLoad ? <SkeletonList count={3} /> : (
              <DoctorsPanel doctors={doctors as (Doctor & { id: string })[]} />
            )}
          </motion.div>
        )}

        {tab === 'patients' && (
          <motion.div
            key="patients"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <PatientsPanel
              patients={patients as (Patient & { id: string })[]}
              loading={patLoad}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
