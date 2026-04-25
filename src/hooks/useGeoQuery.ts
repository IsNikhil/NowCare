import { useMemo } from 'react'
import { haversine } from '../lib/haversine'
import type { WithId } from '../types'

type HasCoords = { lat?: number; lng?: number }

export function useGeoQuery<T extends HasCoords>(
  items: WithId<T>[],
  centerLat: number | null,
  centerLng: number | null,
  radiusKm: number
): Array<WithId<T> & { distanceKm: number }> {
  return useMemo(() => {
    if (centerLat === null || centerLng === null) return []

    return items
      .filter((item) => item.lat !== undefined && item.lng !== undefined)
      .map((item) => ({
        ...item,
        distanceKm: haversine(centerLat, centerLng, item.lat!, item.lng!),
      }))
      .filter((item) => item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [items, centerLat, centerLng, radiusKm])
}
