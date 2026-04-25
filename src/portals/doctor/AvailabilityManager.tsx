import { useState, useMemo } from 'react'
import { collection, addDoc, deleteDoc, doc, Timestamp, where, orderBy } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Plus, Trash2, CalendarDays, Clock } from 'lucide-react'
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
import type { DoctorSlot } from '../../types'

const TIME_OPTIONS = (() => {
  const opts: { value: string; label: string }[] = []
  for (let h = 6; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      opts.push({
        value: `${hh}:${mm}`,
        label: new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      })
    }
  }
  return opts
})()

function generateSlotDates(baseDate: string, startTime: string, endTime: string, durationMin: number, repeat: string, repeatCount: number): Date[] {
  const allDates: Date[] = []
  for (let i = 0; i < (repeat === 'none' ? 1 : repeatCount); i++) {
    const base = new Date(baseDate + 'T00:00:00')
    if (repeat === 'daily') base.setDate(base.getDate() + i)
    if (repeat === 'weekly') base.setDate(base.getDate() + i * 7)
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const start = new Date(base); start.setHours(sh, sm, 0, 0)
    const end = new Date(base); end.setHours(eh, em, 0, 0)
    let cur = new Date(start)
    while (cur.getTime() + durationMin * 60000 <= end.getTime()) {
      allDates.push(new Date(cur))
      cur = new Date(cur.getTime() + durationMin * 60000)
    }
  }
  return allDates
}

function slotPreview(date: string, startTime: string, endTime: string, durationMin: number, repeat: string, repeatCount: number): string {
  if (!date || !startTime || !endTime || startTime >= endTime) return ''
  const perDay = generateSlotDates(date, startTime, endTime, durationMin, 'none', 1).length
  if (perDay === 0) return ''
  const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  if (repeat === 'none') return `${perDay} slot${perDay !== 1 ? 's' : ''} on ${dayLabel}`
  const total = perDay * repeatCount
  const unit = repeat === 'daily' ? 'day' : 'week'
  return `${total} slots over ${repeatCount} ${unit}${repeatCount !== 1 ? 's' : ''} (${perDay}/day)`
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{children}</label>
}

function NativeSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-xl text-sm outline-none border transition-all"
      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
    >
      {children}
    </select>
  )
}

export default function AvailabilityManager() {
  const { user } = useAuth()
  const now = useMemo(() => new Date(), [])

  const { data: slots, loading } = useFirestoreCollection<DoctorSlot>(
    'doctor_slots',
    user ? [where('doctorId', '==', user.uid), where('datetime', '>=', Timestamp.fromDate(now)), orderBy('datetime', 'asc')] : []
  )

  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [duration, setDuration] = useState('30')
  const [repeat, setRepeat] = useState('none')
  const [repeatCount, setRepeatCount] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const preview = slotPreview(date, startTime, endTime, Number(duration), repeat, repeatCount)

  async function handleSubmit() {
    if (!user || !date || !startTime || !endTime || startTime >= endTime) return
    setSubmitting(true)
    try {
      const dates = generateSlotDates(date, startTime, endTime, Number(duration), repeat, repeatCount)
      if (dates.length === 0) { toast.error('No slots generated. Check times.'); return }
      await Promise.all(dates.map((d) => addDoc(collection(db, 'doctor_slots'), {
        doctorId: user.uid,
        datetime: Timestamp.fromDate(d),
        available: true,
        status: 'open',
        durationMinutes: Number(duration),
      })))
      toast.success(`Added ${dates.length} slot${dates.length !== 1 ? 's' : ''}.`)
      setDate(''); setStartTime('09:00'); setEndTime('17:00'); setDuration('30'); setRepeat('none'); setRepeatCount(1)
    } catch { toast.error('Could not add slots.') }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, 'doctor_slots', id))
      toast.success('Slot removed.')
    } catch { toast.error('Could not remove slot.') }
    finally { setDeletingId(null) }
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="mx-auto max-w-4xl space-y-6 overflow-hidden">
      <motion.div variants={fadeRise}>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>Availability</h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Add appointment slots for patients to book.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Add form */}
        <motion.div variants={fadeRise}>
          <GlassCard variant="elevated" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
                <Plus size={14} strokeWidth={2} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Add availability</h2>
            </div>

            <div className="space-y-3">
              <div>
                <FieldLabel>Date</FieldLabel>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm outline-none border transition-all"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Start time</FieldLabel>
                  <NativeSelect value={startTime} onChange={setStartTime}>
                    {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <FieldLabel>End time</FieldLabel>
                  <NativeSelect value={endTime} onChange={setEndTime}>
                    {TIME_OPTIONS.filter((o) => o.value > startTime).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </NativeSelect>
                </div>
              </div>

              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Duration</FieldLabel>
                  <NativeSelect value={duration} onChange={setDuration}>
                    {[['15','15 min'],['30','30 min'],['45','45 min'],['60','60 min']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <FieldLabel>Repeat</FieldLabel>
                  <NativeSelect value={repeat} onChange={(v) => { setRepeat(v); setRepeatCount(1) }}>
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </NativeSelect>
                </div>
              </div>

              {(repeat === 'daily' || repeat === 'weekly') && (
                <div>
                  <FieldLabel>Repeat for how many {repeat === 'daily' ? 'days' : 'weeks'}?</FieldLabel>
                  <input
                    type="number"
                    value={repeatCount}
                    min={1}
                    max={repeat === 'daily' ? 14 : 8}
                    onChange={(e) => setRepeatCount(Math.min(repeat === 'daily' ? 14 : 8, Math.max(1, Number(e.target.value))))}
                    className="w-full h-10 px-3 rounded-xl text-sm outline-none border transition-all"
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}

              {preview && (
                <div className="rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
                  {preview}
                </div>
              )}

              <Button className="w-full" onClick={handleSubmit} loading={submitting} disabled={submitting || !date || !preview}>
                <CalendarDays size={14} strokeWidth={1.75} />
                Add slots
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Slots list */}
        <motion.div variants={fadeRise}>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                  <Clock size={14} strokeWidth={1.75} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Upcoming slots</h2>
              </div>
              {!loading && <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{slots.length}</span>}
            </div>

            {loading && <SkeletonList count={4} />}

            {!loading && slots.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming slots. Add availability above.</p>
              </div>
            )}

            {!loading && slots.length > 0 && (
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {slots.map((slot) => {
                  const isOpen = slot.available !== false && slot.status !== 'reserved'
                  return (
                    <div key={slot.id} className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl transition-colors sm:flex-nowrap" style={{ background: 'var(--surface-tint)' }}>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isOpen ? 'var(--accent-teal)' : 'var(--accent-violet)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(slot.datetime)} · {formatTime(slot.datetime)}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{slot.durationMinutes ?? 30} min</p>
                      </div>
                      <Badge variant={isOpen ? 'teal' : 'default'}>{isOpen ? 'Open' : 'Booked'}</Badge>
                      {isOpen && (
                        <button
                          onClick={() => handleDelete(slot.id!)}
                          disabled={deletingId === slot.id}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--accent-coral)]/10 shrink-0"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 size={11} strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  )
}
