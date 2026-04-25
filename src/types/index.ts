import type { GeoPoint, Timestamp } from 'firebase/firestore'
import type { CareCategory, Urgency } from '../lib/careCategories'

export type { CareCategory, Urgency }

export type Role = 'admin' | 'hospital' | 'doctor' | 'patient'

export type User = {
  email: string
  role: Role
  createdAt: Timestamp
}

export type Patient = {
  uid: string
  displayName?: string
  age: number
  gender: 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say'
  photoURL?: string
  height?: string
  weight?: string
  knownDiseases?: string[]
  pastMedications?: string[]
  location?: GeoPoint
  lat?: number
  lng?: number
  allergies?: string[]
  medications?: string[]
  emergencyContact?: string
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
  address?: string
  phone?: string
  type?: string
  services?: string[]
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
  credentials?: string
  address?: string
  bio?: string
  languages?: string[]
  acceptedInsurance?: string[]
  avgRating?: number
  totalReviews?: number
  affiliatedHospitalId?: string
  badgeUpdatedAt?: Timestamp
  coordinates?: GeoPoint
  lat?: number
  lng?: number
}

export type ScanType = 'MRI' | 'CT' | 'X-Ray' | 'Ultrasound'

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
  status?: 'open' | 'reserved' | 'blocked'
  durationMinutes?: number
  bookedByPatientId?: string
}

export type TriageResult = {
  care_category: CareCategory
  urgency: Urgency
  recommended_specialty?: string
  scan_type?: ScanType
  short_reasoning: string
  red_flags: string[]
  what_to_expect: string
}

export type ProviderType = 'hospital' | 'doctor'

export type CareJourney = {
  id?: string
  patientId: string
  symptoms?: string
  triage_result?: TriageResult
  provider_type?: ProviderType
  selected_provider_id?: string
  appointment_datetime?: Timestamp
  pre_visit_summary?: string
  createdAt: Timestamp
}

export type DocumentCategory = 'lab_result' | 'prescription' | 'scan_report' | 'discharge_summary' | 'other'

export type FindingStatus = 'normal' | 'low' | 'high' | 'abnormal' | 'info'

export type DocumentFinding = {
  label: string
  value: string
  reference_range?: string
  status: FindingStatus
  explanation: string
}

export type DocumentMedication = {
  name: string
  dose?: string
  frequency?: string
  purpose: string
}

export type DocumentAnalysis = {
  document_type: string
  date_of_document?: string
  provider_name?: string
  patient_name?: string
  summary: string
  key_findings: DocumentFinding[]
  medications?: DocumentMedication[]
  follow_up_recommendations: string[]
  questions_to_ask_doctor: string[]
  red_flags: string[]
  disclaimer: string
}

export type AnalysisStatus = 'pending' | 'complete' | 'failed'

export type PatientDocument = {
  id?: string
  docId: string
  patientId: string
  filename: string
  storagePath: string
  downloadUrl?: string
  uploadWarning?: string
  contentType: string
  uploadedAt: Timestamp
  category: DocumentCategory
  analysis?: DocumentAnalysis
  analysisStatus: AnalysisStatus
  analysisError?: string
  fileSize?: number
}

export type BookingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export type Booking = {
  bookingId: string
  patientId: string
  doctorId: string
  slotId: string
  scheduled_for: Timestamp
  reason: string
  linked_assessment_id?: string
  linked_documents?: string[]
  pre_visit_briefing?: string
  status: BookingStatus
  created_at: Timestamp
}

export type NotificationType = 'follow_up' | 'booking_confirmation' | 'document_ready' | 'system'

export type AppNotification = {
  notificationId: string
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
  read: boolean
  created_at: Timestamp
}

export type WithId<T> = T & { id: string }

// Legacy compat
export type CareType = 'er' | 'urgent' | 'telehealth' | 'wait'
