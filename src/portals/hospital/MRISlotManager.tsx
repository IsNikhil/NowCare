import { useState } from 'react'
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp, where, orderBy } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Trash2, ToggleLeft, ToggleRight, Plus, Scan } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SkeletonList } from '../../components/ui/Skeleton'
import { formatDate, formatTime } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import type { MRISlot, ScanType } from '../../types'
import { SCAN_TYPES } from '../../lib/constants'

const TIME_OPTIONS = (() => {
  const opts: { value: string; label: string }[] = []
  for (let h = 6; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      opts.push({ value: `${hh}:${mm}`, label: new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) })
    }
  }
  return opts
})()

const SCAN_COLORS: Record<string, string> = {
  MRI: 'var(--accent-violet)',
  CT: 'var(--accent-teal)',
  'X-Ray': 'var(--accent-amber)',
  Ultrasound: 'var(--accent-green)',
}

function NativeSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-xl text-sm outline-none border"
      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
    >
      {children}
    </select>
  )
}

export default function MRISlotManagerPage() {
  const { user } = useAuth()

  const { data: slots, loading } = useFirestoreCollection<MRISlot>(
    'mri_slots',
    user ? [where('hospitalId', '==', user.uid), orderBy('datetime', 'asc')] : []
  )

  const [scanType, setScanType] = useState<ScanType | ''>('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('08:00')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd() {
    if (!user || !date || !time || !scanType) return
    setSubmitting(true)
    try {
      const dt = new Date(`${date}T${time}:00`)
      await addDoc(collection(db, 'mri_slots'), {
        hospitalId: user.uid,
        datetime: Timestamp.fromDate(dt),
        type: scanType,
        available: true,
        createdAt: serverTimestamp(),
      })
      toast.success('Slot added.')
      setDate(''); setTime('08:00'); setScanType('')
    } catch { toast.error('Could not add slot.') }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'mri_slots', id))
      toast.success('Slot removed.')
    } catch { toast.error('Could not remove slot.') }
  }

  async function toggleAvailability(slot: MRISlot & { id: string }) {
    try {
      await updateDoc(doc(db, 'mri_slots', slot.id), { available: !slot.available, updatedAt: serverTimestamp() })
    } catch { toast.error('Could not update slot.') }
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-6">
      <motion.div variants={fadeRise}>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>Scan Slots</h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Manage MRI, CT, X-Ray, and Ultrasound availability.</p>
      </motion.div>

      {/* Add form */}
      <motion.div variants={fadeRise}>
        <GlassCard variant="elevated" className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
              <Plus size={14} strokeWidth={2} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Add scan slot</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Scan type</label>
              <NativeSelect value={scanType} onChange={(v) => { setScanType(v as ScanType | ''); setDate('') }}>
                <option value="">Select type...</option>
                {SCAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </NativeSelect>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Date</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                disabled={!scanType}
                className="w-full h-10 px-3 rounded-xl text-sm outline-none border"
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', opacity: !scanType ? 0.5 : 1 }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Time</label>
              <NativeSelect value={time} onChange={setTime}>
                {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </NativeSelect>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button onClick={handleAdd} loading={submitting} disabled={submitting || !date || !scanType}>
              <Scan size={14} strokeWidth={1.75} />
              Add slot
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Slots list */}
      <motion.div variants={fadeRise}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>All slots</h2>
          {!loading && <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{slots.filter(s => s.available).length}/{slots.length} open</span>}
        </div>

        {loading && <SkeletonList count={5} />}

        {!loading && slots.length === 0 && (
          <GlassCard className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
              <Scan size={22} strokeWidth={1.25} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No scan slots yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add the first slot above.</p>
          </GlassCard>
        )}

        {!loading && slots.length > 0 && (
          <GlassCard>
            <div className="divide-y" style={{ ['--tw-divide-opacity' as string]: 1 }}>
              {slots.map((slot) => {
                const color = SCAN_COLORS[slot.type] ?? 'var(--text-muted)'
                return (
                  <div key={slot.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>
                      <Scan size={13} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {slot.type}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(slot.datetime)} · {formatTime(slot.datetime)}
                      </p>
                    </div>
                    <Badge variant={slot.available ? 'teal' : 'default'}>
                      {slot.available ? 'Open' : 'Closed'}
                    </Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleAvailability(slot)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-tint)]"
                        style={{ color: slot.available ? 'var(--accent-teal)' : 'var(--text-muted)' }}
                        title={slot.available ? 'Mark unavailable' : 'Mark available'}
                      >
                        {slot.available ? <ToggleRight size={15} strokeWidth={1.75} /> : <ToggleLeft size={15} strokeWidth={1.75} />}
                      </button>
                      <button
                        onClick={() => handleDelete(slot.id!)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-tint)]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={13} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        )}
      </motion.div>
    </motion.div>
  )
}
