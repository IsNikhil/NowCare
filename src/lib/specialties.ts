export type Specialty = {
  id: string
  label: string
  icon: string
  group: string
}

export const SPECIALTIES: Specialty[] = [
  { id: 'internal_medicine', label: 'Internal Medicine', icon: 'Stethoscope', group: 'Primary Care' },
  { id: 'family_medicine', label: 'Family Medicine', icon: 'Users', group: 'Primary Care' },
  { id: 'pediatrics', label: 'Pediatrics', icon: 'Baby', group: 'Primary Care' },
  { id: 'cardiology', label: 'Cardiology', icon: 'HeartPulse', group: 'Specialty' },
  { id: 'neurology', label: 'Neurology', icon: 'Brain', group: 'Specialty' },
  { id: 'neurosurgery', label: 'Neurosurgery', icon: 'Activity', group: 'Surgical' },
  { id: 'orthopedics', label: 'Orthopedics', icon: 'Bone', group: 'Surgical' },
  { id: 'dermatology', label: 'Dermatology', icon: 'Hand', group: 'Specialty' },
  { id: 'dentistry', label: 'Dentistry', icon: 'Smile', group: 'Dental' },
  { id: 'oral_surgery', label: 'Oral Surgery', icon: 'Smile', group: 'Dental' },
  { id: 'obgyn', label: "Obstetrics & Gynecology", icon: 'Flower', group: "Women's Health" },
  { id: 'psychiatry', label: 'Psychiatry', icon: 'Brain', group: 'Mental Health' },
  { id: 'psychology', label: 'Psychology', icon: 'MessagesSquare', group: 'Mental Health' },
  { id: 'ophthalmology', label: 'Ophthalmology', icon: 'Eye', group: 'Specialty' },
  { id: 'ent', label: 'ENT (Ear, Nose & Throat)', icon: 'Ear', group: 'Specialty' },
  { id: 'urology', label: 'Urology', icon: 'Droplet', group: 'Specialty' },
  { id: 'gastroenterology', label: 'Gastroenterology', icon: 'Activity', group: 'Specialty' },
  { id: 'endocrinology', label: 'Endocrinology', icon: 'FlaskConical', group: 'Specialty' },
  { id: 'oncology', label: 'Oncology', icon: 'Ribbon', group: 'Specialty' },
  { id: 'pulmonology', label: 'Pulmonology', icon: 'Wind', group: 'Specialty' },
  { id: 'nephrology', label: 'Nephrology', icon: 'Droplets', group: 'Specialty' },
  { id: 'rheumatology', label: 'Rheumatology', icon: 'Bone', group: 'Specialty' },
  { id: 'emergency_medicine', label: 'Emergency Medicine', icon: 'Siren', group: 'Acute' },
  { id: 'radiology', label: 'Radiology', icon: 'Scan', group: 'Diagnostic' },
  { id: 'anesthesiology', label: 'Anesthesiology', icon: 'Syringe', group: 'Surgical' },
  { id: 'physical_therapy', label: 'Physical Therapy', icon: 'Dumbbell', group: 'Rehabilitation' },
]

export const SPECIALTY_GROUPS = [
  'Primary Care',
  'Specialty',
  'Surgical',
  'Dental',
  "Women's Health",
  'Mental Health',
  'Diagnostic',
  'Acute',
  'Rehabilitation',
]

export function getSpecialtyLabel(id: string): string {
  return SPECIALTIES.find((s) => s.id === id)?.label ?? id
}

export function getSpecialtyById(id: string): Specialty | undefined {
  return SPECIALTIES.find((s) => s.id === id)
}
