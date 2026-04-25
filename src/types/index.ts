import type { GeoPoint, Timestamp } from 'firebase/firestore'

export type Role = 'admin' | 'hospital' | 'doctor' | 'patient'

export type User = {
  email: string
  role: Role
  createdAt: Timestamp
}

export type Patient = {
  uid: string
  age: number
  gender: 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say'
  location: GeoPoint
  lat: number
  lng: number
}

export type ERStatus = 'low' | 'moderate' | 'high' | 'closed'

export type HospitalStatus = 'pending' | 'approved' | 'denied'

export type CMSHospitalData = {
  facility_id?: string
  facility_name?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  phone_number?: string
  hospital_type?: string
  hospital_ownership?: string
  emergency_services?: string
  overall_rating?: string
  raw?: unknown
}

export type CMSBenchmarks = {
  avgERWaitMinutes: number | null
  imagingEfficiencyScore: number | null
}

export type Hospital = {
  uid: string
  name: string
  email?: string
  status: HospitalStatus
  createdAt?: Timestamp
  approvedAt?: Timestamp
  supportingDocuments?: string
  cms_data?: CMSHospitalData
  cms_benchmarks?: CMSBenchmarks
  er_status?: ERStatus
  er_updated?: Timestamp
  coordinates?: GeoPoint
  lat?: number
  lng?: number
}

export type NPPESData = {
  npi: string
  name: string
  credential: string
  specialty: string
  organizationName?: string
  practiceAddress?: string
  active: boolean
}

export type VerificationBadge = 'hospital_verified' | 'npi_verified'

export type Doctor = {
  uid: string
  npi: string
  npi_data?: NPPESData
  verified: boolean
  badge: VerificationBadge
  specialty: string
  name?: string
  displayName?: string
  address?: string
  badgeUpdatedAt?: Timestamp
  coordinates?: GeoPoint
  lat?: number
  lng?: number
}

export type ScanType = 'MRI' | 'CT Scan' | 'X-Ray' | 'Ultrasound'

export type MRISlot = {
  hospitalId: string
  datetime: Timestamp
  available: boolean
  type: ScanType
}

export type DoctorSlot = {
  doctorId: string
  datetime: Timestamp
  available: boolean
  status?: string
  durationMinutes?: number
}

export type CareType = 'er' | 'urgent' | 'telehealth' | 'wait'

export type Urgency = 'immediate' | 'soon' | 'routine'

export type TriageResult = {
  care_type: CareType
  urgency: Urgency
  reasoning: string
  red_flags: string[]
}

export type ProviderType = 'hospital' | 'doctor'

export type CareJourney = {
  patientId: string
  symptoms?: string
  triage_result?: TriageResult
  provider_type?: ProviderType
  selected_provider_id?: string
  appointment_datetime?: Timestamp
  pre_visit_summary?: string
  createdAt: Timestamp
}

export type WithId<T> = T & { id: string }
