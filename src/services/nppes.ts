import type { NPPESData } from '../types'

export async function verifyNPI(npi: string): Promise<NPPESData | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)

  try {
    const url = `https://npiregistry.cms.hhs.gov/api/?number=${encodeURIComponent(npi)}&version=2.1`
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error('Network error')

    const json = await res.json() as {
      result_count: number
      results: Array<{
        basic?: {
          first_name?: string
          last_name?: string
          organization_name?: string
          credential?: string
          status?: string
        }
        taxonomies?: Array<{ desc?: string }>
        addresses?: Array<{
          address_purpose?: string
          address_1?: string
          city?: string
          state?: string
          postal_code?: string
        }>
      }>
    }

    if (!json.results || json.results.length === 0) return null

    const r = json.results[0]
    const basic = r.basic ?? {}

    if (basic.status !== 'A') return null

    const tax = r.taxonomies?.[0] ?? {}
    const locationAddr =
      r.addresses?.find((a) => a.address_purpose === 'LOCATION') ??
      r.addresses?.[0] ??
      {}

    const name =
      basic.organization_name ||
      `${basic.first_name ?? ''} ${basic.last_name ?? ''}`.trim() ||
      'Unknown'

    const practiceAddress = [locationAddr.city, locationAddr.state]
      .filter(Boolean)
      .join(', ')

    return {
      npi,
      name,
      credential: basic.credential ?? '',
      specialty: tax.desc ?? '',
      organizationName: basic.organization_name ?? '',
      practiceAddress,
      active: true,
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw new Error('Network error')
    if (err instanceof Error && err.message === 'Network error') throw err
    throw new Error('Network error')
  } finally {
    clearTimeout(timeout)
  }
}
