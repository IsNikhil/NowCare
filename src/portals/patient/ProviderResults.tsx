import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { where, orderBy, doc, setDoc, updateDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import {
  MapPin, Phone, Clock, Star, Calendar, Filter,
  Building2, Stethoscope, ChevronDown, Mail, LocateFixed, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { ProviderMap } from '../../components/providers/ProviderMap'
import type { MapMarker } from '../../components/providers/ProviderMap'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { SkeletonList } from '../../components/ui/Skeleton'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { CARE_CATEGORY_CONFIG } from '../../lib/careCategories'
import { getSpecialtyLabel, SPECIALTIES } from '../../lib/specialties'
import { INSURANCE_CARRIERS } from '../../lib/insuranceCarriers'
import { doctorAvatars } from '../../lib/imageAssets'
import { formatDate, formatTime } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import type { Patient, Hospital, Doctor, DoctorSlot, WithId } from '../../types'

// Normalize specialty display name → SPECIALTIES id (handles old seed data stored as display names)
function toSpecialtyId(raw: string): string {
  if (!raw) return ''
  if (SPECIALTIES.some((s) => s.id === raw)) return raw
  const match = SPECIALTIES.find((s) => s.label.toLowerCase() === raw.toLowerCase())
  return match?.id ?? raw.toLowerCase().replace(/[\s/()&]+/g, '_').replace(/_+/g, '_')
}

// Normalize insurance string → INSURANCE_CARRIERS id (handles seed data with old/short ids)
const INSURANCE_ALIASES: Record<string, string> = {
  united_health: 'united_healthcare',
  unitedhealthcare: 'united_healthcare',
  uhc: 'united_healthcare',
  medicare: 'medicare_original',
  la_chip: 'chip',
  lacHIP: 'chip',
}
function toInsuranceId(raw: string): string {
  return INSURANCE_ALIASES[raw] ?? raw
}

function ERStatusBadge({ status }: { status?: string }) {
  if (!status) return null
  const configs: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'slate' }> = {
    low: { label: 'Low wait', color: 'success' },
    moderate: { label: 'Moderate wait', color: 'warning' },
    high: { label: 'High wait', color: 'danger' },
    closed: { label: 'ER Closed', color: 'slate' },
  }
  const cfg = configs[status]
  if (!cfg) return null
  return <Badge variant={cfg.color} dot>{cfg.label}</Badge>
}

function BookingSheet({ doctor, patientId, open, onClose }: {
  doctor: WithId<Doctor>; patientId: string; open: boolean; onClose: () => void
}) {
  const now = useMemo(() => new Date(), [])
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null)

  const { data: slots, loading } = useFirestoreCollection<DoctorSlot>(
    'doctor_slots',
    [where('doctorId', '==', doctor.id), where('available', '==', true),
      where('datetime', '>=', Timestamp.fromDate(now)), orderBy('datetime', 'asc')]
  )

  async function handleBook(slot: WithId<DoctorSlot>) {
    setBookingSlotId(slot.id)
    try {
      await updateDoc(doc(db, 'doctor_slots', slot.id), {
        available: false, status: 'reserved', patientId, bookedAt: serverTimestamp()
      })
      await addDoc(collection(db, 'care_journeys'), {
        patientId, selected_provider_id: doctor.id, provider_type: 'doctor',
        appointment_datetime: slot.datetime, createdAt: serverTimestamp()
      })
      toast.success(`Booked for ${formatDate(slot.datetime)} at ${formatTime(slot.datetime)}`)
      onClose()
    } catch {
      toast.error('Could not book. Please try again.')
    } finally {
      setBookingSlotId(null)
    }
  }

  const docName = doctor.npi_data?.name ?? doctor.name ?? doctor.displayName ?? 'Provider'

  return (
    <BottomSheet open={open} onClose={onClose} title={`Book with ${docName}`}>
      {loading && <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading slots...</div>}
      {!loading && slots.length === 0 && (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No open slots available. Contact the practice directly to book.</div>
      )}
      <div className="space-y-2">
        {slots.map((slot) => (
          <div key={slot.id} className="flex items-center justify-between p-4 rounded-xl border"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tint)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(slot.datetime)}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {formatTime(slot.datetime)}{slot.durationMinutes ? ` · ${slot.durationMinutes} min` : ''}
              </p>
            </div>
            <Button size="sm" loading={bookingSlotId === slot.id} disabled={bookingSlotId !== null}
              onClick={() => handleBook(slot)}>
              Book
            </Button>
          </div>
        ))}
      </div>
    </BottomSheet>
  )
}

