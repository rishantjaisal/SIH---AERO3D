import React from 'react';
import {
  Box,
  Layers,
  Maximize,
  MapPin,
  Calendar,
  Camera,
  Compass,
  AlertTriangle,
  FileCheck,
  Zap,
  Info,
  X
} from 'lucide-react';
import { Project } from '../../types';

interface ModelInfoPanelProps {
  project?: Project;
  onClose?: () => void;
}

export const ModelInfoPanel: React.FC<ModelInfoPanelProps> = ({ project, onClose }) => {
  const meta = project?.metadata || {
    vertices: 48520,
    faces: 92400,
    boundingBox: { x: 34.5, y: 18.2, z: 24.8 },
    estimatedArea: 855.6,
    estimatedHeight: 18.2,
    locationName: 'Delhi NCR, India',
    gps: { latitude: 28.7523, longitude: 77.4988 },
    gsd: '1.2 cm/px',
    surveyDate: '2026-08-28',
    droneModel: 'DJI Mavic 3 Enterprise RTK',
    cameraModel: '20MP Micro 4/3 CMOS',
    flightAltitude: '45 m',
    weather: 'Clear, 12 km/h Wind',
    operator: 'Aero3D Flight Lead',
    accuracyNote: 'DEMO MODEL — Uncalibrated photogrammetry scale.'
  };

  const providerLabel = (project?.provider || 'demo').toString().toUpperCase();
  const projectName = project?.name || 'KIET Campus Building Survey';

  return (
    <div className="w-80 bg-aerospace-900/95 border-l border-slate-800/80 flex flex-col h-full overflow-y-auto select-none backdrop-blur-md text-xs">
      
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between sticky top-0 bg-aerospace-900 z-10">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-sky-400" />
          <h3 className="font-bold text-slate-100 font-mono uppercase tracking-wider text-xs">MODEL INFORMATION</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">

        {/* Project Badge Header */}
        <div className="p-3 rounded-lg bg-aerospace-950/80 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-300 text-sm truncate">{projectName}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {providerLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">{meta.locationName || 'Delhi NCR, India'}</p>
        </div>

        {/* 3D Geometry Metrics */}
        <div>
          <h4 className="font-mono text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>3D Mesh Structure</span>
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded bg-aerospace-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">VERTICES</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{(meta.vertices || 48520).toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded bg-aerospace-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">POLYGON FACES</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{(meta.faces || 92400).toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded bg-aerospace-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">FOOTPRINT AREA</span>
              <span className="font-mono font-bold text-sky-300 text-sm">{meta.estimatedArea || 855.6} m²</span>
            </div>
            <div className="p-2.5 rounded bg-aerospace-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">ESTIMATED HEIGHT</span>
              <span className="font-mono font-bold text-sky-300 text-sm">{meta.estimatedHeight || 18.2} m</span>
            </div>
          </div>
        </div>

        {/* Bounding Box Dimensions */}
        <div className="p-3 rounded-lg bg-aerospace-950/60 border border-slate-800 space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Bounding Box (X × Y × Z)</span>
          <div className="flex items-center justify-between font-mono text-slate-200 text-xs font-semibold">
            <span>X: {meta.boundingBox?.x || 34.5} m</span>
            <span>Y: {meta.boundingBox?.y || 18.2} m</span>
            <span>Z: {meta.boundingBox?.z || 24.8} m</span>
          </div>
        </div>

        {/* Geospatial GPS Information */}
        <div>
          <h4 className="font-mono text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>GIS Coordinates</span>
          </h4>
          {meta.gps ? (
            <div className="p-3 rounded-lg bg-aerospace-950/60 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">LATITUDE</span>
                <span className="text-slate-200 font-bold">{(meta.gps.latitude || 28.7523).toFixed(4)}° N</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LONGITUDE</span>
                <span className="text-slate-200 font-bold">{(meta.gps.longitude || 77.4988).toFixed(4)}° E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GSD ACCURACY</span>
                <span className="text-emerald-400 font-bold">{meta.gsd || '1.2 cm/px'}</span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>GPS location data unavailable for this asset.</span>
            </div>
          )}
        </div>

        {/* Drone Hardware Metadata */}
        <div>
          <h4 className="font-mono text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>Survey Equipment</span>
          </h4>
          <div className="p-3 rounded-lg bg-aerospace-950/60 border border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Drone Rig:</span>
              <span className="font-medium">{meta.droneModel || 'DJI Mavic 3 Enterprise RTK'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Sensor:</span>
              <span className="font-medium">{meta.cameraModel || '20MP Micro 4/3 CMOS'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Altitude:</span>
              <span className="font-medium">{meta.flightAltitude || '45 m'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Surveyor:</span>
              <span className="font-medium">{meta.operator || 'Aero3D Flight Lead'}</span>
            </div>
          </div>
        </div>

        {/* Technical Accuracy Note */}
        {meta.accuracyNote && (
          <div className="p-3 rounded-lg bg-aerospace-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono font-semibold">
              <Info className="w-3.5 h-3.5" />
              <span>SCALE / ACCURACY NOTE</span>
            </div>
            <p className="leading-relaxed">{meta.accuracyNote}</p>
          </div>
        )}

      </div>
    </div>
  );
};
