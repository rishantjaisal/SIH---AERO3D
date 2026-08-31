import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';
import { InspectionMarker } from '../../types';

interface InspectionMarkersProps {
  markers: InspectionMarker[];
  onSelectMarker?: (marker: InspectionMarker) => void;
  onDeleteMarker?: (id: string) => void;
}

export const InspectionMarkers: React.FC<InspectionMarkersProps> = ({
  markers,
  onSelectMarker,
  onDeleteMarker
}) => {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  return (
    <group>
      {markers.map((marker) => {
        const isSelected = activeMarkerId === marker.id;
        const colorClass =
          marker.severity === 'High'
            ? 'bg-rose-500 text-white border-rose-300'
            : marker.severity === 'Medium'
            ? 'bg-amber-500 text-slate-950 border-amber-300'
            : 'bg-sky-500 text-slate-950 border-sky-300';

        return (
          <group key={marker.id} position={marker.position}>
            <Html distanceFactor={25} zIndexRange={[100, 0]} center>
              <div className="relative group">
                
                {/* 3D Pulsing Pin Marker */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMarkerId(isSelected ? null : marker.id);
                    if (onSelectMarker) onSelectMarker(marker);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-transform border-2 cursor-pointer ${colorClass} ${
                    isSelected ? 'scale-125 ring-4 ring-sky-400/50' : 'hover:scale-110'
                  }`}
                  title={`${marker.category}: ${marker.label}`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>

                {/* Inspection Tooltip Popup Card */}
                {isSelected && (
                  <div className="absolute left-8 -top-12 w-64 glass-panel-elevated p-3 rounded-lg text-slate-100 text-xs shadow-2xl z-50 pointer-events-auto border border-sky-500/40 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                          marker.severity === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {marker.severity} {marker.category}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMarkerId(null);
                        }}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-bold text-sky-300 text-xs mb-1">{marker.label}</h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed mb-2 bg-aerospace-950/60 p-1.5 rounded border border-slate-800 font-sans">
                      {marker.note}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Coord: [{marker.position.map(n => n.toFixed(1)).join(', ')}]</span>
                      {onDeleteMarker && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMarker(marker.id);
                          }}
                          className="text-rose-400 hover:underline font-sans"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
