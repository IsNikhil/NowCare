import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import {
  Activity, HardDrive, Phone, MapPin, AlertCircle,
  Clock, TrendingUp, Scan, Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { formatDateTime, formatRelativeTime } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import type { Hospital, MRISlot, ERStatus } from '../../types'

const ER_STATUS_CONFIG: Record<ERStatus, {
  label: string
  color: string
  dotColor: string
  bg: string
  border: string
  selectedBg: string
  description: string
}> = {
  low: {
    label: 'Low',
    color: '#22c55e',
    dotColor: '#22c55e',
    bg: 'hsla(142,70%,45%,0.08)',
    border: 'hsla(142,70%,45%,0.25)',
    selectedBg: '#22c55e',
    description: 'Minimal wait, walk-ins welcome',
  },
  moderate: {
    label: 'Moderate',
    color: '#f59e0b',
    dotColor: '#f59e0b',
    bg: 'hsla(38,90%,55%,0.08)',
    border: 'hsla(38,90%,55%,0.25)',
    selectedBg: '#f59e0b',
    description: '30-60 min estimated wait',
  },
  high: {
    label: 'High',
    color: '#f97066',
    dotColor: '#f97066',
    bg: 'hsla(8,90%,65%,0.08)',
    border: 'hsla(8,90%,65%,0.25)',
    selectedBg: '#f97066',
    description: 'Long wait, critical cases only',
  },
  closed: {
    label: 'Closed',
    color: 'var(--text-muted)',
    dotColor: '#64748b',
    bg: 'var(--surface-tint)',
    border: 'var(--border-subtle)',
    selectedBg: '#475569',
    description: 'ER temporarily closed',
  },
}

export default function HospitalDashboard() {
  const { user } = useAuth()
  const [updatingER, setUpdatingER] = useState(false)

  const { data: hospital, loading: hospLoading } = useFirestoreDoc<Hospital>(
    user ? `hospitals/${user.uid}` : ''
  )

  const { data: slots, loading: slotsLoading } = useFirestoreCollection<MRISlot>(
    'mri_slots',
    user ? [where('hospitalId', '==', user.uid), orderBy('datetime', 'desc')] : []
  )

  const availableCount = slots.filter((s) => s.available).length
  const totalCount = slots.length

  const slotsByType = useMemo(() => {
    const groups: Record<string, { total: number; available: number }> = {}
    for (const slot of slots) {
      if (!groups[slot.type]) groups[slot.type] = { total: 0, available: 0 }
      groups[slot.type].total++
      if (slot.available) groups[slot.type].available++
    }
    return groups
  }, [slots])

  const recentSlots = slots.slice(0, 6)

  async function handleERStatusChange(status: ERStatus) {
    if (!user || status === hospital?.er_status || updatingER) return
    setUpdatingER(true)
    try {
      await updateDoc(doc(db, 'hospitals', user.uid), {
        er_status: status,
        er_updated: serverTimestamp(),
      })
      toast.success(`ER status updated to ${ER_STATUS_CONFIG[status].label}`)
    } catch {
      toast.error('Could not update ER status. Try again.')
    } finally {
      setUpdatingER(false)
    }
  }

  if (hospLoading || slotsLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <SkeletonCard lines={3} />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    )
  }

  const cms = hospital?.cms_data
  const benchmarks = hospital?.cms_benchmarks
  const currentStatus = hospital?.er_status ?? 'low'
  const currentCfg = ER_STATUS_CONFIG[currentStatus]

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl mx-auto space-y-6">
      {/* Hospital identity card */}
      <motion.div variants={fadeRise}>
        <GlassCard variant="elevated" className="p-5">
          {cms ? (
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {cms.facility_name ?? hospital?.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  {cms.hospital_type && (
                    <Badge variant="default">{cms.hospital_type}</Badge>
                  )}
                  {cms.overall_rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          strokeWidth={1.75}
                          fill={i < Number(cms.overall_rating ?? 0) ? 'var(--accent-amber)' : 'transparent'}
                          style={{ color: 'var(--accent-amber)' }}
                        />
                      ))}
                      <span className="text-xs font-semibold ml-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {cms.overall_rating}/5 CMS
                      </span>
                    </div>
                  )}
                </div>
                {(cms.address || cms.phone_number) && (
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    {cms.address && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <MapPin size={11} strokeWidth={1.75} />
                        {cms.address}, {cms.city}, {cms.state}
                      </div>
                    )}
                    {cms.phone_number && (
                      <a href={`tel:${cms.phone_number}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'var(--accent-teal)' }}>
                        <Phone size={11} strokeWidth={1.75} />
                        {cms.phone_number}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {benchmarks?.avgERWaitMinutes != null && (
                <div className="text-center shrink-0">
                  <p className="text-3xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {benchmarks.avgERWaitMinutes}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>avg ER wait (min)</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <AlertCircle size={14} strokeWidth={1.75} />
              Hospital profile will populate after admin approval.
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Quick stats */}
      <motion.div variants={fadeRise} className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <GlassCard className="p-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${currentCfg.color}18`, color: currentCfg.color }}>
            <Activity size={15} strokeWidth={1.75} />
          </div>
          <p className="text-xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>
            {currentCfg.label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Current ER status</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: 'hsla(265,70%,65%,0.1)', color: 'var(--accent-violet)' }}>
            <HardDrive size={15} strokeWidth={1.75} />
          </div>
          <p className="text-xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>
            {availableCount}<span className="text-sm font-normal text-[var(--text-muted)]">/{totalCount}</span>
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Scan slots open</p>
        </GlassCard>

        <GlassCard className="p-4 col-span-2 md:col-span-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
            <TrendingUp size={15} strokeWidth={1.75} />
          </div>
          <p className="text-xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>
            {Object.keys(slotsByType).length}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Modalities available</p>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ER Status toggle */}
        <motion.div variants={fadeRise}>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${currentCfg.color}18`, color: currentCfg.color }}>
                  <Activity size={14} strokeWidth={1.75} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>ER Status</h2>
              </div>
              {hospital?.er_updated && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatRelativeTime(hospital.er_updated)}
                </span>
              )}
            </div>

            {/* Current status display */}
            <div
              className="rounded-xl p-3 mb-4 flex items-center gap-3"
              style={{ background: currentCfg.bg, border: `1px solid ${currentCfg.border}` }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: currentCfg.dotColor, boxShadow: `0 0 6px ${currentCfg.dotColor}` }}
              />
              <div>
                <p className="text-sm font-bold" style={{ color: currentCfg.color }}>{currentCfg.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{currentCfg.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ER_STATUS_CONFIG) as [ERStatus, typeof ER_STATUS_CONFIG[ERStatus]][]).map(([status, cfg]) => {
                const isSelected = currentStatus === status
                return (
                  <button
                    key={status}
                    onClick={() => handleERStatusChange(status)}
                    disabled={updatingER}
                    className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2"
                    style={{
                      background: isSelected ? cfg.selectedBg : 'var(--surface-tint)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      border: isSelected ? `1px solid ${cfg.selectedBg}` : '1px solid var(--border-subtle)',
                      opacity: updatingER ? 0.6 : 1,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: isSelected ? 'rgba(255,255,255,0.8)' : cfg.dotColor }}
                    />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Imaging by modality */}
        <motion.div variants={fadeRise}>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsla(265,70%,65%,0.1)', color: 'var(--accent-violet)' }}>
                  <Scan size={14} strokeWidth={1.75} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Scan Slots</h2>
              </div>
              <Link to="/hospital/scans" className="text-xs font-semibold hover:underline" style={{ color: 'var(--accent-teal)' }}>
                Manage
              </Link>
            </div>

            {Object.keys(slotsByType).length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No imaging slots yet.</p>
                <Link to="/hospital/scans" className="text-xs font-semibold hover:underline mt-1 inline-block" style={{ color: 'var(--accent-teal)' }}>
                  Add slots
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(slotsByType).map(([type, counts]) => {
                  const pct = counts.total > 0 ? (counts.available / counts.total) * 100 : 0
                  const barColor = pct > 50 ? 'var(--accent-teal)' : pct > 20 ? 'var(--accent-amber)' : 'var(--accent-coral)'
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{type}</span>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {counts.available}/{counts.total}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: 'var(--border-subtle)' }}>
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: barColor }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Recent slot activity */}
      {recentSlots.length > 0 && (
        <motion.div variants={fadeRise}>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                  <Clock size={14} strokeWidth={1.75} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Slots</h2>
              </div>
              <Link to="/hospital/scans" className="text-xs font-semibold hover:underline" style={{ color: 'var(--accent-teal)' }}>
                View all
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recentSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--surface-tint)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: slot.available ? 'var(--accent-teal)' : 'var(--border-subtle)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{slot.type}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {formatDateTime(slot.datetime)}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold shrink-0"
                    style={{ color: slot.available ? 'var(--accent-teal)' : 'var(--text-muted)' }}
                  >
                    {slot.available ? 'Open' : 'Taken'}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  )
}
