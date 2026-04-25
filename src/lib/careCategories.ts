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
  subhead: string
  icon: string
  color: string
  bgClass: string
  borderClass: string
  glowClass: string
  urgencyLabel: string
  providerType: string
  ctaLabel: string
}

export const CARE_CATEGORY_CONFIG: Record<CareCategory, CareCategoryConfig> = {
  ER_NOW: {
    label: 'Emergency Room',
    headline: 'Go to the ER now',
    subhead: 'Based on what you described, this needs immediate attention. Call 911 or get to the nearest emergency department.',
    icon: 'Siren',
    color: '#f97066',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    glowClass: 'shadow-glow-coral',
    urgencyLabel: 'Immediate attention needed',
    providerType: 'hospital',
    ctaLabel: 'Find nearest ER',
  },
  URGENT_TODAY: {
    label: 'Urgent Care Today',
    headline: 'See a doctor today',
    subhead: 'See a doctor with same-day availability or visit your nearest urgent care center.',
    icon: 'Clock',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    glowClass: 'shadow-glow-amber',
    urgencyLabel: 'See a provider today',
    providerType: 'doctor',
    ctaLabel: 'Find same-day care',
  },
  SCAN_NEEDED: {
    label: 'Scan Needed',
    headline: 'Get a scan',
    subhead: 'A scan would help your doctor see what is going on. We will find the nearest open slot.',
    icon: 'Scan',
    color: '#a78bfa',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/30',
    glowClass: 'shadow-glow-violet',
    urgencyLabel: 'Schedule imaging soon',
    providerType: 'hospital',
    ctaLabel: 'Find scan slots',
  },
  TELEHEALTH: {
    label: 'Telehealth',
    headline: 'Try telehealth',
    subhead: 'A video or phone consultation should be enough to handle this. Faster than a clinic visit.',
    icon: 'Video',
    color: '#14b8a6',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/30',
    glowClass: 'shadow-glow-teal',
    urgencyLabel: 'Remote care available',
    providerType: 'doctor',
    ctaLabel: 'Find telehealth providers',
  },
  SCHEDULE_DOCTOR: {
    label: 'Schedule Appointment',
    headline: 'Schedule with a doctor',
    subhead: 'This is not urgent, but it is worth seeing a doctor in the next few days. Here are providers in your area.',
    icon: 'CalendarDays',
    color: '#14b8a6',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/30',
    glowClass: 'shadow-glow-teal',
    urgencyLabel: 'Routine care',
    providerType: 'doctor',
    ctaLabel: 'Browse providers',
  },
  SELF_CARE: {
    label: 'Self-Care',
    headline: 'Take care at home',
    subhead: 'Based on what you described, this can probably be managed at home for now. Here is what to watch for.',
    icon: 'Leaf',
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    glowClass: '',
    urgencyLabel: 'No urgent visit needed',
    providerType: 'doctor',
    ctaLabel: 'Run another assessment',
  },
}
