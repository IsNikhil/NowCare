export type CareCategory =
  | 'ER_NOW'
  | 'URGENT_TODAY'
  | 'SCAN_NEEDED'
  | 'TELEHEALTH'
  | 'SCHEDULE_DOCTOR'
  | 'SELF_CARE'

export type Urgency = 'immediate' | 'soon' | 'routine'

export type CareCategoryConfig = {
  label: string
  headline: string
  icon: string
  color: string
  bgClass: string
  borderClass: string
  glowClass: string
  urgencyLabel: string
  providerType: string
}

export const CARE_CATEGORY_CONFIG: Record<CareCategory, CareCategoryConfig> = {
  ER_NOW: {
    label: 'Emergency Room',
    headline: 'Go to the ER now',
    icon: 'Siren',
    color: '#f97066',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    glowClass: 'shadow-glow-coral',
    urgencyLabel: 'Immediate attention needed',
    providerType: 'hospital',
  },
  URGENT_TODAY: {
    label: 'Urgent Care Today',
    headline: 'See a doctor today',
    icon: 'Clock',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    glowClass: 'shadow-glow-amber',
    urgencyLabel: 'See a provider soon',
    providerType: 'doctor',
  },
  SCAN_NEEDED: {
    label: 'Imaging Needed',
    headline: 'Get imaging done',
    icon: 'Scan',
    color: '#a78bfa',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/30',
    glowClass: 'shadow-glow-violet',
    urgencyLabel: 'Schedule imaging soon',
    providerType: 'hospital',
  },
  TELEHEALTH: {
    label: 'Telehealth',
    headline: 'Telehealth visit',
    icon: 'Video',
    color: '#14b8a6',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/30',
    glowClass: 'shadow-glow-teal',
    urgencyLabel: 'Remote care is sufficient',
    providerType: 'doctor',
  },
  SCHEDULE_DOCTOR: {
    label: 'Schedule Appointment',
    headline: 'Schedule with a doctor',
    icon: 'CalendarDays',
    color: '#14b8a6',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/30',
    glowClass: 'shadow-glow-teal',
    urgencyLabel: 'Routine care',
    providerType: 'doctor',
  },
  SELF_CARE: {
    label: 'Self-Care',
    headline: 'Rest and monitor at home',
    icon: 'Leaf',
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    glowClass: '',
    urgencyLabel: 'No urgent visit needed',
    providerType: 'doctor',
  },
}
