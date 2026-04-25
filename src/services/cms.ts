import type { CMSHospitalData, CMSBenchmarks } from '../types'

const GENERAL_URL = 'https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0'
const TIMELY_URL = 'https://data.cms.gov/provider-data/api/1/datastore/query/yv7e-xc69/0'

type CMSCondition = {
  property: string
  value: string
  operator: string
}

type CMSQueryBody = {
  conditions: CMSCondition[]
  limit: number
}

async function cmsPost(url: string, body: CMSQueryBody): Promise<unknown[]> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return []
  const json = await res.json() as { results?: unknown[] }
  return json.results ?? []
}

export async function fetchHospitalData(name: string): Promise<CMSHospitalData | null> {
  try {
    const results = await cmsPost(GENERAL_URL, {
      conditions: [{ property: 'facility_name', value: name, operator: 'contains' }],
      limit: 1,
    })
    if (results.length === 0) return null
    const r = results[0] as Record<string, string>
    return {
      facility_id: r['facility_id'],
      facility_name: r['facility_name'],
      address: r['address'],
      city: r['city'],
      state: r['state'],
      zip_code: r['zip_code'],
      phone_number: r['phone_number'],
      hospital_type: r['hospital_type'],
      hospital_ownership: r['hospital_ownership'],
      emergency_services: r['emergency_services'],
      overall_rating: r['hospital_overall_rating'],
      raw: r,
    }
  } catch {
    throw new Error('CMS fetch failed')
  }
}

export async function fetchBenchmarks(name: string): Promise<CMSBenchmarks> {
  try {
    const results = await cmsPost(TIMELY_URL, {
      conditions: [{ property: 'facility_name', value: name, operator: 'contains' }],
      limit: 20,
    })

    let avgERWaitMinutes: number | null = null
    let imagingEfficiencyScore: number | null = null

    for (const item of results) {
      const row = item as Record<string, string | number>
      const measureId = row['measure_id'] as string | undefined
      const score = row['score']
      if (score === undefined || score === null || score === 'Not Available') continue
      const num = typeof score === 'number' ? score : parseFloat(String(score))
      if (isNaN(num)) continue

      if (measureId === 'ED_1b' || measureId === 'OP_18b') {
        avgERWaitMinutes = num
      } else if (measureId === 'OP_8' || measureId === 'OP_10') {
        imagingEfficiencyScore = num
      }
    }

    return { avgERWaitMinutes, imagingEfficiencyScore }
  } catch {
    throw new Error('CMS benchmarks fetch failed')
  }
}
