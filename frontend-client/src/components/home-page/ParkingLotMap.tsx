import React, { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useFindParkingLotQuery } from '../../features/findParkingLotAPI'
import { CarOutlined } from '@ant-design/icons'
import './ParkingLotMap.css'

interface ParkingLot {
  _id: string
  name: string
  addressId: {
    latitude: number
    longitude: number
    fullAddress: string
    wardId: {
      wardName: string
    }
  }
  availableSpots: number
  totalCapacityEachLevel: number
  totalLevel: number
  parkingLotStatus: string
}

interface ParkingLotMapProps {
  className?: string
}

const DEFAULT_CENTER: [number, number] = [106.700806, 10.776889] // Ho Chi Minh City [lng, lat]
const DEFAULT_ZOOM = 12

const ParkingLotMap: React.FC<ParkingLotMapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [bounds, setBounds] = useState<{
    bottomLeftLng: number
    bottomLeftLat: number
    topRightLng: number
    topRightLat: number
  } | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Fetch parking lots based on map bounds (only when bounds are set)
  const { data: parkingLotsData, isLoading, error } = useFindParkingLotQuery(
    bounds
      ? {
          ...bounds,
          page: 1,
          pageSize: 100,
        }
      : {
          bottomLeftLng: 106.3,
          bottomLeftLat: 10.35,
          topRightLng: 107.2,
          topRightLat: 11.25,
          page: 1,
          pageSize: 100,
        }
  )

  // Debug: log the response structure
  useEffect(() => {
    if (parkingLotsData) {
      console.log('Parking lots data:', parkingLotsData)
      console.log('Data structure:', {
        data: parkingLotsData?.data,
        isArray: Array.isArray(parkingLotsData?.data),
        length: parkingLotsData?.data?.length,
      })
      
      // Log first parking lot coordinates for debugging
      const firstLot = Array.isArray(parkingLotsData?.data)
        ? parkingLotsData.data[0]
        : Array.isArray(parkingLotsData?.data?.data)
          ? parkingLotsData.data.data[0]
          : Array.isArray(parkingLotsData)
            ? parkingLotsData[0]
            : null
            
      if (firstLot) {
        console.log('First parking lot sample:', {
          name: firstLot.name,
          lat: firstLot.addressId?.latitude,
          lng: firstLot.addressId?.longitude,
          address: firstLot.addressId?.fullAddress,
        })
      }
    }
    if (error) {
      console.error('Error fetching parking lots:', error)
    }
  }, [parkingLotsData, error])

  // Try different possible response structures
  const parkingLots: ParkingLot[] =
    Array.isArray(parkingLotsData?.data)
      ? parkingLotsData.data[0]
      : Array.isArray(parkingLotsData?.data?.data)
        ? parkingLotsData.data.data
        : Array.isArray(parkingLotsData)
          ? parkingLotsData
          : []

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Update bounds when map moves
    const updateBounds = () => {
      if (!map.current) return
      const bounds = map.current.getBounds()
      setBounds({
        bottomLeftLng: bounds.getWest(),
        bottomLeftLat: bounds.getSouth(),
        topRightLng: bounds.getEast(),
        topRightLat: bounds.getNorth(),
      })
    }

    // Wait for map to load before setting initial bounds
    map.current.on('load', () => {
      setMapLoaded(true)
      updateBounds()
    })

    map.current.on('moveend', updateBounds)
    map.current.on('zoomend', updateBounds)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update markers when parking lots data changes
  useEffect(() => {
    if (!map.current || !mapLoaded) {
      console.log('Map not ready yet, map.current:', !!map.current, 'mapLoaded:', mapLoaded)
      return
    }

    console.log('Updating markers, parking lots count:', parkingLots.length)
    console.log('Parking lots:', parkingLots)

    if (!parkingLots.length) {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      return
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Create custom marker HTML
    const createMarkerElement = (_parkingLot: ParkingLot) => {
      const el = document.createElement('div')
      el.className = 'custom-marker'
      // Don't set inline styles that might conflict with MapLibre's positioning
      el.innerHTML = `
        <div class="marker-icon">
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40C16 40 32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#22c55e"/>
            <path d="M16 8C19.314 8 22 10.686 22 14C22 17.314 19.314 20 16 20C12.686 20 10 17.314 10 14C10 10.686 12.686 8 16 8Z" fill="white"/>
            <text x="16" y="18" text-anchor="middle" fill="#22c55e" font-size="10" font-weight="bold">P</text>
          </svg>
        </div>
        <div class="marker-pulse"></div>
      `
      return el
    }

    // Create popup HTML
    const createPopupHTML = (parkingLot: ParkingLot) => {
      return `
        <div class="parking-lot-popup">
          <h4 class="popup-title">${parkingLot.name}</h4>
          <div class="popup-info">
            <div class="popup-address">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 0C3.24 0 1 2.24 1 5C1 8.5 6 12 6 12C6 12 11 8.5 11 5C11 2.24 8.76 0 6 0ZM6 6.5C5.17 6.5 4.5 5.83 4.5 5C4.5 4.17 5.17 3.5 6 3.5C6.83 3.5 7.5 4.17 7.5 5C7.5 5.83 6.83 6.5 6 6.5Z" fill="#6b7280"/>
              </svg>
              <span>${parkingLot.addressId.fullAddress}</span>
            </div>
            <div class="popup-spots">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M10.5 1.5H1.5C0.675 1.5 0 2.175 0 3V9C0 9.825 0.675 10.5 1.5 10.5H10.5C11.325 10.5 12 9.825 12 9V3C12 2.175 11.325 1.5 10.5 1.5ZM10.5 9H1.5V6H10.5V9ZM10.5 4.5H1.5V3H10.5V4.5Z" fill="#22c55e"/>
              </svg>
              <span><strong>${parkingLot.availableSpots}</strong> chỗ trống</span>
            </div>
            <div class="popup-capacity">
              <span>Tổng: ${parkingLot.totalCapacityEachLevel * parkingLot.totalLevel} chỗ</span>
            </div>
          </div>
        </div>
      `
    }

    // Add markers for each parking lot
    parkingLots.forEach((parkingLot, index) => {
      console.log(`Processing parking lot ${index}:`, parkingLot)
      
      // Get raw coordinates
      let lat = Number(parkingLot.addressId?.latitude)
      let lng = Number(parkingLot.addressId?.longitude)
      
      // Check if coordinates might be swapped (lat should be 8-24, lng should be 102-110 for Vietnam)
      // If lat > 100 or lng < 20, they're likely swapped
      if (lat > 100 || lng < 20) {
        console.warn(`Parking lot ${index} (${parkingLot.name}) coordinates appear swapped, fixing...`, {
          originalLat: lat,
          originalLng: lng,
        })
        // Swap them
        ;[lat, lng] = [lng, lat]
      }
      
      // Validate coordinates are valid numbers and within reasonable bounds for Vietnam
      if (
        !parkingLot.addressId?.latitude ||
        !parkingLot.addressId?.longitude ||
        isNaN(lat) ||
        isNaN(lng) ||
        lat < 8 || lat > 24 || // Vietnam latitude range (approximately)
        lng < 102 || lng > 110 // Vietnam longitude range (approximately)
      ) {
        console.warn(`Parking lot ${index} (${parkingLot.name}) has invalid coordinates, skipping:`, {
          lat,
          lng,
          originalLat: parkingLot.addressId?.latitude,
          originalLng: parkingLot.addressId?.longitude,
        })
        return
      }

      const el = createMarkerElement(parkingLot)
      const popup = new maplibregl.Popup({ offset: 25, closeButton: true, closeOnClick: false })
        .setHTML(createPopupHTML(parkingLot))

      // MapLibre uses [longitude, latitude] format
      // Use 'bottom' anchor so the tip of the marker pin points to the exact coordinates
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom', // Bottom anchor makes the tip of the pin point to coordinates
      })
        .setLngLat([lng, lat]) // [longitude, latitude] - IMPORTANT: lng first, then lat
        .setPopup(popup)
        .addTo(map.current!)

      markersRef.current.push(marker)
      console.log(`✓ Added marker for "${parkingLot.name}" at [lng: ${lng}, lat: ${lat}]`)
    })
    
    console.log(`Total markers added: ${markersRef.current.length}`)
  }, [parkingLots])

  return (
    <div className={`parking-lot-map-container ${className}`}>
      <div ref={mapContainer} className="parking-lot-map" />
      {isLoading && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner" />
          <p>Đang tải bãi đỗ xe...</p>
        </div>
      )}
      {!isLoading && parkingLots.length === 0 && (
        <div className="map-empty-overlay">
          <CarOutlined style={{ fontSize: 48, color: '#9ca3af', marginBottom: 16 }} />
          <p>Không tìm thấy bãi đỗ xe trong khu vực này</p>
        </div>
      )}
    </div>
  )
}

export default ParkingLotMap

