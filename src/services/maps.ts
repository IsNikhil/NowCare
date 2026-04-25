export const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

export const DEFAULT_MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#f5f7fa' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  ],
}
