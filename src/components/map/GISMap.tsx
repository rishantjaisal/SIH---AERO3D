import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin, Compass, Navigation, WifiOff } from 'lucide-react';
import { GPSCoordinate } from '../../types';

interface GISMapProps {
  gps: GPSCoordinate | null;
  locationName: string;
  projectName: string;
}

export const GISMap: React.FC<GISMapProps> = ({ gps, locationName, projectName }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [tileLayerType, setTileLayerType] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  const defaultLat = gps?.latitude || 28.7523;
  const defaultLng = gps?.longitude || 77.4988;

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 16,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add selected tile layer
    if (tileLayerType === 'satellite') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Esri, Maxar, Earthstar Geographics'
      }).addTo(map);
    } else if (tileLayerType === 'street') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
    } else {
      // CartoDB Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '© CartoDB'
      }).addTo(map);
    }

    // Custom Marker Pin
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div class="w-6 h-6 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center text-slate-950 font-bold shadow-lg animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([defaultLat, defaultLng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<b>${projectName}</b><br/>${locationName}<br/>GPS: ${defaultLat.toFixed(4)}°, ${defaultLng.toFixed(4)}°`)
      .openPopup();

    // Drone Survey Perimeter Boundary Polygon
    const delta = 0.0018;
    const polygonCoords: L.LatLngExpression[] = [
      [defaultLat + delta, defaultLng - delta],
      [defaultLat + delta, defaultLng + delta],
      [defaultLat - delta, defaultLng + delta],
      [defaultLat - delta, defaultLng - delta]
    ];

    L.polygon(polygonCoords, {
      color: '#38bdf8',
      weight: 2,
      dashArray: '5, 5',
      fillColor: '#38bdf8',
      fillOpacity: 0.15
    }).addTo(map);

  }, [defaultLat, defaultLng, tileLayerType, projectName, locationName]);

  return (
    <div className="w-full h-full relative">
      
      {/* Top Map Layer Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-aerospace-900/90 p-1.5 rounded-lg border border-slate-700/80 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTileLayerType('dark')}
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-medium transition-all ${
              tileLayerType === 'dark' ? 'bg-sky-500 text-aerospace-950 font-semibold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Dark Vector
          </button>
          <button
            onClick={() => setTileLayerType('satellite')}
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-medium transition-all ${
              tileLayerType === 'satellite' ? 'bg-sky-500 text-aerospace-950 font-semibold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setTileLayerType('street')}
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-medium transition-all ${
              tileLayerType === 'street' ? 'bg-sky-500 text-aerospace-950 font-semibold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Street Map
          </button>
        </div>
      </div>

      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono backdrop-blur-md">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>OFFLINE GIS TELEMETRY — Displaying Cached Local Boundary & GPS Target</span>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
