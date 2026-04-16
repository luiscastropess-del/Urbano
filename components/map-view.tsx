'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place } from '@/lib/types';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  places: Place[];
  center?: [number, number];
  onPlaceSelect?: (place: Place) => void;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export default function MapView({
  places,
  center = [-23.5505, -46.6333],
  onPlaceSelect,
}: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-full w-full bg-muted animate-pulse" />;
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} />
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.location.lat, place.location.lng]}
          eventHandlers={{
            click: () => onPlaceSelect?.(place),
          }}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-bold text-sm">{place.title}</h3>
              <p className="text-xs text-secondary line-clamp-1">{place.description}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-rating text-xs">★ {place.rating}</span>
                <span className="text-[10px] bg-background px-1.5 py-0.5 rounded-full">
                  {place.category}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
              }
