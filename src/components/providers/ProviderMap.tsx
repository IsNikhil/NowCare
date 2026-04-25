import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api'
import { MAPS_API_KEY, DEFAULT_MAP_OPTIONS } from '../../services/maps'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export type MapMarker = {
  id: string
  lat: number
  lng: number
  label: string
  type: 'verified' | 'cms'
  address?: string
  phone?: string
}

type ProviderMapProps = {
  markers: MapMarker[]
  centerLat?: number
  centerLng?: number
  focusedMarkerId?: string | null
}

const containerStyle = { width: '100%', height: '100%' }

export function ProviderMap({ markers, centerLat = 30.5044, centerLng = -90.4612, focusedMarkerId }: ProviderMapProps) {
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
    mapRef.current.setZoom(15)
    setSelectedId(marker.id)
  }, [focusedMarkerId, isLoaded, markers])

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

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        options={DEFAULT_MAP_OPTIONS}
        onLoad={onLoad}
        onClick={() => setSelectedId(null)}
      >
        {markers.map((m) => (
          <MarkerF
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.label}
            onClick={() => setSelectedId(m.id)}
            icon={
              m.type === 'verified'
                ? {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#14b8a6',
                    fillOpacity: 1,
                    strokeWeight: 0,
                    scale: 10,
                  }
                : {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#ffffff',
                    fillOpacity: 0.9,
                    strokeColor: '#94a3b8',
                    strokeWeight: 2,
                    scale: 7,
                  }
            }
          />
        ))}

        {selectedMarker && (
          <InfoWindowF
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedId(null)}
          >
            <div className="p-1 max-w-[200px]">
              <p className="font-semibold text-sm text-slate-800 mb-1">{selectedMarker.label}</p>
              {selectedMarker.address && (
                <p className="text-xs text-slate-500 mb-0.5">{selectedMarker.address}</p>
              )}
              {selectedMarker.phone && (
                <p className="text-xs text-slate-500 mb-1">{selectedMarker.phone}</p>
              )}
              {selectedMarker.type === 'cms' && (
                <p className="text-xs text-slate-400 italic">Not on NowCare yet - call to check availability</p>
              )}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-teal-500 inline-block shrink-0" />
          <span className="text-slate-600">NowCare verified</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-slate-400 inline-block shrink-0" />
          <span className="text-slate-600">CMS listed - call ahead</span>
        </div>
      </div>
    </div>
  )
}
