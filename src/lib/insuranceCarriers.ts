export interface InsuranceCarrier {
  id: string
  display_name: string
  category: 'national' | 'regional' | 'government' | 'marketplace'
  aliases?: string[]
}

export const INSURANCE_CARRIERS: InsuranceCarrier[] = [
  // National private
  { id: 'blue_cross_blue_shield', display_name: 'Blue Cross Blue Shield', category: 'national', aliases: ['BCBS', 'Blue Cross', 'Blue Shield'] },
  { id: 'united_healthcare', display_name: 'UnitedHealthcare', category: 'national', aliases: ['UHC', 'United Health'] },
  { id: 'aetna', display_name: 'Aetna', category: 'national' },
  { id: 'cigna', display_name: 'Cigna', category: 'national' },
  { id: 'humana', display_name: 'Humana', category: 'national' },
  { id: 'kaiser_permanente', display_name: 'Kaiser Permanente', category: 'national' },
  { id: 'anthem', display_name: 'Anthem', category: 'national' },
  { id: 'molina', display_name: 'Molina Healthcare', category: 'national' },
  { id: 'centene', display_name: 'Centene / Ambetter', category: 'national' },
  { id: 'wellcare', display_name: 'WellCare', category: 'national' },
  { id: 'oscar', display_name: 'Oscar Health', category: 'national' },

  // Government
  { id: 'medicare_original', display_name: 'Medicare (Original)', category: 'government' },
  { id: 'medicare_advantage', display_name: 'Medicare Advantage', category: 'government' },
  { id: 'medicaid', display_name: 'Medicaid', category: 'government' },
  { id: 'tricare', display_name: 'TRICARE', category: 'government', aliases: ['Military'] },
  { id: 'va_health', display_name: 'VA Health Care', category: 'government' },
  { id: 'chip', display_name: "CHIP (Children's Health Insurance Program)", category: 'government' },

  // Marketplace
  { id: 'marketplace_aca', display_name: 'Healthcare.gov Marketplace Plan', category: 'marketplace' },

  // Self-pay / other
  { id: 'self_pay', display_name: 'Self-pay / Uninsured', category: 'national' },
  { id: 'other', display_name: 'Other / Not listed', category: 'national' },
]

export function getCarrierById(id: string): InsuranceCarrier | undefined {
  return INSURANCE_CARRIERS.find((c) => c.id === id)
}

export function getCarriersByCategory(category: InsuranceCarrier['category']): InsuranceCarrier[] {
  return INSURANCE_CARRIERS.filter((c) => c.category === category)
}

export const CARRIER_OPTIONS = INSURANCE_CARRIERS.map((c) => ({
  value: c.id,
  label: c.display_name,
}))
