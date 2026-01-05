'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin } from 'lucide-react';

// Fix for default marker icon in Next.js (only on client-side)
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  height?: string;
  allowMultiple?: boolean;
  selectedLocations?: Array<{ lat: number; lng: number; label?: string }>;
}

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLat,
  initialLng,
  height = '400px',
  allowMultiple = false,
  selectedLocations = [],
}) => {
  const defaultLat = 10.7769;
  const defaultLng = 106.7009;
  const [position, setPosition] = useState<[number, number]>([
    initialLat ?? defaultLat,
    initialLng ?? defaultLng,
  ]);
  const [locations, setLocations] = useState<Array<{ lat: number; lng: number; label?: string }>>(selectedLocations);

  // Helper function to validate coordinates
  const isValidLatitude = (lat: number | undefined): boolean => {
    if (lat === undefined || lat === 0) return false;
    return !isNaN(lat) && isFinite(lat) && lat >= -90 && lat <= 90;
  };

  const isValidLongitude = (lng: number | undefined): boolean => {
    if (lng === undefined || lng === 0) return false;
    return !isNaN(lng) && isFinite(lng) && lng >= -180 && lng <= 180;
  };

  useEffect(() => {
    if (isValidLatitude(initialLat) && isValidLongitude(initialLng)) {
      setPosition([initialLat!, initialLng!]);
    }
  }, [initialLat, initialLng]);

  useEffect(() => {
    setLocations(selectedLocations);
  }, [selectedLocations]);

  const handleLocationSelect = (lat: number, lng: number) => {
    if (allowMultiple) {
      const newLocations = [...locations, { lat, lng }];
      setLocations(newLocations);
      onLocationSelect(lat, lng);
    } else {
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    }
  };

  // Custom marker icon
  const createCustomIcon = (color: string = '#3b82f6') => {
    if (typeof window === 'undefined') {
      return null;
    }
    const L = require('leaflet');
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  };

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-300" style={{ height }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        
        {/* Single location marker */}
        {!allowMultiple && (
          <Marker position={position} icon={createCustomIcon('#3b82f6')} />
        )}
        
        {/* Multiple location markers */}
        {allowMultiple && locations.map((loc, index) => (
          <Marker
            key={index}
            position={[loc.lat, loc.lng]}
            icon={createCustomIcon(index === 0 ? '#10b981' : '#3b82f6')}
          />
        ))}
      </MapContainer>
    </div>
  );
};

