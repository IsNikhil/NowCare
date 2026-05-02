import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api'
import { MAPS_API_KEY, DEFAULT_MAP_OPTIONS } from '../../services/maps'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { haversine } from '../../lib/haversine'

export type MapMarker = {
  id: string
  lat: number
  lng: number
  label: string
  type: 'verified' | 'cms'
  kind?: 'hospital' | 'doctor'
  address?: string
  phone?: string
  email?: string
  subtitle?: string
}

type ProviderMapProps = {
  markers: MapMarker[]
  centerLat?: number
  centerLng?: number
  userLat?: number
  userLng?: number
  focusedMarkerId?: string | null
  focusVersion?: number
  onMarkerSelect?: (marker: MapMarker) => void
}

const containerStyle = { width: '100%', height: '100%' }


export function ProviderMap({
  markers,
  centerLat = 30.5044,
  centerLng = -90.4612,
  userLat,
  userLng,
  focusedMarkerId,
  focusVersion = 0,
  onMarkerSelect,
}: ProviderMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: MAPS_API_KEY,
  })

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      const focusedMarker = focusedMarkerId ? markers.find((m) => m.id === focusedMarkerId) : null
      if (focusedMarker) {
        map.setCenter({ lat: focusedMarker.lat, lng: focusedMarker.lng })
        map.setZoom(15)
        setSelectedId(focusedMarker.id)
      } else if (markers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }))
        map.fitBounds(bounds)
      } else {
        map.setCenter({ lat: centerLat, lng: centerLng })
        map.setZoom(11)
      }
    },
    [focusedMarkerId, markers, centerLat, centerLng]
  )

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !focusedMarkerId) return
    const marker = markers.find((m) => m.id === focusedMarkerId)
    if (!marker) return
    mapRef.current.panTo({ lat: marker.lat, lng: marker.lng })
    mapRef.current.setZoom(16)
    setSelectedId(marker.id)
  }, [focusVersion, focusedMarkerId, isLoaded, markers])

  if (!MAPS_API_KEY || MAPS_API_KEY === 'REPLACE_ME') {
    return (
      <div className="w-full h-full glass-1 rounded-2xl flex items-center justify-center">
        <p className="text-sm text-slate-400 text-center p-4">
          Map requires a Google Maps API key.<br />
          Add VITE_GOOGLE_MAPS_API_KEY to your .env file.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full glass-1 rounded-2xl flex items-center justify-center">
        <LoadingSpinner size="md" className="text-teal-500" />
      </div>
    )
  }

  const selectedMarker = markers.find((m) => m.id === selectedId)

  function selectMarker(marker: MapMarker) {
    setSelectedId(marker.id)
    mapRef.current?.panTo({ lat: marker.lat, lng: marker.lng })
    mapRef.current?.setZoom(16)
    onMarkerSelect?.(marker)
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        options={{
          ...DEFAULT_MAP_OPTIONS,
          gestureHandling: 'greedy',
          draggable: true,
          scrollwheel: true,
          clickableIcons: false,
          keyboardShortcuts: true,
        }}
        onLoad={onLoad}
        onClick={() => setSelectedId(null)}
      >
        {markers.map((m) => {
          const isSelected = m.id === selectedId
          return (
          <MarkerF
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.label}
            zIndex={isSelected ? 20 : 1}
            onClick={() => selectMarker(m)}
            icon={
              m.type === 'verified'
                ? {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#14b8a6',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: isSelected ? 2 : 1,
                    scale: isSelected ? 8 : 4.5,
                  }
                : {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#ffffff',
                    fillOpacity: 0.9,
                    strokeColor: '#94a3b8',
                    strokeWeight: isSelected ? 2 : 1,
                    scale: isSelected ? 7 : 4,
                  }
            }
          />
          )
        })}

        {selectedMarker && (
          <InfoWindowF
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedId(null)}
          >
            <div className="p-1 max-w-[220px]">
              <p className="font-semibold text-sm text-slate-800 mb-1">{selectedMarker.label}</p>
              {selectedMarker.subtitle && (
                <p className="text-xs text-teal-700 font-medium mb-1">{selectedMarker.subtitle}</p>
              )}
              {selectedMarker.address && (
                <p className="text-xs text-slate-500 mb-0.5">{selectedMarker.address}</p>
              )}
              {selectedMarker.phone && (
                <p className="text-xs text-slate-500 mb-1">{selectedMarker.phone}</p>
              )}
              {userLat && userLng && (() => {
                const distMi = haversine(userLat, userLng, selectedMarker.lat, selectedMarker.lng) * 0.621371
                return (
                  <p className="text-xs font-semibold text-teal-700 mt-1">
                    {distMi < 0.1 ? 'Less than 0.1 mi away' : `${distMi.toFixed(1)} mi away`}
                  </p>
                )
              })()}
              <div className="mt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${selectedMarker.lat},${selectedMarker.lng}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  Directions ↗
                </a>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 inline-block shrink-0" />
          <span className="text-slate-600">NowCare verified</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full border border-slate-400 inline-block shrink-0" />
          <span className="text-slate-600">CMS listed - call ahead</span>
        </div>
      </div>
    </div>
  )
}
