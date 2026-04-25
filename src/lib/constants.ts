import type { ERStatus, ScanType, CareType, Urgency } from '../types'

export const ER_STATUS_OPTIONS: { value: ERStatus; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'emerald' },
  { value: 'moderate', label: 'Moderate', color: 'amber' },
  { value: 'high', label: 'High', color: 'coral' },
  { value: 'closed', label: 'Closed', color: 'slate' },
]

export const SCAN_TYPES: ScanType[] = ['MRI', 'CT Scan', 'X-Ray', 'Ultrasound']

export const TRIAGE_LEVELS: {
  care_type: CareType
  label: string
  headline: string
  color: string
  urgencyLevels: Urgency[]
}[] = [
  {
    care_type: 'er',
    label: 'Emergency Room',
    headline: 'Go to the ER now',
    color: 'coral',
    urgencyLevels: ['immediate'],
  },
  {
    care_type: 'urgent',
    label: 'Urgent Care',
    headline: 'Urgent care recommended',
    color: 'amber',
    urgencyLevels: ['soon'],
  },
  {
    care_type: 'telehealth',
    label: 'Telehealth',
    headline: 'Telehealth visit',
    color: 'teal',
    urgencyLevels: ['routine', 'soon'],
  },
  {
    care_type: 'wait',
    label: 'Monitor at Home',
    headline: 'Safe to wait and monitor',
    color: 'emerald',
    urgencyLevels: ['routine'],
  },
]

export const RADIUS_KM = 40
