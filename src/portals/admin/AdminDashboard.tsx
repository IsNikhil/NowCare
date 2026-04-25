import { useEffect, useMemo, useState } from 'react'
import { where, deleteField, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, AlertTriangle, Users, Stethoscope, Activity,
  CheckCircle2, XCircle, Clock, LayoutDashboard,
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
type AdminPatient = Partial<Patient> & { id: string; uid: string; email?: string; hasProfile: boolean }
type EditableItem =
  | { kind: 'hospital'; item: Hospital & { id: string } }
  | { kind: 'doctor'; item: Doctor & { id: string } }
  | { kind: 'patient'; item: AdminPatient }
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
  patients: AdminPatient[]
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
  patients: AdminPatient[]
  loading: boolean
  onEdit: (p: AdminPatient) => void
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
                    {p.displayName ?? p.email ?? `Patient ${p.uid?.slice(-6)}`}
                  </p>
                  <p className="text-xs flex flex-wrap gap-x-1.5" style={{ color: 'var(--text-muted)' }}>
                    {p.email && p.displayName && <span>{p.email}</span>}
                    {p.age ? <span>Age {p.age}</span> : null}
                    {p.gender ? <span>{p.gender}</span> : null}
                    {!p.hasProfile && <span>Profile not completed</span>}
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

function getInitialEditFields(target: EditableItem | null): Record<string, string> {
  if (!target) return {}

  if (target.kind === 'hospital') {
    const item = target.item
    return {
      name: item.name ?? '',
      email: item.email ?? '',
      status: item.status ?? 'pending',
      address: item.address ?? item.cms_data?.address ?? '',
      phone: item.phone ?? item.cms_data?.phone_number ?? '',
      type: item.type ?? item.cms_data?.hospital_type ?? '',
      er_status: item.er_status ?? '',
      services: csv(item.services),
      lat: item.lat?.toString() ?? '',
      lng: item.lng?.toString() ?? '',
    }
  }

  if (target.kind === 'doctor') {
    const item = target.item
    return {
      displayName: item.displayName ?? item.name ?? item.npi_data?.name ?? '',
      npi: item.npi ?? '',
      specialty: item.specialty ?? item.npi_data?.specialty ?? '',
      credentials: item.credentials ?? item.npi_data?.credential ?? '',
      address: item.address ?? item.npi_data?.practiceAddress ?? '',
      bio: item.bio ?? '',
      verified: item.verified ? 'true' : 'false',
      affiliatedHospitalId: item.affiliatedHospitalId ?? '',
      languages: csv(item.languages),
      acceptedInsurance: csv(item.acceptedInsurance),
      lat: item.lat?.toString() ?? '',
      lng: item.lng?.toString() ?? '',
    }
  }

  if (target.kind === 'patient') {
    const item = target.item
    return {
      displayName: item.displayName ?? '',
      age: item.age?.toString() ?? '',
      gender: item.gender ?? 'prefer_not_to_say',
      height: item.height ?? '',
      weight: item.weight ?? '',
      emergencyContact: item.emergencyContact ?? '',
      allergies: csv(item.allergies),
      medications: csv(item.medications),
      knownDiseases: csv(item.knownDiseases),
      pastMedications: csv(item.pastMedications),
      lat: item.lat?.toString() ?? '',
      lng: item.lng?.toString() ?? '',
    }
  }

  return {
    email: target.item.email ?? '',
    role: target.item.role ?? 'patient',
  }
}

function AdminEditModal({
  target,
  onClose,
}: {
  target: EditableItem | null
  onClose: () => void
}) {
  const [editFields, setEditFields] = useState<Record<string, string>>(() => getInitialEditFields(target))
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    setEditFields(getInitialEditFields(target))
  }, [target])

  function updateEditField(key: string, value: string) {
    setEditFields((current) => ({ ...current, [key]: value }))
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!target) return

    setSavingEdit(true)
    try {
      if (target.kind === 'hospital') {
        const lat = optionalNumber(editFields.lat ?? '')
        const lng = optionalNumber(editFields.lng ?? '')
        await updateDoc(doc(db, 'hospitals', target.item.id), {
          name: editFields.name?.trim() ?? '',
          email: editFields.email?.trim() ?? '',
          status: editFields.status,
          address: editFields.address?.trim() ?? '',
          phone: editFields.phone?.trim() ?? '',
          type: editFields.type?.trim() ?? '',
          er_status: editFields.er_status || null,
          services: splitCsv(editFields.services ?? ''),
          lat: lat ?? deleteField(),
          lng: lng ?? deleteField(),
          updatedAt: serverTimestamp(),
        })
      } else if (target.kind === 'doctor') {
        const lat = optionalNumber(editFields.lat ?? '')
        const lng = optionalNumber(editFields.lng ?? '')
        await updateDoc(doc(db, 'doctors', target.item.id), {
          displayName: editFields.displayName?.trim() ?? '',
          name: editFields.displayName?.trim() ?? '',
          npi: editFields.npi?.trim() ?? '',
          specialty: editFields.specialty?.trim() ?? '',
          credentials: editFields.credentials?.trim() ?? '',
          address: editFields.address?.trim() ?? '',
          bio: editFields.bio?.trim() ?? '',
          verified: editFields.verified === 'true',
          affiliatedHospitalId: editFields.affiliatedHospitalId?.trim() || null,
          languages: splitCsv(editFields.languages ?? ''),
          acceptedInsurance: splitCsv(editFields.acceptedInsurance ?? ''),
          lat: lat ?? deleteField(),
          lng: lng ?? deleteField(),
          updatedAt: serverTimestamp(),
        })
      } else if (target.kind === 'patient') {
        const age = optionalNumber(editFields.age ?? '')
        const lat = optionalNumber(editFields.lat ?? '')
        const lng = optionalNumber(editFields.lng ?? '')
        await setDoc(doc(db, 'patients', target.item.id), {
          uid: target.item.uid,
          displayName: editFields.displayName?.trim() ?? '',
          age: age ?? deleteField(),
          gender: editFields.gender,
          height: editFields.height?.trim() ?? '',
          weight: editFields.weight?.trim() ?? '',
          emergencyContact: editFields.emergencyContact?.trim() ?? '',
          allergies: splitCsv(editFields.allergies ?? ''),
          medications: splitCsv(editFields.medications ?? ''),
          knownDiseases: splitCsv(editFields.knownDiseases ?? ''),
          pastMedications: splitCsv(editFields.pastMedications ?? ''),
          lat: lat ?? deleteField(),
          lng: lng ?? deleteField(),
          updatedAt: serverTimestamp(),
        }, { merge: true })
      } else {
        await updateDoc(doc(db, 'users', target.item.id), {
          email: editFields.email?.trim() ?? '',
          role: editFields.role as Role,
          updatedAt: serverTimestamp(),
        })
      }
      toast.success('Changes saved.')
      onClose()
    } catch {
      toast.error('Could not save changes.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={target ? `Edit ${target.kind}` : 'Edit record'}
      maxWidth="lg"
    >
      <form onSubmit={handleSaveEdit} className="space-y-4">
        {target?.kind === 'hospital' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Hospital name" value={editFields.name ?? ''} onChange={(e) => updateEditField('name', e.target.value)} />
              <Input label="Email" type="email" value={editFields.email ?? ''} onChange={(e) => updateEditField('email', e.target.value)} />
              <Select label="Status" options={hospitalStatusOptions} value={editFields.status ?? 'pending'} onChange={(e) => updateEditField('status', e.target.value)} />
              <Select label="ER status" options={erStatusOptions} value={editFields.er_status ?? ''} onChange={(e) => updateEditField('er_status', e.target.value)} />
              <Input label="Phone" value={editFields.phone ?? ''} onChange={(e) => updateEditField('phone', e.target.value)} />
              <Input label="Hospital type" value={editFields.type ?? ''} onChange={(e) => updateEditField('type', e.target.value)} />
              <Input label="Latitude" type="number" value={editFields.lat ?? ''} onChange={(e) => updateEditField('lat', e.target.value)} />
              <Input label="Longitude" type="number" value={editFields.lng ?? ''} onChange={(e) => updateEditField('lng', e.target.value)} />
            </div>
            <Input label="Address" value={editFields.address ?? ''} onChange={(e) => updateEditField('address', e.target.value)} />
            <Textarea label="Services" helperText="Comma separated" value={editFields.services ?? ''} onChange={(e) => updateEditField('services', e.target.value)} />
          </>
        )}

        {target?.kind === 'doctor' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Display name" value={editFields.displayName ?? ''} onChange={(e) => updateEditField('displayName', e.target.value)} />
              <Input label="NPI" value={editFields.npi ?? ''} onChange={(e) => updateEditField('npi', e.target.value)} />
              <Input label="Specialty" value={editFields.specialty ?? ''} onChange={(e) => updateEditField('specialty', e.target.value)} />
              <Input label="Credentials" value={editFields.credentials ?? ''} onChange={(e) => updateEditField('credentials', e.target.value)} />
              <Select
                label="Verification"
                options={[{ value: 'true', label: 'Verified' }, { value: 'false', label: 'Unverified' }]}
                value={editFields.verified ?? 'false'}
                onChange={(e) => updateEditField('verified', e.target.value)}
              />
              <Input label="Affiliated hospital ID" value={editFields.affiliatedHospitalId ?? ''} onChange={(e) => updateEditField('affiliatedHospitalId', e.target.value)} />
              <Input label="Latitude" type="number" value={editFields.lat ?? ''} onChange={(e) => updateEditField('lat', e.target.value)} />
              <Input label="Longitude" type="number" value={editFields.lng ?? ''} onChange={(e) => updateEditField('lng', e.target.value)} />
            </div>
            <Input label="Address" value={editFields.address ?? ''} onChange={(e) => updateEditField('address', e.target.value)} />
            <Textarea label="Bio" value={editFields.bio ?? ''} onChange={(e) => updateEditField('bio', e.target.value)} />
            <Textarea label="Languages" helperText="Comma separated" value={editFields.languages ?? ''} onChange={(e) => updateEditField('languages', e.target.value)} />
            <Textarea label="Accepted insurance" helperText="Comma separated" value={editFields.acceptedInsurance ?? ''} onChange={(e) => updateEditField('acceptedInsurance', e.target.value)} />
          </>
        )}

        {target?.kind === 'patient' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Display name" value={editFields.displayName ?? ''} onChange={(e) => updateEditField('displayName', e.target.value)} />
              <Input label="Age" type="number" value={editFields.age ?? ''} onChange={(e) => updateEditField('age', e.target.value)} />
              <Select label="Gender" options={genderOptions} value={editFields.gender ?? 'prefer_not_to_say'} onChange={(e) => updateEditField('gender', e.target.value)} />
              <Input label="Emergency contact" value={editFields.emergencyContact ?? ''} onChange={(e) => updateEditField('emergencyContact', e.target.value)} />
              <Input label="Height" value={editFields.height ?? ''} onChange={(e) => updateEditField('height', e.target.value)} />
              <Input label="Weight" value={editFields.weight ?? ''} onChange={(e) => updateEditField('weight', e.target.value)} />
              <Input label="Latitude" type="number" value={editFields.lat ?? ''} onChange={(e) => updateEditField('lat', e.target.value)} />
              <Input label="Longitude" type="number" value={editFields.lng ?? ''} onChange={(e) => updateEditField('lng', e.target.value)} />
            </div>
            <Textarea label="Allergies" helperText="Comma separated" value={editFields.allergies ?? ''} onChange={(e) => updateEditField('allergies', e.target.value)} />
            <Textarea label="Medications" helperText="Comma separated" value={editFields.medications ?? ''} onChange={(e) => updateEditField('medications', e.target.value)} />
            <Textarea label="Known diseases" helperText="Comma separated" value={editFields.knownDiseases ?? ''} onChange={(e) => updateEditField('knownDiseases', e.target.value)} />
            <Textarea label="Past medications" helperText="Comma separated" value={editFields.pastMedications ?? ''} onChange={(e) => updateEditField('pastMedications', e.target.value)} />
          </>
        )}

        {target?.kind === 'user' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Email" type="email" value={editFields.email ?? ''} onChange={(e) => updateEditField('email', e.target.value)} />
            <Select label="Role" options={roleOptions} value={editFields.role ?? 'patient'} onChange={(e) => updateEditField('role', e.target.value)} />
          </div>
        )}

        <div className="sticky bottom-0 -mx-6 flex justify-end gap-2 border-t px-6 pt-4 pb-1 backdrop-blur-md" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={savingEdit}>Save changes</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [processing, setProcessing] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<EditableItem | null>(null)

  const { data: pending, loading: pLoad } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'pending')])
  const { data: approved, loading: aLoad } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'approved')])
  const { data: doctors, loading: dLoad } = useFirestoreCollection<Doctor>('doctors', [])
  const { data: patients, loading: patLoad } = useFirestoreCollection<Patient>('patients', [])
  const { data: users, loading: uLoad } = useFirestoreCollection<User>('users', [])
  const adminPatients = useMemo(() => {
    const patientsById = new Map<string, AdminPatient>()
    const usersById = new Map(users.map((user) => [user.id, user]))
    const hospitalIds = new Set([...pending, ...approved].map((hospital) => hospital.id))
    const doctorIds = new Set(doctors.map((doctor) => doctor.id))

    patients.forEach((profile) => {
      const user = usersById.get(profile.id)
      const profileEmail = (profile as Patient & { email?: string }).email
      patientsById.set(profile.id, {
        ...profile,
        id: profile.id,
        uid: profile.uid ?? profile.id,
        email: profileEmail ?? user?.email,
        hasProfile: true,
      })
    })

    users.forEach((user) => {
      const hasProviderRecord = hospitalIds.has(user.id) || doctorIds.has(user.id)
      const isPatientAccount = user.role === 'patient' || (!hasProviderRecord && user.role !== 'admin')
      if (!isPatientAccount || patientsById.has(user.id)) return

      patientsById.set(user.id, {
        id: user.id,
        uid: user.id,
        email: user.email,
        hasProfile: false,
      })
    })

    return Array.from(patientsById.values())
  }, [approved, doctors, patients, pending, users])

  const statsLoading = pLoad || aLoad || dLoad || patLoad || uLoad

  const tabs: { value: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { value: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} strokeWidth={1.75} /> },
    { value: 'hospitals', label: 'Hospitals', icon: <Building2 size={15} strokeWidth={1.75} />, count: (pending.length + approved.length) },
    { value: 'doctors', label: 'Doctors', icon: <Stethoscope size={15} strokeWidth={1.75} />, count: doctors.length },
    { value: 'patients', label: 'Patients', icon: <Users size={15} strokeWidth={1.75} />, count: adminPatients.length },
    { value: 'users', label: 'Users', icon: <Users size={15} strokeWidth={1.75} />, count: users.length },
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
                patients={adminPatients}
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
                onEdit={(hospital) => setEditTarget({ kind: 'hospital', item: hospital })}
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
              <DoctorsPanel
                doctors={doctors as (Doctor & { id: string })[]}
                onEdit={(doctor) => setEditTarget({ kind: 'doctor', item: doctor })}
              />
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
              patients={adminPatients}
              loading={patLoad || uLoad}
              onEdit={(patient) => setEditTarget({ kind: 'patient', item: patient })}
            />
          </motion.div>
        )}

        {tab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <UsersPanel
              users={users as (User & { id: string })[]}
              loading={uLoad}
              onEdit={(user) => setEditTarget({ kind: 'user', item: user })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AdminEditModal target={editTarget} onClose={() => setEditTarget(null)} />
    </div>
  )
}
