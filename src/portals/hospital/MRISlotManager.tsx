import { useState } from 'react'
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp, where, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { toast } from 'sonner'
import { formatDate, formatTime } from '../../lib/format'
import { Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { MRISlot, ScanType } from '../../types'
import { SCAN_TYPES } from '../../lib/constants'

const TIME_OPTIONS = (() => {
  const opts: { value: string; label: string }[] = []
  for (let h = 6; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const label = new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      opts.push({ value: `${hh}:${mm}`, label })
    }
  }
  return opts
})()

const scanBadge: Record<ScanType, 'teal' | 'info' | 'warning' | 'default'> = {
  MRI: 'teal',
  'CT Scan': 'info',
  'X-Ray': 'warning',
  Ultrasound: 'default',
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
  const [addError, setAddError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleAdd() {
    if (!user || !date || !time || !scanType) return
    setSubmitting(true)
    setAddError(null)
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
      setDate('')
      setTime('08:00')
      setScanType('')
    } catch (err) {
      console.error('Scan slot add failed:', err)
      const msg = err instanceof Error ? err.message : 'Could not add slot.'
      setAddError(msg)
      toast.error('Could not add slot.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'mri_slots', id))
      toast.success('Slot removed.')
      setDeleteId(null)
    } catch {
      toast.error('Could not remove slot.')
    }
  }

  async function toggleAvailability(slot: MRISlot & { id: string }) {
    try {
      await updateDoc(doc(db, 'mri_slots', slot.id), {
        available: !slot.available,
        updatedAt: serverTimestamp(),
      })
    } catch {
      toast.error('Could not update slot.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Scan slots" subtitle="Manage MRI, CT, X-Ray, and Ultrasound availability." />

      <Card level={2} padding="sm" className="mb-6">
        <h2 className="text-base font-semibold text-ink-800 mb-4">Add scan slot</h2>
        <div className="flex flex-col gap-4">
          <Select
            label="Scan type"
            options={[
              { value: '', label: 'Select scan type...' },
              ...SCAN_TYPES.map((t) => ({ value: t, label: t })),
            ]}
            value={scanType}
            onChange={(e) => {
              setScanType(e.target.value as ScanType | '')
              setDate('')
              setTime('08:00')
            }}
          />

          {scanType && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <Select
                label="Time"
                options={TIME_OPTIONS}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          )}

          {scanType && (
            <div className="flex justify-end">
              <Button
                onClick={handleAdd}
                loading={submitting}
                disabled={submitting || !date}
              >
                Add slot
              </Button>
            </div>
          )}
        </div>
        {addError && (
          <p className="text-sm text-rose-500 mt-3">{addError}</p>
        )}
      </Card>

      <h2 className="text-base font-semibold text-ink-800 mb-4">Scan slots</h2>

      {loading && <SkeletonCard />}

      {!loading && slots.length === 0 && (
        <p className="text-sm text-slate-400 py-4">No scan slots added yet.</p>
      )}

      {!loading && slots.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/30">
                <th className="text-left pb-2 font-semibold">Date</th>
                <th className="text-left pb-2 font-semibold">Time</th>
                <th className="text-left pb-2 font-semibold">Type</th>
                <th className="text-left pb-2 font-semibold">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id} className="border-b border-white/20 last:border-0">
                  <td className="py-2 text-ink-800">{formatDate(slot.datetime)}</td>
                  <td className="py-2 text-slate-500">{formatTime(slot.datetime)}</td>
                  <td className="py-2">
                    <Badge variant={scanBadge[slot.type]}>{slot.type}</Badge>
                  </td>
                  <td className="py-2">
                    <span className={`text-xs font-semibold ${slot.available ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {slot.available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => toggleAvailability(slot)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-teal-500 hover:glass-1 transition-all"
                        aria-label={slot.available ? 'Mark unavailable' : 'Mark available'}
                        title={slot.available ? 'Mark unavailable' : 'Mark available'}
                      >
                        {slot.available
                          ? <ToggleRight size={16} strokeWidth={1.75} />
                          : <ToggleLeft size={16} strokeWidth={1.75} />
                        }
                      </button>
                      <button
                        onClick={() => setDeleteId(slot.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:glass-1 transition-all"
                        aria-label="Delete slot"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Remove slot"
        maxWidth="sm"
      >
        <p className="text-sm text-slate-600 mb-6">Are you sure you want to remove this scan slot?</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)} fullWidth>Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)} fullWidth>Remove</Button>
        </div>
      </Modal>
    </div>
  )
}
