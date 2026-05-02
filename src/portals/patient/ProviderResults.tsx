import { useRef, useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { where, orderBy, doc, setDoc, updateDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import {
  MapPin, Phone, Clock, Calendar, Filter,
  Building2, Stethoscope, Mail, LocateFixed, Loader2,
  Navigation, CalendarPlus, ExternalLink, MessageSquareMore,
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
import { formatDate, formatTime, formatDistance } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import { haversine } from '../../lib/haversine'
import type { Patient, Hospital, Doctor, DoctorSlot, MRISlot, WithId, CareCategory } from '../../types'

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

type ProviderFilter = '' | `specialty:${string}` | `category:${CareCategory}`

const DISTANCE_OPTIONS = [
  { value: 'nearest', label: 'Nearest first' },
  { value: '8', label: 'Within 5 mi' },
  { value: '16', label: 'Within 10 mi' },
  { value: '40', label: 'Within 25 mi' },
  { value: '80', label: 'Within 50 mi' },
]

const CATEGORY_SPECIALTIES: Record<CareCategory, string[]> = {
  ER_NOW: ['emergency_medicine'],
  URGENT_TODAY: ['family_medicine', 'internal_medicine', 'emergency_medicine'],
  SCAN_NEEDED: ['radiology', 'orthopedics'],
  TELEHEALTH: ['family_medicine', 'internal_medicine', 'psychiatry', 'dermatology'],
  SCHEDULE_DOCTOR: [],
  SELF_CARE: ['family_medicine', 'internal_medicine'],
}

const CATEGORY_SERVICE_TERMS: Record<CareCategory, string[]> = {
  ER_NOW: ['emergency', 'trauma', 'er'],
  URGENT_TODAY: ['emergency', 'urgent', 'walk-in'],
  SCAN_NEEDED: ['mri', 'ct', 'x-ray', 'xray', 'ultrasound', 'scan', 'imaging', 'radiology'],
  TELEHEALTH: [],
  SCHEDULE_DOCTOR: [],
  SELF_CARE: [],
}

function initialProviderFilter(specialtyParam: string, categoryParam: string): ProviderFilter {
  if (specialtyParam) return `specialty:${specialtyParam}`
  if (categoryParam && categoryParam in CARE_CATEGORY_CONFIG) return `category:${categoryParam as CareCategory}`
  return ''
}

function getDistanceKm(item: { lat?: number; lng?: number }, originLat?: number, originLng?: number) {
  if (!originLat || !originLng || !item.lat || !item.lng) return null
  return haversine(originLat, originLng, item.lat, item.lng)
}

function hospitalMatchesCategory(hospital: Hospital, category: CareCategory) {
  const terms = CATEGORY_SERVICE_TERMS[category]
  if (terms.length === 0) return true
  const haystack = [
    hospital.cms_data?.hospital_type,
    hospital.cms_data?.emergency_services,
    hospital.type,
    ...(hospital.services ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
  return terms.some((term) => haystack.includes(term))
}

function hospitalMatchesSpecialty(hospital: Hospital, specialty: string) {
  if (!specialty) return true
  const specLabel = getSpecialtyLabel(specialty).toLowerCase()
  const specId = specialty.replace(/_/g, ' ').toLowerCase()
  const haystack = [
    hospital.cms_data?.hospital_type,
    hospital.type,
    ...(hospital.services ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
  return haystack.includes(specLabel) || haystack.includes(specId)
}

function acceptsInsurance(provider: { acceptedInsurance?: string[] }, selectedInsurance: string, strict = true) {
  if (!selectedInsurance) return true
  if (!provider.acceptedInsurance || provider.acceptedInsurance.length === 0) return !strict
  return provider.acceptedInsurance.some((ins) => toInsuranceId(ins) === selectedInsurance)
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

function hospitalName(hospital: Hospital) {
  return hospital.cms_data?.facility_name ?? hospital.name
}

function hospitalAddress(hospital: Hospital) {
  return hospital.cms_data?.address
    ? `${hospital.cms_data.address}, ${hospital.cms_data.city ?? ''}, ${hospital.cms_data.state ?? ''}`
    : hospital.address ?? ''
}

function hospitalPhone(hospital: Hospital) {
  return hospital.cms_data?.phone_number ?? hospital.phone ?? ''
}

function hospitalEmail(hospital: Hospital) {
  return hospital.email ?? ''
}

function directionsUrl(lat?: number, lng?: number, address?: string) {
  const destination = lat && lng ? `${lat},${lng}` : address ?? ''
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

function contactSubject(name: string) {
  return encodeURIComponent(`NowCare appointment request for ${name}`)
}

function contactBody(name: string) {
  return encodeURIComponent(`Hello ${name},\n\nI found you through NowCare and would like to ask about appointment availability.\n\nThank you.`)
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

function HospitalCard({
  h,
  selected,
  onFocusMap,
  onOpenActions,
}: {
  h: WithId<Hospital>
  selected: boolean
  onFocusMap: () => void
  onOpenActions: () => void
}) {
  const name = hospitalName(h)
  const address = hospitalAddress(h)
  const phone = hospitalPhone(h)
  const email = hospitalEmail(h)
  const hasMapLocation = Boolean(h.lat && h.lng)

  return (
    <GlassCard
      variant="interactive"
      className="relative p-5 cursor-pointer transition-all"
      onClick={hasMapLocation ? onFocusMap : undefined}
      role={hasMapLocation ? 'button' : undefined}
      tabIndex={hasMapLocation ? 0 : undefined}
      onKeyDown={(e) => {
        if (!hasMapLocation) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFocusMap()
        }
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity"
        style={{
          opacity: selected ? 1 : 0,
          boxShadow: 'inset 0 0 0 1px var(--accent-teal), 0 0 32px -18px var(--accent-teal)',
        }}
      />
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
              onClick={(e) => e.stopPropagation()}
              style={{ color: 'var(--accent-teal)' }}>
              <Phone size={11} strokeWidth={1.75} />
              {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="text-xs flex items-center gap-1 mt-0.5 hover:underline"
              onClick={(e) => e.stopPropagation()}
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
        {h.lat && h.lng && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onFocusMap()
            }}
          >
            <MapPin size={13} strokeWidth={1.75} />
            Show on map
          </Button>
        )}
        {h.lat && h.lng && (
          <Button
            variant="secondary"
            size="sm"
            as="a"
            href={directionsUrl(h.lat, h.lng, address)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Navigation size={13} strokeWidth={1.75} />
            Directions
          </Button>
        )}
        {phone && (
          <Button variant="secondary" size="sm" as="a" href={`tel:${phone}`} onClick={(e) => e.stopPropagation()}>
            <Phone size={13} strokeWidth={1.75} />
            Call
          </Button>
        )}
        {email && (
          <Button variant="secondary" size="sm" as="a" href={`mailto:${email}`} onClick={(e) => e.stopPropagation()}>
            <Mail size={13} strokeWidth={1.75} />
            Email
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onOpenActions()
          }}
        >
          <CalendarPlus size={13} strokeWidth={1.75} />
          Appointments
        </Button>
      </div>
    </GlassCard>
  )
}

function HospitalActionSheet({ hospital, patientId, open, onClose }: {
  hospital: WithId<Hospital>
  patientId: string
  open: boolean
  onClose: () => void
}) {
  const name = hospitalName(hospital)
  const address = hospitalAddress(hospital)
  const phone = hospitalPhone(hospital)
  const email = hospitalEmail(hospital)
  const now = useMemo(() => new Date(), [])
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null)

  const { data: scanSlots, loading } = useFirestoreCollection<MRISlot>(
    open ? 'mri_slots' : '',
    open ? [where('hospitalId', '==', hospital.id), where('available', '==', true),
      where('datetime', '>=', Timestamp.fromDate(now)), orderBy('datetime', 'asc')] : []
  )
  const [scanTypeFilter, setScanTypeFilter] = useState<string>('All')

  const scanTypes = useMemo(() => {
    const types = Array.from(new Set(scanSlots.map((s) => s.type))).sort()
    return ['All', ...types]
  }, [scanSlots])

  const visibleSlots = scanTypeFilter === 'All'
    ? scanSlots
    : scanSlots.filter((s) => s.type === scanTypeFilter)

  async function handleBookScan(slot: WithId<MRISlot>) {
    setBookingSlotId(slot.id)
    try {
      await updateDoc(doc(db, 'mri_slots', slot.id), {
        available: false,
        bookedByPatientId: patientId,
        bookedAt: serverTimestamp(),
      })
      await addDoc(collection(db, 'care_journeys'), {
        patientId,
        selected_provider_id: hospital.id,
        provider_type: 'hospital',
        appointment_datetime: slot.datetime,
        createdAt: serverTimestamp(),
      })
      toast.success(`Booked ${slot.type} for ${formatDate(slot.datetime)} at ${formatTime(slot.datetime)}`)
      onClose()
    } catch {
      toast.error('Could not book this slot. Please call the hospital or try again.')
    } finally {
      setBookingSlotId(null)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={name}>
      <div className="space-y-4">
        <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tint)' }}>
          {address && (
            <p className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              {address}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" as="a" href={directionsUrl(hospital.lat, hospital.lng, address)} target="_blank" rel="noopener noreferrer">
              <Navigation size={14} strokeWidth={1.75} />
              Directions
            </Button>
            {phone && (
              <Button size="sm" variant="secondary" as="a" href={`tel:${phone}`}>
                <Phone size={14} strokeWidth={1.75} />
                Call
              </Button>
            )}
            {email && (
              <Button
                size="sm"
                variant="secondary"
                as="a"
                href={`mailto:${email}?subject=${contactSubject(name)}&body=${contactBody(name)}`}
              >
                <Mail size={14} strokeWidth={1.75} />
                Email
              </Button>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <CalendarPlus size={15} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Available scan appointments</h3>
          </div>
          {!loading && scanTypes.length > 1 && (
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5">
              {scanTypes.map((type) => {
                const active = scanTypeFilter === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setScanTypeFilter(type)}
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all"
                    style={{
                      background: active ? 'var(--accent-teal)' : 'var(--surface-tint)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${active ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
          )}
          {loading && <div className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading slots...</div>}
          {!loading && scanSlots.length === 0 && (
            <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
              No open scan slots are published right now. Call or email the hospital to request availability.
            </div>
          )}
          {!loading && scanSlots.length > 0 && visibleSlots.length === 0 && (
            <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
              No {scanTypeFilter} slots available right now.
            </div>
          )}
          <div className="space-y-2">
            {visibleSlots.slice(0, 8).map((slot) => (
              <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tint)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{slot.type}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(slot.datetime)} at {formatTime(slot.datetime)}
                  </p>
                </div>
                <Button size="sm" loading={bookingSlotId === slot.id} disabled={bookingSlotId !== null} onClick={() => handleBookScan(slot)}>
                  Book
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="secondary" as="a" href={`/patient/assess?provider=${hospital.id}`}>
            <MessageSquareMore size={14} strokeWidth={1.75} />
            Start assessment
          </Button>
          {email && (
            <Button
              variant="secondary"
              as="a"
              href={`mailto:${email}?subject=${contactSubject(name)}&body=${contactBody(name)}`}
            >
              <ExternalLink size={14} strokeWidth={1.75} />
              Request appointment
            </Button>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Doctor card ──────────────────────────────────────────────────────────────

function DoctorCard({ d, onBook, onFocusMap, selected }: {
  d: WithId<Doctor>
  onBook: () => void
  onFocusMap?: () => void
  selected?: boolean
}) {
  const docName = d.npi_data?.name ?? d.name ?? d.displayName ?? 'Provider'
  const avatar = doctorAvatars[d.id]
  const initial = docName.replace(/^Dr\.\s*/i, '').charAt(0).toUpperCase()
  const email = (d as WithId<Doctor> & { email?: string }).email ?? ''

  return (
    <GlassCard
      variant="interactive"
      className="relative p-5 cursor-pointer transition-all"
      onClick={onFocusMap}
      role={onFocusMap ? 'button' : undefined}
      tabIndex={onFocusMap ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onFocusMap) return
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFocusMap() }
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity"
        style={{
          opacity: selected ? 1 : 0,
          boxShadow: 'inset 0 0 0 1px var(--accent-teal), 0 0 32px -18px var(--accent-teal)',
        }}
      />
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
              onClick={(e) => e.stopPropagation()}
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
        <Button size="sm" onClick={(e) => { e.stopPropagation(); onBook() }}>
          <Calendar size={13} strokeWidth={1.75} />
          Book appointment
        </Button>
        {email && (
          <Button variant="secondary" size="sm" as="a" href={`mailto:${email}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
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

  const categoryParam = searchParams.get('category') ?? ''
  const specialtyParam = searchParams.get('specialty') ?? ''

  const [selectedProviderFilter, setSelectedProviderFilter] = useState<ProviderFilter>(() => initialProviderFilter(specialtyParam, categoryParam))
  const [selectedInsurance, setSelectedInsurance] = useState('')
  const [distanceFilter, setDistanceFilter] = useState('nearest')
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list')
  const [bookingDoctor, setBookingDoctor] = useState<WithId<Doctor> | null>(null)
  const [actionHospital, setActionHospital] = useState<WithId<Hospital> | null>(null)
  const [locating, setLocating] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [focusedMarkerId, setFocusedMarkerId] = useState<string | null>(null)
  const [focusVersion, setFocusVersion] = useState(0)
  const hospitalsSectionRef = useRef<HTMLDivElement | null>(null)
  const doctorsSectionRef = useRef<HTMLDivElement | null>(null)

  const { data: patient } = useFirestoreDoc<Patient>(user ? `patients/${user.uid}` : '')
  const { data: allHospitals, loading: hospLoading } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'approved')])
  const { data: allDoctors, loading: docLoading } = useFirestoreCollection<Doctor>('doctors', [])

  const loading = hospLoading || docLoading

  const selectedSpecialty = selectedProviderFilter.startsWith('specialty:') ? selectedProviderFilter.slice('specialty:'.length) : ''
  const selectedCategory = selectedProviderFilter.startsWith('category:') ? selectedProviderFilter.slice('category:'.length) as CareCategory : null
  const selectedDistanceKm = distanceFilter === 'nearest' ? null : Number(distanceFilter)
  const effectiveLat = mapCenter?.lat ?? patient?.lat
  const effectiveLng = mapCenter?.lng ?? patient?.lng

  const sortAndLimitByDistance = <T extends { lat?: number; lng?: number }>(items: WithId<T>[]) => {
    const withDistance = items
      .map((item) => ({ item, distance: getDistanceKm(item, effectiveLat, effectiveLng) }))
      .filter(({ distance }) => selectedDistanceKm == null || !effectiveLat || !effectiveLng || (distance != null && distance <= selectedDistanceKm))

    if (effectiveLat && effectiveLng) {
      withDistance.sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY))
    }

    return withDistance.map(({ item }) => item)
  }

  const hospitals = useMemo(() => {
    let list = allHospitals
    if (selectedCategory) {
      list = list.filter((h) => hospitalMatchesCategory(h, selectedCategory))
    }
    if (selectedSpecialty) {
      list = list.filter((h) => hospitalMatchesSpecialty(h, selectedSpecialty))
    }
    if (selectedInsurance) {
      list = list.filter((h) => acceptsInsurance(h as WithId<Hospital> & { acceptedInsurance?: string[] }, selectedInsurance, false))
    }
    return sortAndLimitByDistance(list)
  }, [allHospitals, selectedCategory, selectedSpecialty, selectedInsurance, selectedDistanceKm, effectiveLat, effectiveLng])

  // Filter doctors — normalize specialty + insurance IDs from Firestore before comparing
  const filteredDoctors = useMemo(() => {
    let list = allDoctors
    if (selectedSpecialty) {
      list = list.filter((d) => toSpecialtyId(d.specialty ?? '') === selectedSpecialty)
    }
    if (selectedCategory) {
      const categorySpecialties = CATEGORY_SPECIALTIES[selectedCategory]
      if (categorySpecialties.length > 0) {
        list = list.filter((d) => categorySpecialties.includes(toSpecialtyId(d.specialty ?? '')))
      }
    }
    if (selectedInsurance) {
      list = list.filter((d) => acceptsInsurance(d, selectedInsurance))
    }
    return sortAndLimitByDistance(list)
  }, [allDoctors, selectedSpecialty, selectedCategory, selectedInsurance, selectedDistanceKm, effectiveLat, effectiveLng])

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

  // For ER/SCAN categories, show hospitals first; otherwise show doctors first then hospitals
  const categoryConfig = selectedCategory ? CARE_CATEGORY_CONFIG[selectedCategory] : null
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
      label: hospitalName(h),
      type: 'verified' as const,
      kind: 'hospital' as const,
      address: hospitalAddress(h),
      phone: hospitalPhone(h),
      email: hospitalEmail(h),
      subtitle: h.er_status ? `${h.er_status[0].toUpperCase()}${h.er_status.slice(1)} ER status` : h.cms_data?.hospital_type,
    })),
    ...filteredDoctors.filter((d) => d.lat && d.lng).map((d) => ({
      id: d.id,
      lat: d.lat!,
      lng: d.lng!,
      label: d.npi_data?.name ?? d.name ?? 'Provider',
      type: 'verified' as const,
      kind: 'doctor' as const,
      subtitle: d.specialty ? getSpecialtyLabel(toSpecialtyId(d.specialty)) : undefined,
    })),
  ]

  function setProviderFilter(value: ProviderFilter) {
    setSelectedProviderFilter(value)
    const params = new URLSearchParams(searchParams)
    params.delete('specialty')
    params.delete('category')
    if (value.startsWith('specialty:')) params.set('specialty', value.slice('specialty:'.length))
    if (value.startsWith('category:')) params.set('category', value.slice('category:'.length))
    setSearchParams(params, { replace: true })
  }

  function scrollToSection(section: 'hospitals' | 'doctors') {
    setActiveTab('list')
    const ref = section === 'hospitals' ? hospitalsSectionRef : doctorsSectionRef
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function focusHospitalOnMap(hospital: WithId<Hospital>) {
    if (!hospital.lat || !hospital.lng) {
      toast.error('This hospital does not have map coordinates yet.')
      return
    }
    setFocusedMarkerId(hospital.id)
    setFocusVersion((v) => v + 1)
    setMapCenter({ lat: hospital.lat, lng: hospital.lng })
    setActiveTab('map')
  }

  function focusDoctorOnMap(doctor: WithId<Doctor>) {
    if (!doctor.lat || !doctor.lng) return
    setFocusedMarkerId(doctor.id)
    setFocusVersion((v) => v + 1)
    setMapCenter({ lat: doctor.lat, lng: doctor.lng })
    setActiveTab('map')
  }

  function handleMarkerSelect(marker: MapMarker) {
    setFocusedMarkerId(marker.id)
    if (marker.kind === 'hospital') {
      const hospital = hospitals.find((h) => h.id === marker.id)
      if (hospital) setMapCenter({ lat: hospital.lat!, lng: hospital.lng! })
    }
  }

  function openHospitalActionsByMarker(marker: MapMarker) {
    const hospital = hospitals.find((h) => h.id === marker.id)
    if (hospital) setActionHospital(hospital)
  }

  const selectedHospital = focusedMarkerId ? hospitals.find((h) => h.id === focusedMarkerId) : null

  const [travelInfo, setTravelInfo] = useState<{ distance: string; duration: string } | null>(null)
  const [travelLoading, setTravelLoading] = useState(false)

  useEffect(() => {
    if (!selectedHospital?.lat || !selectedHospital?.lng || !effectiveLat || !effectiveLng) {
      setTravelInfo(null)
      return
    }
    if (!window.google?.maps?.DistanceMatrixService) {
      setTravelInfo(null)
      return
    }
    setTravelLoading(true)
    setTravelInfo(null)
    const svc = new window.google.maps.DistanceMatrixService()
    svc.getDistanceMatrix(
      {
        origins: [{ lat: effectiveLat, lng: effectiveLng }],
        destinations: [{ lat: selectedHospital.lat, lng: selectedHospital.lng }],
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: { departureTime: new Date() },
      },
      (response, status) => {
        setTravelLoading(false)
        if (status === 'OK' && response?.rows[0]?.elements[0]?.status === 'OK') {
          const el = response.rows[0].elements[0]
          setTravelInfo({
            distance: el.distance.text,
            duration: el.duration_in_traffic?.text ?? el.duration.text,
          })
        }
      }
    )
  }, [selectedHospital?.id, effectiveLat, effectiveLng])

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="mx-auto max-w-7xl overflow-hidden">
      {/* Header */}
      <motion.div variants={fadeRise} className="mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap mt-1">
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
        </div>
      </motion.div>

      <motion.div variants={fadeRise} className="mb-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => scrollToSection('hospitals')}
          className="rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5"
          style={{
            borderColor: 'color-mix(in oklch, var(--accent-teal) 42%, var(--border-subtle))',
            background: 'linear-gradient(135deg, color-mix(in oklch, var(--accent-teal) 12%, var(--bg-glass)), var(--bg-glass))',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
              <Building2 size={18} strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>Hospitals</span>
              <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{hospitals.length} nearby options</span>
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('doctors')}
          className="rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5"
          style={{
            borderColor: 'color-mix(in oklch, var(--accent-violet) 42%, var(--border-subtle))',
            background: 'linear-gradient(135deg, color-mix(in oklch, var(--accent-violet) 12%, var(--bg-glass)), var(--bg-glass))',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'hsla(265,70%,65%,0.12)', color: 'var(--accent-violet)' }}>
              <Stethoscope size={18} strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>Doctors</span>
              <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{filteredDoctors.length} matching providers</span>
            </span>
          </div>
        </button>
      </motion.div>

      {/* Filters row */}
      <motion.div variants={fadeRise} className="mb-4">
        <GlassCard className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter size={15} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sort by</h2>
            </div>
            {(selectedProviderFilter || selectedInsurance || distanceFilter !== 'nearest') && (
              <button
                type="button"
                onClick={() => {
                  setProviderFilter('')
                  setSelectedInsurance('')
                  setDistanceFilter('nearest')
                }}
                className="text-xs font-semibold hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Specialties/categories</span>
              <select
                value={selectedProviderFilter}
                onChange={(e) => setProviderFilter(e.target.value as ProviderFilter)}
                className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all"
                style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                <option value="">All specialties/categories</option>
                <optgroup label="Care categories">
                  {(Object.entries(CARE_CATEGORY_CONFIG) as [CareCategory, typeof CARE_CATEGORY_CONFIG[CareCategory]][]).map(([id, cfg]) => (
                    <option key={id} value={`category:${id}`}>{cfg.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Doctor specialties">
                  {SPECIALTIES.map((specialty) => (
                    <option key={specialty.id} value={`specialty:${specialty.id}`}>{specialty.label}</option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Insurance</span>
              <select
                value={selectedInsurance}
                onChange={(e) => setSelectedInsurance(e.target.value)}
                className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all"
                style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                <option value="">All insurance</option>
                {INSURANCE_CARRIERS.map((carrier) => (
                  <option key={carrier.id} value={carrier.id}>{carrier.display_name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Nearest distance</span>
              <select
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value)}
                className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all"
                style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                {DISTANCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

        </GlassCard>
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

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Provider list */}
        <div className={`flex-1 min-w-0 space-y-6 ${activeTab === 'map' ? 'hidden md:block' : ''}`}>

          {loading && <SkeletonList count={5} />}

          {!loading && totalCount === 0 && (
            <GlassCard className="p-6 sm:p-10 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface-tint)' }}>
                <Filter size={24} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No providers found</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try a different specialty or insurance filter.</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button size="sm" variant="secondary" onClick={() => setProviderFilter('')}>Clear category</Button>
                {selectedInsurance && (
                  <Button size="sm" variant="secondary" onClick={() => setSelectedInsurance('')}>Clear insurance</Button>
                )}
              </div>
            </GlassCard>
          )}

          {/* ── Hospitals — grouped by type ─────────────────────────────────── */}
          {!loading && hospitals.length > 0 && (
            <div ref={hospitalsSectionRef} className="scroll-mt-24">
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
                          <HospitalCard
                            h={h}
                            selected={focusedMarkerId === h.id}
                            onFocusMap={() => focusHospitalOnMap(h)}
                            onOpenActions={() => setActionHospital(h)}
                          />
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
            <div ref={doctorsSectionRef} className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope size={15} strokeWidth={1.75} style={{ color: 'var(--accent-violet)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {selectedSpecialty ? getSpecialtyLabel(selectedSpecialty) : 'Doctors'}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
                  {filteredDoctors.length}
                </span>
              </div>

              {filteredDoctors.length === 0 && (
                <GlassCard className="p-6 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No doctors match your filters.{' '}
                    <button className="font-semibold hover:underline" style={{ color: 'var(--accent-teal)' }}
                      onClick={() => { setProviderFilter(''); setSelectedInsurance(''); setDistanceFilter('nearest') }}>
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
                          onClick={() => setProviderFilter(`specialty:${specialty}`)}
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
                            <DoctorCard
                              d={d}
                              onBook={() => setBookingDoctor(d)}
                              onFocusMap={d.lat && d.lng ? () => focusDoctorOnMap(d) : undefined}
                              selected={focusedMarkerId === d.id}
                            />
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
                      <DoctorCard
                        d={d}
                        onBook={() => setBookingDoctor(d)}
                        onFocusMap={d.lat && d.lng ? () => focusDoctorOnMap(d) : undefined}
                        selected={focusedMarkerId === d.id}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className={`w-full lg:w-[520px] xl:w-[580px] shrink-0 ${activeTab === 'list' ? 'hidden md:block' : ''}`}>
          <div className="md:sticky md:top-4">
            <div className="rounded-2xl overflow-hidden border" style={{ height: 'min(720px, calc(100dvh - 132px))', minHeight: 460, borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <ProviderMap
                markers={mapMarkers}
                centerLat={effectiveLat}
                centerLng={effectiveLng}
                focusedMarkerId={focusedMarkerId}
                focusVersion={focusVersion}
                onMarkerSelect={handleMarkerSelect}
                onRequestBooking={openHospitalActionsByMarker}
              />
            </div>
            {selectedHospital && (
              <GlassCard className="mt-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
                    <Building2 size={16} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{hospitalName(selectedHospital)}</p>
                    <p className="truncate text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{hospitalAddress(selectedHospital)}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const distKm = getDistanceKm(selectedHospital, effectiveLat, effectiveLng)
                        return distKm != null ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                            <MapPin size={11} strokeWidth={1.75} />
                            {travelInfo ? travelInfo.distance : formatDistance(distKm)}
                          </span>
                        ) : null
                      })()}
                      {travelLoading && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
                          <Loader2 size={11} strokeWidth={1.75} className="animate-spin" />
                          Estimating…
                        </span>
                      )}
                      {travelInfo && !travelLoading && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
                          <Clock size={11} strokeWidth={1.75} />
                          {travelInfo.duration} drive
                        </span>
                      )}
                      {!travelInfo && !travelLoading && effectiveLat && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No route estimate</span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
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
      {actionHospital && user && (
        <HospitalActionSheet
          hospital={actionHospital}
          patientId={user.uid}
          open={!!actionHospital}
          onClose={() => setActionHospital(null)}
        />
      )}
    </motion.div>
  )
}
