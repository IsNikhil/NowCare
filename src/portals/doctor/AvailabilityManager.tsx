import { useState, useMemo } from 'react'
import { collection, addDoc, deleteDoc, doc, Timestamp, where, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { toast } from 'sonner'
import { formatDate, formatTime } from '../../lib/format'
import type { DoctorSlot } from '../../types'

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

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
]

const REPEAT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
]

function generateSlotDates(
  baseDate: string,
  startTime: string,
  endTime: string,
  durationMin: number,
  repeat: string,
  repeatCount: number
): Date[] {
  const allDates: Date[] = []

  for (let i = 0; i < (repeat === 'none' ? 1 : repeatCount); i++) {
    const base = new Date(baseDate + 'T00:00:00')
    if (repeat === 'daily') base.setDate(base.getDate() + i)
    if (repeat === 'weekly') base.setDate(base.getDate() + i * 7)

    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const start = new Date(base)
    start.setHours(sh, sm, 0, 0)
    const end = new Date(base)
    end.setHours(eh, em, 0, 0)

    let cur = new Date(start)
    while (cur.getTime() + durationMin * 60000 <= end.getTime()) {
      allDates.push(new Date(cur))
      cur = new Date(cur.getTime() + durationMin * 60000)
    }
  }

  return allDates
}

function slotPreview(
  date: string,
  startTime: string,
  endTime: string,
  durationMin: number,
  repeat: string,
  repeatCount: number
): string {
  if (!date || !startTime || !endTime || startTime >= endTime) return ''

  const perDay = generateSlotDates(date, startTime, endTime, durationMin, 'none', 1).length
  if (perDay === 0) return ''

  const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (repeat === 'none') {
    return `Will add ${perDay} slot${perDay !== 1 ? 's' : ''} on ${dayLabel}.`
  }
  const total = perDay * repeatCount
  const unit = repeat === 'daily' ? 'day' : 'week'
  return `Will add ${total} slots over ${repeatCount} ${unit}${repeatCount !== 1 ? 's' : ''} (${perDay} per ${unit}).`
}

export default function AvailabilityManager() {
  const { user } = useAuth()
  

  const now = useMemo(() => new Date(), [])

  const { data: slots, loading } = useFirestoreCollection<DoctorSlot>(
    'doctor_slots',
    user
      ? [where('doctorId', '==', user.uid), where('datetime', '>=', Timestamp.fromDate(now)), orderBy('datetime', 'asc')]
      : []
  )

  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [duration, setDuration] = useState('30')
  const [repeat, setRepeat] = useState('none')
  const [repeatCount, setRepeatCount] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const preview = slotPreview(date, startTime, endTime, Number(duration), repeat, repeatCount)

  async function handleSubmit() {
    if (!user || !date || !startTime || !endTime || startTime >= endTime) return
    setSubmitting(true)
    try {
      const dates = generateSlotDates(date, startTime, endTime, Number(duration), repeat, repeatCount)
      if (dates.length === 0) {
        toast.error('No slots generated. Check your start and end times.')
        return
      }
      await Promise.all(
        dates.map((d) =>
          addDoc(collection(db, 'doctor_slots'), {
            doctorId: user.uid,
            datetime: Timestamp.fromDate(d),
            available: true,
            status: 'open',
            durationMinutes: Number(duration),
          })
        )
      )
      toast.success(`Added ${dates.length} slot${dates.length !== 1 ? 's' : ''}.`)
      setDate('')
      setStartTime('09:00')
      setEndTime('17:00')
      setDuration('30')
      setRepeat('none')
      setRepeatCount(1)
    } catch {
      toast.error('Could not add slots.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'doctor_slots', id))
      toast.success('Slot removed.')
      setDeleteId(null)
    } catch {
      toast.error('Could not remove slot.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Availability" subtitle="Manage your appointment slots." />

      <div className="grid md:grid-cols-2 gap-6">
        <Card level={2} padding="sm">
          <h2 className="text-base font-semibold text-ink-800 mb-4">Add availability</h2>

          <div className="flex flex-col gap-3">
            <div className="w-3/5">
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Start time"
                options={TIME_OPTIONS}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Select
                label="End time"
                options={TIME_OPTIONS.filter((o) => o.value > startTime)}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Appointment duration"
                options={DURATION_OPTIONS}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <Select
                label="Repeat"
                options={REPEAT_OPTIONS}
                value={repeat}
                onChange={(e) => {
                  setRepeat(e.target.value)
                  setRepeatCount(1)
                }}
              />
            </div>

            {repeat === 'daily' && (
              <Input
                label="For how many days?"
                type="number"
                value={String(repeatCount)}
                onChange={(e) => setRepeatCount(Math.min(14, Math.max(1, Number(e.target.value))))}
                min={1}
                max={14}
              />
            )}

            {repeat === 'weekly' && (
              <Input
                label="For how many weeks?"
                type="number"
                value={String(repeatCount)}
                onChange={(e) => setRepeatCount(Math.min(8, Math.max(1, Number(e.target.value))))}
                min={1}
                max={8}
              />
            )}

            {preview && (
              <p className="text-xs text-slate-500">{preview}</p>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting || !date || !preview}
              >
                Add slots
              </Button>
            </div>
          </div>
        </Card>

        <Card level={1} padding="sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink-800">Upcoming slots</h2>
            {!loading && (
              <span className="text-xs text-slate-500">{slots.length} upcoming</span>
            )}
          </div>

          {loading && <SkeletonCard />}

          {!loading && slots.length === 0 && (
            <p className="text-sm text-slate-400 py-2">No upcoming slots. Add availability on the left.</p>
          )}

          {!loading && slots.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-white/30">
                    <th className="text-left pb-2 font-semibold">Date</th>
                    <th className="text-left pb-2 font-semibold">Time</th>
                    <th className="text-left pb-2 font-semibold">Min</th>
                    <th className="text-left pb-2 font-semibold">Status</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => {
                    const isOpen = slot.available !== false && slot.status !== 'reserved'
                    return (
                      <tr key={slot.id} className="border-b border-white/20 last:border-0">
                        <td className="py-2 text-ink-800">{formatDate(slot.datetime)}</td>
                        <td className="py-2 text-slate-500">{formatTime(slot.datetime)}</td>
                        <td className="py-2 text-slate-500">{slot.durationMinutes ?? '-'}</td>
                        <td className="py-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-500'}`}>
                            {isOpen ? 'Open' : 'Reserved'}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          {isOpen && (
                            <button
                              onClick={() => setDeleteId(slot.id)}
                              className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Remove slot"
        maxWidth="sm"
      >
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to remove this slot? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)} fullWidth>Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)} fullWidth>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}
