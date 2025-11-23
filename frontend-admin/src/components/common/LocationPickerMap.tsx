import React from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngExpression, LeafletMouseEvent } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const markerIcon = new L.Icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type LatLng = { lat: number; lng: number }

interface LocationPickerMapProps {
  value: LatLng | null
  onChange: (coords: LatLng) => void
  bounds?: LatLngBoundsExpression
}

const MapClickHandler: React.FC<{ onSelect: (coords: LatLng) => void }> = ({ onSelect }) => {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

const DEFAULT_CENTER: LatLng = { lat: 10.776889, lng: 106.700806 } // Ho Chi Minh City

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ value, onChange, bounds }) => {
  const center: LatLngExpression = value ?? DEFAULT_CENTER

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom
      maxBounds={bounds}
      maxBoundsViscosity={bounds ? 1 : undefined}
      style={{ height: 420, width: '100%', borderRadius: 12, overflow: 'hidden' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {value && <Marker position={value as LatLngExpression} icon={markerIcon} />}
      <MapClickHandler onSelect={onChange} />
    </MapContainer>
  )
}

export default LocationPickerMap
