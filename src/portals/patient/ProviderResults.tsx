import { useState, useMemo } from 'react'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { where, orderBy, doc, updateDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { useGeoQuery } from '../../hooks/useGeoQuery'
import { HospitalProviderCard, DoctorProviderCard } from '../../components/providers/ProviderCard'
import { ProviderMap } from '../../components/providers/ProviderMap'
import type { MapMarker } from '../../components/providers/ProviderMap'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { RADIUS_KM } from '../../lib/constants'
import { useToastContext } from '../../context/ToastContext'
import { formatDate, formatTime } from '../../lib/format'
import type { Patient, Hospital, Doctor, DoctorSlot, CareType, WithId } from '../../types'

type LocationState = { journeyId?: string } | null

const pageTitles: Record<CareType, string> = {
  er: 'Emergency care near you',
  urgent: 'Doctors available today',
  telehealth: 'Doctors available now',
  wait: 'Schedule an appointment',
}

// Booking modal — mounts fresh per open/close, so the slot query always runs against the current doctor
function BookingModal({
  doctor,
  patientId,
  onClose,
}: {
  doctor: WithId<Doctor>
  patientId: string
  onClose: () => void
}) {
  const { addToast } = useToastContext()
  const now = useMemo(() => new Date(), [])
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null)
  const [bookError, setBookError] = useState<string | null>(null)

  const { data: availableSlots, loading } = useFirestoreCollection<DoctorSlot>(
    'doctor_slots',
    [
      where('doctorId', '==', doctor.id),
      where('available', '==', true),
      where('datetime', '>=', Timestamp.fromDate(now)),
      orderBy('datetime', 'asc'),
    ]
  )

  async function handleBook(slot: WithId<DoctorSlot>) {
    setBookingSlotId(slot.id)
    setBookError(null)
    try {
      await updateDoc(doc(db, 'doctor_slots', slot.id), {
        available: false,
        status: 'reserved',
        patientId,
        bookedAt: serverTimestamp(),
      })
      await addDoc(collection(db, 'care_journeys'), {
        patientId,
        selected_provider_id: doctor.id,
        provider_type: 'doctor',
        appointment_datetime: slot.datetime,
        createdAt: serverTimestamp(),
      })
      addToast(
        'success',
        `Appointment booked for ${formatDate(slot.datetime)} at ${formatTime(slot.datetime)}.`
      )
      onClose()
    } catch {
      setBookError('Could not book appointment. Please try again.')
    } finally {
      setBookingSlotId(null)
    }
  }

  const doctorName = doctor.npi_data?.name ?? doctor.name ?? 'Doctor'

  return (
    <Modal open onClose={onClose} title="Book appointment" maxWidth="md">
      <p className="font-semibold text-ink-800">{doctorName}</p>
      {doctor.specialty && (
        <p className="text-sm text-slate-500 mb-4">{doctor.specialty}</p>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" className="text-teal-500" />
        </div>
      )}

      {!loading && availableSlots.length === 0 && (
        <p className="text-sm text-slate-400 py-4">No available slots for this doctor.</p>
      )}

      {!loading && availableSlots.length > 0 && (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mt-2">
          {availableSlots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between p-3 glass-1 rounded-2xl"
            >
              <div>
                <p className="text-sm font-medium text-ink-800">{formatDate(slot.datetime)}</p>
                <p className="text-xs text-slate-500">
                  {formatTime(slot.datetime)}
                  {slot.durationMinutes ? ` · ${slot.durationMinutes} min` : ''}
                </p>
              </div>
              <Button
                size="sm"
                loading={bookingSlotId === slot.id}
                disabled={bookingSlotId !== null}
                onClick={() => handleBook(slot)}
              >
                Book
              </Button>
            </div>
          ))}
        </div>
      )}

      {bookError && <p className="text-sm text-rose-500 mt-3">{bookError}</p>}
    </Modal>
  )
}

