import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { where, orderBy, Timestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import {
  CalendarDays, Clock, Users, Sparkles, AlertCircle, ChevronRight,
  CheckCircle, Star, Activity, TrendingUp, Zap,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { VerificationBadge } from '../../components/providers/VerificationBadge'
import { generateDoctorInsights } from '../../services/gemini'
import { formatDate, formatTime, formatRelativeTime } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import type { Doctor, DoctorSlot } from '../../types'

function StatCard({ label, value, sublabel, color, icon }: {
  label: string
  value: string | number
  sublabel?: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        {sublabel && (
          <span className="text-xs font-semibold" style={{ color: 'var(--accent-green)' }}>
            {sublabel}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold tracking-tight font-mono" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </GlassCard>
  )
}

function SlotRow({ slot }: { slot: DoctorSlot }) {
  const isPast = slot.datetime.toDate() < new Date()
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: slot.status === 'reserved' ? 'var(--accent-teal)' : 'var(--border-subtle)' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {formatTime(slot.datetime)}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatDate(slot.datetime)} · {slot.durationMinutes ?? 30} min
        </p>
      </div>
      <Badge variant={slot.status === 'reserved' ? 'teal' : 'default'}>
        {slot.status === 'reserved' ? 'Booked' : 'Open'}
      </Badge>
    </div>
  )
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [insights, setInsights] = useState<string[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)

  const { data: doctor, loading: docLoading } = useFirestoreDoc<Doctor>(
    user ? `doctors/${user.uid}` : ''
  )

  const now = useMemo(() => new Date(), [])
  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])
  const todayEnd = useMemo(() => {
    const d = new Date(); d.setHours(23, 59, 59, 999); return d
  }, [])

  const { data: allSlots, loading: slotsLoading } = useFirestoreCollection<DoctorSlot>(
    'doctor_slots',
    user ? [where('doctorId', '==', user.uid), orderBy('datetime', 'asc')] : []
  )

  const todaySlots = useMemo(() =>
    allSlots.filter((s) => {
      const d = s.datetime.toDate()
      return d >= todayStart && d <= todayEnd
    }), [allSlots, todayStart, todayEnd])

  const upcomingSlots = useMemo(() =>
    allSlots.filter((s) => s.datetime.toDate() >= now && s.status === 'reserved')
      .slice(0, 5), [allSlots, now])

  const openSlots = useMemo(() =>
    allSlots.filter((s) => s.datetime.toDate() >= now && s.available), [allSlots, now])

  const totalBookedThisWeek = useMemo(() => {
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    return allSlots.filter((s) => s.datetime.toDate() >= weekStart && s.status === 'reserved').length
  }, [allSlots])

  const loading = docLoading || slotsLoading

  const doctorName =
    doctor?.npi_data?.name ??
    doctor?.displayName ??
    doctor?.name ??
    user?.email?.split('@')[0] ??
    'Provider'

  useEffect(() => {
    if (!doctor || !doctor.verified || loadingInsights || insights.length > 0) return
    setLoadingInsights(true)
    const reasons = upcomingSlots.map((s) => 'Patient visit').concat(['Consultation', 'Follow-up'])
    generateDoctorInsights(doctorName, doctor.specialty ?? 'General', reasons)
      .then(setInsights)
      .finally(() => setLoadingInsights(false))
  }, [doctor?.verified])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <SkeletonCard lines={2} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeRise}>
        <GlassCard variant="elevated" className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {doctorName}
                </h1>
                {doctor?.verified && doctor.badge && (
                  <VerificationBadge badge={doctor.badge} />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {doctor?.specialty && (
                  <Badge variant="teal">{doctor.specialty}</Badge>
                )}
                {doctor?.credentials && (
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{doctor.credentials}</span>
                )}
                {doctor?.npi && (
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>NPI: {doctor.npi}</span>
                )}
              </div>
              {doctor?.avgRating && (
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      strokeWidth={1.75}
                      fill={i < Math.round(doctor.avgRating!) ? 'var(--accent-amber)' : 'transparent'}
                      style={{ color: 'var(--accent-amber)' }}
                    />
                  ))}
                  <span className="text-xs font-semibold ml-1" style={{ color: 'var(--text-secondary)' }}>
                    {doctor.avgRating.toFixed(1)}
                  </span>
                  {doctor.totalReviews && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({doctor.totalReviews})</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Link to="/doctor/availability">
                <Button size="sm" variant="secondary">
                  <CalendarDays size={14} strokeWidth={1.75} />
                  Manage slots
                </Button>
              </Link>
            </div>
          </div>

          {!doctor?.verified && (
            <div className="mt-4 flex items-start gap-3 rounded-xl p-3" style={{ background: 'hsla(38,90%,65%,0.08)', border: '1px solid hsla(38,90%,65%,0.2)' }}>
              <AlertCircle size={16} strokeWidth={1.75} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 1 }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>NPI not yet verified</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Verify your NPI to be discoverable by patients searching for care.
                </p>
              </div>
              <Link to="/doctor/verify">
                <Button variant="secondary" size="sm">Verify NPI</Button>
              </Link>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={fadeRise} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Upcoming appts"
          value={upcomingSlots.length}
          color="var(--accent-teal)"
          icon={<CalendarDays size={16} strokeWidth={1.75} />}
        />
        <StatCard
          label="Open slots"
          value={openSlots.length}
          sublabel={openSlots.length > 0 ? '+' : undefined}
          color="var(--accent-violet)"
          icon={<Clock size={16} strokeWidth={1.75} />}
        />
        <StatCard
          label="Booked this week"
          value={totalBookedThisWeek}
          color="var(--accent-amber)"
          icon={<TrendingUp size={16} strokeWidth={1.75} />}
        />
        <StatCard
          label="Today's schedule"
          value={todaySlots.length}
          color="var(--accent-coral)"
          icon={<Activity size={16} strokeWidth={1.75} />}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's schedule */}
        <motion.div variants={fadeRise}>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
                  <Activity size={14} strokeWidth={1.75} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Today's Schedule
                </h2>
              </div>
              <Badge variant="teal" dot>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Badge>
            </div>

            {todaySlots.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No slots scheduled today.</p>
                <Link to="/doctor/availability" className="text-xs font-semibold hover:underline mt-1 inline-block" style={{ color: 'var(--accent-teal)' }}>
                  Add availability
                </Link>
              </div>
            ) : (
              <div>
                {todaySlots.map((slot) => <SlotRow key={slot.id} slot={slot} />)}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Upcoming appointments */}
        <motion.div variants={fadeRise}>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsla(265,70%,65%,0.1)', color: 'var(--accent-violet)' }}>
                  <Users size={14} strokeWidth={1.75} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Upcoming</h2>
              </div>
              <Link to="/doctor/availability" className="text-xs font-semibold hover:underline" style={{ color: 'var(--accent-teal)' }}>
                View all
              </Link>
            </div>

            {upcomingSlots.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming bookings yet.</p>
              </div>
            ) : (
              <div>
                {upcomingSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-tint)', color: 'var(--accent-teal)' }}>
                      <CalendarDays size={14} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(slot.datetime)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatTime(slot.datetime)} · {slot.durationMinutes ?? 30} min
                      </p>
                    </div>
                    <ChevronRight size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* AI Insights */}
      {doctor?.verified && (
        <motion.div variants={fadeRise}>
          <GlassCard variant="elevated" className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsla(38,90%,65%,0.12)', color: 'var(--accent-amber)' }}>
                <Sparkles size={14} strokeWidth={1.75} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Practice Insights
              </h2>
              <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
                AI
              </span>
            </div>

            {loadingInsights ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-4 rounded-lg skeleton" style={{ width: `${60 + i * 15}%` }} />
                ))}
              </div>
            ) : insights.length > 0 ? (
              <ul className="space-y-3">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}
                    >
                      <Zap size={10} strokeWidth={2} />
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {insight}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Insights will appear once you have appointment history.
              </p>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Quick links */}
      <motion.div variants={fadeRise} className="grid grid-cols-2 gap-3">
        <Link to="/doctor/availability">
          <GlassCard variant="interactive" className="p-4 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
                <CalendarDays size={18} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Availability</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage open slots</p>
              </div>
              <ChevronRight size={14} strokeWidth={1.75} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
            </div>
          </GlassCard>
        </Link>
        <Link to="/doctor/verify">
          <GlassCard variant="interactive" className="p-4 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'hsla(265,70%,65%,0.1)', color: 'var(--accent-violet)' }}>
                <CheckCircle size={18} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Verification</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>NPI + credentials</p>
              </div>
              <ChevronRight size={14} strokeWidth={1.75} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
            </div>
          </GlassCard>
        </Link>
      </motion.div>
    </motion.div>
  )
}
