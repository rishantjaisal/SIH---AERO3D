import React from 'react';
import {
  Box,
  Layers,
  MapPin,
  Camera,
  AlertTriangle,
  Info,
  X,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { Project } from '../../types';
import { ModelMetrics } from './BuildingModel';

interface ModelInfoPanelProps {
  project?: Project;
  metrics?: ModelMetrics | null;
  isCalibrated?: boolean;
  onClose?: () => void;
}

export const ModelInfoPanel: React.FC<ModelInfoPanelProps> = ({
  project,
  metrics,
  isCalibrated = false,
  onClose
}) => {
  const meta = project?.metadata || {
    locationName: 'Delhi NCR, India',
    gps: { latitude: 28.7523, longitude: 77.4988 },
    gsd: '1.2 cm/px',
    surveyDate: '2026-08-28',
    droneModel: 'DJI Mavic 3 Enterprise RTK',
    cameraModel: '20MP Micro 4/3 CMOS',
    flightAltitude: '45 m',
    weather: 'Clear, 12 km/h Wind',
    operator: 'Aero3D Flight Lead'
  };

  const providerLabel = (project?.provider || 'demo').toString().toUpperCase();
  const projectName = project?.name || 'KIET Campus Building Survey';

  // Extract actual GLB metrics if available
  const vertices = metrics?.vertices || meta.vertices || 48520;
  const faces = metrics?.faces || meta.faces || 92400;
  const meshes = metrics?.meshes || 1;
  const bBoxX = metrics?.boundingBox?.x || meta.boundingBox?.x || 28.0;
  const bBoxY = metrics?.boundingBox?.y || meta.boundingBox?.y || 14.0;
  const bBoxZ = metrics?.boundingBox?.z || meta.boundingBox?.z || 18.0;

  const unitLabel = isCalibrated ? 'm' : 'u (model units)';

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

        {/* Project Header Card */}
        <div className="p-3 rounded-lg bg-aerospace-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-300 text-sm truncate">{projectName}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {providerLabel}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Model source:</span>
            <span className="text-slate-200 font-semibold">Polycam Photogrammetry</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Photogrammetry model imported into Aero3D.
          </p>
        </div>

        {/* Photogrammetry Derived Mesh Statistics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-mono text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>3D GLB Structure</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {metrics ? 'Derived from loaded GLB' : 'Loaded Mesh'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded bg-aerospace-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">MESH COUNT</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{meshes}</span>
            </div>
            <div className="p-2.5 rounded bg-aerospace-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block font-bold">VERTICES</span>
              <span className="font-mono font-bold text-sky-300 text-sm">{vertices.toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded bg-aerospace-950/60 border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-500 font-mono block">POLYGON TRIANGLES</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{faces.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bounding Box Dimensions */}
        <div className="p-3 rounded-lg bg-aerospace-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Bounding Box Dimensions</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isCalibrated ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isCalibrated ? 'CALIBRATED' : 'UNCALIBRATED'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 font-mono text-slate-200 text-xs font-semibold text-center">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-500 block">WIDTH (X)</span>
              <span>{bBoxX} {unitLabel}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-500 block">HEIGHT (Y)</span>
              <span>{bBoxY} {unitLabel}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-500 block">DEPTH (Z)</span>
              <span>{bBoxZ} {unitLabel}</span>
            </div>
          </div>
        </div>

        {/* Scale Status Note */}
        <div className="p-3 rounded-lg bg-aerospace-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-semibold text-xs">
            <Info className="w-3.5 h-3.5" />
            <span>SCALE & ACCURACY STATUS</span>
          </div>
          <p className="leading-relaxed text-[10px] text-slate-400">
            {isCalibrated
              ? 'Model is calibrated against known physical reference distance. Measurements shown in meters.'
              : 'Model scale: Uncalibrated. Dimensions shown in model units. Calibrate using the scale tool.'}
          </p>
        </div>

        {/* Survey Hardware Metadata */}
        <div>
          <h4 className="font-mono text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>Capture Telemetry</span>
          </h4>
          <div className="p-3 rounded-lg bg-aerospace-950/60 border border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Capture Rig:</span>
              <span className="font-medium">{meta.droneModel || 'DJI Mavic 3 Enterprise RTK'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Location:</span>
              <span className="font-medium">{meta.locationName || 'Delhi NCR, India'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Processing Engine:</span>
              <span className="font-medium text-sky-300">Polycam Photogrammetry</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
