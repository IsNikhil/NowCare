import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { where, orderBy, doc, updateDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { MapPin, Phone, Clock, Star, Calendar, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { useGeoQuery } from '../../hooks/useGeoQuery'
import { ProviderMap } from '../../components/providers/ProviderMap'
import type { MapMarker } from '../../components/providers/ProviderMap'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { SkeletonList } from '../../components/ui/Skeleton'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { CARE_CATEGORY_CONFIG } from '../../lib/careCategories'
import { getSpecialtyLabel, SPECIALTIES } from '../../lib/specialties'
import { doctorAvatars } from '../../lib/imageAssets'
import { RADIUS_KM } from '../../lib/constants'
import { formatDate, formatTime } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import type { Patient, Hospital, Doctor, DoctorSlot, WithId } from '../../types'

function ERStatusBadge({ status }: { status?: string }) {
  if (!status) return null
  const configs: Record<string, { label: string; color: string; dot: boolean }> = {
    low: { label: 'Low wait', color: 'success', dot: true },
    moderate: { label: 'Moderate wait', color: 'warning', dot: true },
    high: { label: 'High wait', color: 'danger', dot: true },
    closed: { label: 'ER Closed', color: 'slate', dot: false },
  }
  const cfg = configs[status]
  if (!cfg) return null
  return <Badge variant={cfg.color as 'success' | 'warning' | 'danger' | 'slate'} dot={cfg.dot}>{cfg.label}</Badge>
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

  return (
    <BottomSheet open={open} onClose={onClose} title={`Book with ${doctor.name ?? 'Doctor'}`}>
      {loading && <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading slots...</div>}
      {!loading && slots.length === 0 && (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No open slots available.</div>
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

export default function ProviderResultsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const categoryParam = searchParams.get('category') ?? ''
  const specialtyParam = searchParams.get('specialty') ?? ''

  const [selectedSpecialty, setSelectedSpecialty] = useState(specialtyParam)
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list')
  const [bookingDoctor, setBookingDoctor] = useState<WithId<Doctor> | null>(null)

  const { data: patient } = useFirestoreDoc<Patient>(user ? `patients/${user.uid}` : '')
  const { data: hospitals, loading: hospLoading } = useFirestoreCollection<Hospital>('hospitals', [where('status', '==', 'approved')])
  const { data: doctors, loading: docLoading } = useFirestoreCollection<Doctor>('doctors', [])

  const loading = hospLoading || docLoading

  const nearbyHospitals = useGeoQuery(hospitals, patient?.lat ?? null, patient?.lng ?? null, RADIUS_KM)
  const nearbyDoctors = useGeoQuery(doctors, patient?.lat ?? null, patient?.lng ?? null, RADIUS_KM)

  const filteredDoctors = useMemo(() => {
    let list = nearbyDoctors
    if (selectedSpecialty) list = list.filter((d) => d.specialty === selectedSpecialty)
    return list
  }, [nearbyDoctors, selectedSpecialty])

  const categoryConfig = categoryParam ? CARE_CATEGORY_CONFIG[categoryParam as keyof typeof CARE_CATEGORY_CONFIG] : null
  const showHospitals = categoryParam === 'ER_NOW' || categoryParam === 'SCAN_NEEDED'
  const providerList = showHospitals ? nearbyHospitals : filteredDoctors
  const title = categoryConfig ? categoryConfig.headline : selectedSpecialty ? getSpecialtyLabel(selectedSpecialty) : 'Find Providers'

  const mapMarkers: MapMarker[] = [
    ...nearbyHospitals.filter((h) => h.lat && h.lng).map((h) => ({
      id: h.id, lat: h.lat!, lng: h.lng!, label: h.name,
      type: (h.er_status ? 'verified' : 'cms') as 'verified' | 'cms',
    })),
    ...nearbyDoctors.filter((d) => d.lat && d.lng).map((d) => ({
      id: d.id, lat: d.lat!, lng: d.lng!, label: d.name ?? 'Doctor', type: 'verified' as const,
    })),
  ]

  function setSpecialty(s: string) {
    setSelectedSpecialty(s)
    const params = new URLSearchParams(searchParams)
    if (s) params.set('specialty', s)
    else params.delete('specialty')
    setSearchParams(params, { replace: true })
  }

  const topSpecialties = SPECIALTIES.slice(0, 8)

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div variants={fadeRise} className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {providerList.length} providers within {RADIUS_KM}km of you
            </p>
          </div>
          {categoryConfig && (
            <Badge variant={categoryParam === 'ER_NOW' ? 'danger' : categoryParam === 'URGENT_TODAY' ? 'warning' : 'teal'}>
              {categoryConfig.label}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Specialty filter chips */}
      {!showHospitals && (
        <motion.div variants={fadeRise} className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSpecialty('')}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                background: !selectedSpecialty ? 'var(--accent-teal)' : 'var(--bg-glass)',
                color: !selectedSpecialty ? 'white' : 'var(--text-secondary)',
                borderColor: !selectedSpecialty ? 'var(--accent-teal)' : 'var(--border-subtle)',
              }}
            >
              All specialties
            </button>
            {topSpecialties.map((s) => (
              <button
                key={s.id}
                onClick={() => setSpecialty(s.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={{
                  background: selectedSpecialty === s.id ? 'var(--accent-teal)' : 'var(--bg-glass)',
                  color: selectedSpecialty === s.id ? 'white' : 'var(--text-secondary)',
                  borderColor: selectedSpecialty === s.id ? 'var(--accent-teal)' : 'var(--border-subtle)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

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
        <div className={`flex-1 min-w-0 ${activeTab === 'map' ? 'hidden md:block' : ''}`}>
          {loading && <SkeletonList count={4} />}

          {!loading && providerList.length === 0 && (
            <GlassCard className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface-tint)' }}>
                <Filter size={24} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No providers found</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Try a different specialty or extend your search range.
              </p>
              <Button size="sm" variant="secondary" className="mt-4" onClick={() => setSpecialty('')}>
                Clear filter
              </Button>
            </GlassCard>
          )}

          <motion.div variants={stagger} className="space-y-3">
            {showHospitals
              ? nearbyHospitals.map((h, i) => (
                <motion.div key={h.id} variants={fadeRise} style={{ transitionDelay: `${i * 40}ms` }}>
                  <GlassCard variant="interactive" className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{h.name}</h3>
                          <Badge variant="teal">Verified</Badge>
                          <ERStatusBadge status={h.er_status} />
                        </div>
                        {(h.cms_data?.address || h.address) && (
                          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                            <MapPin size={11} strokeWidth={1.75} />
                            {h.cms_data?.address ?? h.address}
                          </p>
                        )}
                      </div>
                      {h.cms_data?.overall_rating && (
                        <div className="text-center shrink-0">
                          <p className="text-xl font-mono font-bold" style={{ color: 'var(--accent-teal)' }}>{h.cms_data.overall_rating}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CMS rating</p>
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
                        {h.services.slice(0, 4).map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {h.phone && (
                        <Button variant="secondary" size="sm" as="a" href={`tel:${h.phone}`}>
                          <Phone size={13} strokeWidth={1.75} />
                          Call
                        </Button>
                      )}
                      <Button size="sm" onClick={() => navigate('/patient/history')}>
                        Get directions
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
              : filteredDoctors.map((d, i) => {
                const docName = d.name ?? d.displayName ?? 'Doctor'
                const avatar = doctorAvatars[d.id]
                return (
                  <motion.div key={d.id} variants={fadeRise} style={{ transitionDelay: `${i * 40}ms` }}>
                    <GlassCard variant="interactive" className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        {avatar ? (
                          <img src={avatar} alt={docName} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-violet))' }}>
                            {docName.charAt(4).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{docName}</h3>
                            {d.credentials && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.credentials}</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {d.specialty && (
                              <Badge variant="teal">{getSpecialtyLabel(d.specialty)}</Badge>
                            )}
                            <Badge variant={d.badge === 'hospital_verified' ? 'success' : 'teal'}>
                              {d.badge === 'hospital_verified' ? 'Hospital verified' : 'NPI verified'}
                            </Badge>
                          </div>
                          {d.avgRating && (
                            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <Star size={11} strokeWidth={1.75} className="fill-[var(--accent-amber)] text-[var(--accent-amber)]" />
                              <span className="font-semibold">{d.avgRating}</span>
                              {d.totalReviews && <span style={{ color: 'var(--text-muted)' }}>({d.totalReviews} reviews)</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      {d.bio && (
                        <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{d.bio}</p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setBookingDoctor(d)}>
                          <Calendar size={13} strokeWidth={1.75} />
                          Book appointment
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => navigate('/patient/history')}>
                          View profile
                        </Button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )
              })
            }
          </motion.div>
        </div>

        {/* Map */}
        <div className={`w-full md:w-[420px] shrink-0 ${activeTab === 'list' ? 'hidden md:block' : ''}`}>
          <div className="sticky top-4">
            <div className="rounded-2xl overflow-hidden" style={{ height: 600 }}>
              <ProviderMap
                markers={mapMarkers}
                centerLat={patient?.lat}
                centerLng={patient?.lng}
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