export default function ProviderResultsPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToastContext()

  const careType = (searchParams.get('type') ?? 'urgent') as CareType
  const journeyId = (location.state as LocationState)?.journeyId

  const [selectedSpecialty, setSelectedSpecialty] = useState(
    searchParams.get('specialty') ?? ''
  )
  const [bookingDoctor, setBookingDoctor] = useState<WithId<Doctor> | null>(null)

  const { data: patient, loading: patientLoading } = useFirestoreDoc<Patient>(
    user ? `patients/${user.uid}` : ''
  )

  const { data: hospitals, loading: hospitalsLoading } = useFirestoreCollection<Hospital>(
    'hospitals',
    [where('status', '==', 'approved')]
  )

  const { data: doctors, loading: doctorsLoading } = useFirestoreCollection<Doctor>(
    'doctors',
    []
  )

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return Timestamp.fromDate(d)
  }, [])

  const todayEnd = useMemo(() => {
    const d = new Date()
    d.setHours(23, 59, 59, 999)
    return Timestamp.fromDate(d)
  }, [])

  const { data: todaySlots } = useFirestoreCollection<DoctorSlot>(
    careType === 'urgent' ? 'doctor_slots' : '',
    [
      where('available', '==', true),
      where('datetime', '>=', todayStart),
      where('datetime', '<=', todayEnd),
    ]
  )

  const doctorIdsWithTodaySlots = useMemo(
    () => new Set(todaySlots.map((s) => s.doctorId)),
    [todaySlots]
  )

  const nearbyHospitals = useGeoQuery(
    hospitals,
    patient?.lat ?? null,
    patient?.lng ?? null,
    RADIUS_KM
  )

  const nearbyDoctors = useGeoQuery(
    doctors,
    patient?.lat ?? null,
    patient?.lng ?? null,
    RADIUS_KM
  )

  const displayedHospitals = nearbyHospitals.filter(() => careType === 'er')

  const baseDoctors = nearbyDoctors.filter(() =>
    careType === 'telehealth' || careType === 'urgent' || careType === 'wait'
  )

  const displayedDoctors = (() => {
    let docs = baseDoctors
    if (careType === 'urgent') docs = docs.filter((d) => doctorIdsWithTodaySlots.has(d.id))
    if (selectedSpecialty) docs = docs.filter((d) => d.specialty === selectedSpecialty)
    return docs
  })()

  const specialtyOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const d of doctors) {
      if (d.specialty?.trim()) seen.add(d.specialty.trim())
    }
    return [
      { value: '', label: 'All specialties' },
      ...[...seen].sort().map((s) => ({ value: s, label: s })),
    ]
  }, [doctors])

  const showHospitals = careType === 'er'
  const showDoctors = careType !== 'er'

  const mapMarkers: MapMarker[] = [
    ...(showHospitals ? displayedHospitals : [])
      .filter((h) => h.lat && h.lng)
      .map((h) => ({
        id: h.id,
        lat: h.lat!,
        lng: h.lng!,
        label: h.name,
        type: (h.er_status ? 'verified' : 'cms') as 'verified' | 'cms',
        address: h.cms_data?.address
          ? `${h.cms_data.address}, ${h.cms_data.city}, ${h.cms_data.state}`
          : undefined,
        phone: h.cms_data?.phone_number,
      })),
    ...(showDoctors ? displayedDoctors : [])
      .filter((d) => d.lat && d.lng)
      .map((d) => ({
        id: d.id,
        lat: d.lat!,
        lng: d.lng!,
        label: d.npi_data?.name ?? 'Doctor',
        type: 'verified' as const,
      })),
  ]

  async function handleSelectHospital(hospitalId: string) {
    if (!journeyId) {
      navigate('/patient/summary', {
        state: { selectedProviderId: hospitalId, providerType: 'hospital' },
      })
      return
    }
    try {
      await updateDoc(doc(db, 'care_journeys', journeyId), {
        provider_type: 'hospital',
        selected_provider_id: hospitalId,
      })
      navigate('/patient/summary', {
        state: { journeyId, selectedProviderId: hospitalId, providerType: 'hospital' },
      })
    } catch {
      addToast('error', 'Could not save provider selection.')
    }
  }

  async function handleSelectDoctor(doctorId: string) {
    if (!journeyId) {
      navigate('/patient/summary', {
        state: { selectedProviderId: doctorId, providerType: 'doctor' },
      })
      return
    }
    try {
      await updateDoc(doc(db, 'care_journeys', journeyId), {
        provider_type: 'doctor',
        selected_provider_id: doctorId,
      })
      navigate('/patient/summary', {
        state: { journeyId, selectedProviderId: doctorId, providerType: 'doctor' },
      })
    } catch {
      addToast('error', 'Could not save provider selection.')
    }
  }

  const loading = patientLoading || hospitalsLoading || doctorsLoading
  const hasResults =
    (showHospitals && displayedHospitals.length > 0) ||
    (showDoctors && displayedDoctors.length > 0)

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-800 tracking-tight mb-6">
        {pageTitles[careType]}
      </h1>

      {careType === 'urgent' && (
        <p className="text-sm text-slate-600 mb-4 px-1">
          See a doctor with same-day availability or visit your nearest urgent care center.
        </p>
      )}

      <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          {loading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {!loading && !hasResults && (
            <EmptyState
              title="No providers found nearby"
              description={`No matching providers found within ${RADIUS_KM} km of your location. Try a different care type or check your location settings.`}
            />
          )}

          {!loading && showHospitals && displayedHospitals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
                Hospitals
              </p>
              <div className="flex flex-col gap-3">
                {displayedHospitals.map((h) => (
                  <HospitalProviderCard
                    key={h.id}
                    provider={h}
                    onSelect={() => handleSelectHospital(h.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && showDoctors && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Doctors
                </p>
                {specialtyOptions.length > 1 && (
                  <div className="w-48">
                    <Select
                      options={specialtyOptions}
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {displayedDoctors.length === 0 && (
                <p className="text-sm text-slate-400 py-2">
                  No doctors found{selectedSpecialty ? ` for "${selectedSpecialty}"` : ' nearby'}.
                </p>
              )}

              <div className="flex flex-col gap-3">
                {displayedDoctors.map((d) => (
                  <DoctorProviderCard
                    key={d.id}
                    provider={d}
                    onSelect={() => handleSelectDoctor(d.id)}
                    onBook={() => setBookingDoctor(d)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-[300px] md:h-[600px] md:sticky md:top-4">
          <ProviderMap
            markers={mapMarkers}
            centerLat={patient?.lat}
            centerLng={patient?.lng}
          />
        </div>
      </div>

      {bookingDoctor && user && (
        <BookingModal
          doctor={bookingDoctor}
          patientId={user.uid}
          onClose={() => setBookingDoctor(null)}
        />
      )}
    </div>
  )
}