// ─── Hospital card ────────────────────────────────────────────────────────────

function HospitalCard({ h }: { h: WithId<Hospital> }) {
  const name = h.cms_data?.facility_name ?? h.name
  const address = h.cms_data?.address
    ? `${h.cms_data.address}, ${h.cms_data.city ?? ''}, ${h.cms_data.state ?? ''}`
    : h.address ?? ''
  const phone = h.cms_data?.phone_number ?? h.phone ?? ''
  const email = h.email ?? ''

  return (
    <GlassCard variant="interactive" className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
          <Building2 size={18} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{name}</h3>
            <Badge variant="teal">CMS verified</Badge>
            <ERStatusBadge status={h.er_status} />
          </div>
          {address && (
            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={11} strokeWidth={1.75} />
              {address}
            </p>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="text-xs flex items-center gap-1 mt-0.5 hover:underline"
              style={{ color: 'var(--accent-teal)' }}>
              <Phone size={11} strokeWidth={1.75} />
              {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="text-xs flex items-center gap-1 mt-0.5 hover:underline"
              style={{ color: 'var(--accent-teal)' }}>
              <Mail size={11} strokeWidth={1.75} />
              {email}
            </a>
          )}
        </div>
        {h.cms_data?.overall_rating && (
          <div className="text-center shrink-0">
            <p className="text-xl font-mono font-bold" style={{ color: 'var(--accent-teal)' }}>{h.cms_data.overall_rating}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>CMS rating</p>
          </div>
        )}
      </div>

      {h.cms_benchmarks?.avgERWaitMinutes != null && (
        <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          <Clock size={12} strokeWidth={1.75} />
          Avg ER wait: <strong>{h.cms_benchmarks.avgERWaitMinutes} min</strong>
        </div>
      )}

      {h.services && h.services.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {h.services.slice(0, 5).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>{s}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2 flex-wrap">
        {phone && (
          <Button variant="secondary" size="sm" as="a" href={`tel:${phone}`}>
            <Phone size={13} strokeWidth={1.75} />
            Call
          </Button>
        )}
        {email && (
          <Button variant="secondary" size="sm" as="a" href={`mailto:${email}`}>
            <Mail size={13} strokeWidth={1.75} />
            Email
          </Button>
        )}
      </div>
    </GlassCard>
  )
}

// ─── Doctor card ──────────────────────────────────────────────────────────────

function DoctorCard({ d, onBook }: { d: WithId<Doctor>; onBook: () => void }) {
  const docName = d.npi_data?.name ?? d.name ?? d.displayName ?? 'Provider'
  const avatar = doctorAvatars[d.id]
  const initial = docName.replace(/^Dr\.\s*/i, '').charAt(0).toUpperCase()
  const email = (d as WithId<Doctor> & { email?: string }).email ?? ''

  return (
    <GlassCard variant="interactive" className="p-5">
      <div className="flex items-start gap-3 mb-3">
        {avatar ? (
          <img src={avatar} alt={docName} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-violet))' }}>
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{docName}</h3>
            {d.credentials && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.credentials}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {d.specialty && <Badge variant="teal">{getSpecialtyLabel(toSpecialtyId(d.specialty))}</Badge>}
            <Badge variant={d.badge === 'hospital_verified' ? 'success' : 'teal'}>
              {d.badge === 'hospital_verified' ? 'Hospital verified' : 'NPI verified'}
            </Badge>
          </div>
          {email && (
            <a href={`mailto:${email}`} className="text-xs flex items-center gap-1 mt-1 hover:underline"
              style={{ color: 'var(--text-muted)' }}>
              <Mail size={11} strokeWidth={1.75} />
              {email}
            </a>
          )}
        </div>
      </div>
      {d.bio && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{d.bio}</p>
      )}
      {d.languages && d.languages.length > 0 && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Speaks: {d.languages.join(', ')}
        </p>
      )}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={onBook}>
          <Calendar size={13} strokeWidth={1.75} />
          Book appointment
        </Button>
        {email && (
          <Button variant="secondary" size="sm" as="a" href={`mailto:${email}`}>
            <Mail size={13} strokeWidth={1.75} />
            Contact
          </Button>
        )}
      </div>
    </GlassCard>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProviderResultsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const categoryParam = searchParams.get('category') ?? ''
  const specialtyParam = searchParams.get('specialty') ?? ''

  const [selectedSpecialty, setSelectedSpecialty] = useState(specialtyParam)
  const [selectedInsurance, setSelectedInsurance] = useState('')
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list')
  const [showInsurancePicker, setShowInsurancePicker] = useState(false)
  const [bookingDoctor, setBookingDoctor] = useState<WithId<Doctor> | null>(null)
  const [locating, setLocating] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)

  const { data: patient } = useFirestoreDoc<Patient>(user ? `patients/${user.uid}` : '')
  const { data: allHospitals, loading: hospLoading } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'approved')])
  const { data: allDoctors, loading: docLoading } = useFirestoreCollection<Doctor>('doctors', [])

  const loading = hospLoading || docLoading

  const hospitals = allHospitals

  // Filter doctors — normalize specialty + insurance IDs from Firestore before comparing
  const filteredDoctors = useMemo(() => {
    let list = allDoctors
    if (selectedSpecialty) {
      list = list.filter((d) => toSpecialtyId(d.specialty ?? '') === selectedSpecialty)
    }
    if (selectedInsurance) {
      list = list.filter((d) =>
        d.acceptedInsurance?.some((ins) => toInsuranceId(ins) === selectedInsurance) ?? false
      )
    }
    return list
  }, [allDoctors, selectedSpecialty, selectedInsurance])

  async function handleLocate() {
    if (!user) { toast.error('Sign in to save your location.'); return }
    if (!navigator.geolocation) { toast.error('Your browser does not support location access.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setMapCenter({ lat, lng })
        try {
          await setDoc(doc(db, 'patients', user.uid), { lat, lng }, { merge: true })
          toast.success('Location saved — map updated.')
        } catch {
          toast.error('Could not save location. Try again.')
        } finally {
          setLocating(false)
        }
      },
      () => {
        toast.error('Location access denied. Enable it in your browser settings.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const effectiveLat = mapCenter?.lat ?? patient?.lat
  const effectiveLng = mapCenter?.lng ?? patient?.lng

  // For ER/SCAN categories, show hospitals first; otherwise show doctors first then hospitals
  const categoryConfig = categoryParam ? CARE_CATEGORY_CONFIG[categoryParam as keyof typeof CARE_CATEGORY_CONFIG] : null
  const title = categoryConfig ? categoryConfig.headline : selectedSpecialty ? getSpecialtyLabel(selectedSpecialty) : 'Find Providers'

  const totalCount = filteredDoctors.length + hospitals.length

  // Group doctors by specialty (used when no specialty filter active)
  const doctorsBySpecialty = useMemo(() => {
    if (selectedSpecialty) return null
    const map = new Map<string, WithId<Doctor>[]>()
    for (const d of filteredDoctors) {
      const key = toSpecialtyId(d.specialty ?? 'other')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([specialty, docs]) => ({ specialty, docs }))
  }, [filteredDoctors, selectedSpecialty])

  // Group hospitals by type
  const hospitalsByType = useMemo(() => {
    const map = new Map<string, WithId<Hospital>[]>()
    for (const h of hospitals) {
      const key = h.cms_data?.hospital_type ?? 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(h)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([type, hosps]) => ({ type, hosps }))
  }, [hospitals])

  const mapMarkers: MapMarker[] = [
    ...hospitals.filter((h) => h.lat && h.lng).map((h) => ({
      id: h.id,
      lat: h.lat!,
      lng: h.lng!,
      label: h.cms_data?.facility_name ?? h.name,
      type: 'verified' as const,
    })),
    ...allDoctors.filter((d) => d.lat && d.lng).map((d) => ({
      id: d.id,
      lat: d.lat!,
      lng: d.lng!,
      label: d.npi_data?.name ?? d.name ?? 'Provider',
      type: 'verified' as const,
    })),
  ]

  function setSpecialty(s: string) {
    setSelectedSpecialty(s)
    const params = new URLSearchParams(searchParams)
    if (s) params.set('specialty', s)
    else params.delete('specialty')
    setSearchParams(params, { replace: true })
  }

  const topSpecialties = SPECIALTIES.slice(0, 10)
  const insuranceCarrier = INSURANCE_CARRIERS.find((c) => c.id === selectedInsurance)

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div variants={fadeRise} className="mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap mt-1">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} · {hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={handleLocate}
                disabled={locating}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all"
                style={{
                  color: effectiveLat ? 'var(--accent-teal)' : 'var(--text-muted)',
                  borderColor: effectiveLat ? 'var(--accent-teal)' : 'var(--border-subtle)',
                  background: effectiveLat ? 'var(--accent-teal-glow)' : 'var(--bg-glass)',
                }}
              >
                {locating
                  ? <Loader2 size={11} strokeWidth={2} className="animate-spin" />
                  : <LocateFixed size={11} strokeWidth={2} />}
                {effectiveLat ? 'Location set' : 'Use my location'}
              </button>
            </div>
          </div>
          {categoryConfig && (
            <Badge variant={categoryParam === 'ER_NOW' ? 'danger' : categoryParam === 'URGENT_TODAY' ? 'warning' : 'teal'}>
              {categoryConfig.label}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Filters row */}
      <motion.div variants={fadeRise} className="mb-4 space-y-3">
        {/* Specialty chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setSpecialty('')}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: !selectedSpecialty ? 'var(--accent-teal)' : 'var(--bg-glass)',
              color: !selectedSpecialty ? 'white' : 'var(--text-secondary)',
              borderColor: !selectedSpecialty ? 'var(--accent-teal)' : 'var(--border-subtle)',
            }}>
            All specialties
          </button>
          {topSpecialties.map((s) => (
            <button key={s.id} onClick={() => setSpecialty(s.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                background: selectedSpecialty === s.id ? 'var(--accent-teal)' : 'var(--bg-glass)',
                color: selectedSpecialty === s.id ? 'white' : 'var(--text-secondary)',
                borderColor: selectedSpecialty === s.id ? 'var(--accent-teal)' : 'var(--border-subtle)',
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Insurance filter */}
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setShowInsurancePicker((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: selectedInsurance ? 'hsla(265,70%,65%,0.12)' : 'var(--bg-glass)',
              color: selectedInsurance ? 'var(--accent-violet)' : 'var(--text-secondary)',
              borderColor: selectedInsurance ? 'var(--accent-violet)' : 'var(--border-subtle)',
            }}
          >
            <Filter size={12} strokeWidth={2} />
            {insuranceCarrier ? insuranceCarrier.display_name : 'Insurance'}
            <ChevronDown size={12} strokeWidth={2} />
          </button>
          {selectedInsurance && (
            <button
              onClick={() => setSelectedInsurance('')}
              className="text-xs hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              Clear
            </button>
          )}

          {showInsurancePicker && (
            <div
              className="absolute top-9 left-0 z-30 rounded-2xl overflow-hidden"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
                width: 280,
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {[
                { id: '', display_name: 'All insurance', category: 'national' as const },
                ...INSURANCE_CARRIERS,
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedInsurance(c.id); setShowInsurancePicker(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-tint)]"
                  style={{
                    color: selectedInsurance === c.id ? 'var(--accent-teal)' : 'var(--text-primary)',
                    fontWeight: selectedInsurance === c.id ? 600 : 400,
                  }}
                >
                  {c.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile tabs */}
      <div className="flex gap-1 mb-4 md:hidden p-1 rounded-xl" style={{ background: 'var(--surface-tint)' }}>
        {(['list', 'map'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
            style={{
              background: activeTab === tab ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === tab ? 'var(--shadow-card)' : 'none',
            }}>
            {tab === 'list' ? 'List' : 'Map'}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Provider list */}
        <div className={`flex-1 min-w-0 space-y-6 ${activeTab === 'map' ? 'hidden md:block' : ''}`}
          onClick={() => showInsurancePicker && setShowInsurancePicker(false)}>

          {loading && <SkeletonList count={5} />}

          {!loading && totalCount === 0 && (
            <GlassCard className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface-tint)' }}>
                <Filter size={24} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No providers found</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try a different specialty or insurance filter.</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button size="sm" variant="secondary" onClick={() => setSpecialty('')}>Clear specialty</Button>
                {selectedInsurance && (
                  <Button size="sm" variant="secondary" onClick={() => setSelectedInsurance('')}>Clear insurance</Button>
                )}
              </div>
            </GlassCard>
          )}

          {/* ── Hospitals — grouped by type ─────────────────────────────────── */}
          {!loading && hospitals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={15} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Hospitals</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
                  {hospitals.length}
                </span>
              </div>

              <div className="space-y-6">
                {hospitalsByType.map(({ type, hosps }) => (
                  <div key={type}>
                    {/* Type header */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2"
                        style={{ color: 'var(--text-muted)' }}>
                        {type}
                      </span>
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
                        {hosps.length}
                      </span>
                      <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
                    </div>

                    <motion.div variants={stagger} className="space-y-3">
                      {hosps.map((h, i) => (
                        <motion.div key={h.id} variants={fadeRise} style={{ transitionDelay: `${i * 30}ms` }}>
                          <HospitalCard h={h} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Doctors — grouped by specialty (flat when filter active) ──── */}
          {!loading && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope size={15} strokeWidth={1.75} style={{ color: 'var(--accent-violet)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {selectedSpecialty ? getSpecialtyLabel(selectedSpecialty) : 'Doctors'}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
                  {filteredDoctors.length}
                </span>
                {selectedInsurance && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    · {insuranceCarrier?.display_name}
                  </span>
                )}
              </div>

              {filteredDoctors.length === 0 && (
                <GlassCard className="p-6 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No doctors match your filters.{' '}
                    <button className="font-semibold hover:underline" style={{ color: 'var(--accent-teal)' }}
                      onClick={() => { setSpecialty(''); setSelectedInsurance('') }}>
                      Clear all
                    </button>
                  </p>
                </GlassCard>
              )}

              {/* Grouped view — no specialty filter */}
              {!selectedSpecialty && doctorsBySpecialty && doctorsBySpecialty.length > 0 && (
                <div className="space-y-6">
                  {doctorsBySpecialty.map(({ specialty, docs }) => (
                    <div key={specialty}>
                      {/* Specialty header */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
                        <button
                          onClick={() => setSpecialty(specialty)}
                          className="text-[11px] font-semibold uppercase tracking-wider px-2 hover:underline"
                          style={{ color: 'var(--accent-violet)' }}
                        >
                          {getSpecialtyLabel(specialty)}
                        </button>
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
                          {docs.length}
                        </span>
                        <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
                      </div>

                      <motion.div variants={stagger} className="space-y-3">
                        {docs.map((d, i) => (
                          <motion.div key={d.id} variants={fadeRise} style={{ transitionDelay: `${i * 30}ms` }}>
                            <DoctorCard d={d} onBook={() => setBookingDoctor(d)} />
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  ))}
                </div>
              )}

              {/* Flat view — specialty filter active */}
              {selectedSpecialty && filteredDoctors.length > 0 && (
                <motion.div variants={stagger} className="space-y-3">
                  {filteredDoctors.map((d, i) => (
                    <motion.div key={d.id} variants={fadeRise} style={{ transitionDelay: `${i * 30}ms` }}>
                      <DoctorCard d={d} onBook={() => setBookingDoctor(d)} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className={`w-full md:w-[420px] shrink-0 ${activeTab === 'list' ? 'hidden md:block' : ''}`}>
          <div className="sticky top-4">
            <div className="rounded-2xl overflow-hidden" style={{ height: 600 }}>
              <ProviderMap
                markers={mapMarkers}
                centerLat={effectiveLat}
                centerLng={effectiveLng}
              />
            </div>
          </div>
        </div>
      </div>

      {bookingDoctor && user && (
        <BookingSheet
          doctor={bookingDoctor}
          patientId={user.uid}
          open={!!bookingDoctor}
          onClose={() => setBookingDoctor(null)}
        />
      )}
    </motion.div>
  )
}
