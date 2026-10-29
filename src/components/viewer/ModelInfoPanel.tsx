import React from 'react';
import {
  Box,
  Layers,
  MapPin,
  Camera,
  Info,
  X
} from 'lucide-react';
import { Project } from '../../types';
import { ModelMetrics } from './BuildingModel';
import { dimensionsFromExtents } from '../../utils/dimensions';
import { formatLength, LengthUnit } from '../../utils/units';

interface ModelInfoPanelProps {
  project?: Project;
  metrics?: ModelMetrics | null;
  isCalibrated?: boolean;
  scaleFactor?: number;
  unit?: LengthUnit;
  onClose?: () => void;
}

export const ModelInfoPanel: React.FC<ModelInfoPanelProps> = ({
  project,
  metrics,
  isCalibrated = false,
  scaleFactor = 1,
  unit = 'm',
  onClose
}) => {
  const meta = project?.metadata;
  const isDemo = project?.isDemo || project?.provider === 'demo';
  const projectName = project?.name || 'KIET Campus Building Survey';

  // Extract actual GLB metrics dynamically calculated from Three.js scene
  const vertices = metrics?.vertices || meta?.vertices || 0;
  const faces = metrics?.faces || meta?.faces || 0;
  const meshes = metrics?.meshes || 0;
  // Extents are stored in raw model units; calibration is applied exactly once, inside formatLength
  const dims = dimensionsFromExtents(metrics?.boundingBox ?? meta?.boundingBox);
  const fmt = (v?: number) => formatLength(v, { calibrated: isCalibrated, scaleFactor, unit }) ?? 'Not available';

  const gpsDisplay = meta?.gps && typeof meta.gps.latitude === 'number' && typeof meta.gps.longitude === 'number'
    ? `${meta.gps.latitude.toFixed(4)}°N, ${meta.gps.longitude.toFixed(4)}°E`
    : 'Not available';

  return (
    <aside aria-label="Model information" className="absolute md:static inset-y-0 right-0 z-30 w-80 max-w-[88vw] shrink-0 bg-aerospace-900/95 border-l border-slate-800/80 flex flex-col h-full overflow-y-auto backdrop-blur-md text-xs shadow-2xl md:shadow-none">
      
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between sticky top-0 bg-aerospace-900 z-10">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-sky-400" />
          <h3 className="font-bold text-slate-100 text-sm">Model information</h3>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close model information panel" className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">

        {/* Project Header Card */}
        <div className="p-3 rounded-lg bg-aerospace-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-300 text-sm truncate max-w-[180px]">{projectName}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-mono border ${
              isDemo ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {isDemo ? 'DEMO MODE' : 'PROCESSED'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            {project?.isDemo
              ? 'DEMO SAMPLE — Real photogrammetry model asset (public/demo/build.glb).'
              : isDemo
                ? 'Demo-engine output (simulated reconstruction, not a real drone reconstruction).'
                : 'Processed 3D Digital Twin GLB model asset.'}
          </p>
        </div>

        {/* Photogrammetry Derived Mesh Statistics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>3D GLB Structure</span>
            </h4>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {metrics ? 'Live Scene Metrics' : 'Loaded Mesh'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded bg-aerospace-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono block">MESH COUNT</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{meshes || 'Not available'}</span>
            </div>
            <div className="p-2.5 rounded bg-aerospace-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono block font-bold">VERTICES</span>
              <span className="font-mono font-bold text-sky-300 text-sm">{vertices ? vertices.toLocaleString() : 'Not available'}</span>
            </div>
            <div className="p-2.5 rounded bg-aerospace-950/60 border border-slate-800 col-span-2">
              <span className="text-xs text-slate-400 font-mono block">POLYGON TRIANGLES</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{faces ? faces.toLocaleString() : 'Not available'}</span>
            </div>
          </div>
        </div>

        {/* Bounding Box Dimensions */}
        <div className="p-3 rounded-lg bg-aerospace-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 block">Bounding Box Dimensions</span>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
              isCalibrated ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isCalibrated ? 'CALIBRATED' : 'UNCALIBRATED'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 font-mono text-slate-200 text-xs font-semibold text-center">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block">LENGTH</span>
              <span>{fmt(dims?.length)}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block">WIDTH</span>
              <span>{fmt(dims?.width)}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block">HEIGHT</span>
              <span>{fmt(dims?.height)}</span>
            </div>
          </div>
        </div>

        {/* Scale Status Note */}
        <div className="p-3 rounded-lg bg-aerospace-950 border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-semibold text-xs">
            <Info className="w-3.5 h-3.5" />
            <span>SCALE & ACCURACY STATUS</span>
          </div>
          <p className="leading-relaxed text-xs text-slate-400">
            {isCalibrated
              ? 'Model is calibrated against known physical reference distance. Dimensions shown in the selected unit.'
              : 'Model scale: Uncalibrated. Dimensions shown in model units. Calibrate using scale tool.'}
          </p>
        </div>

        {/* Survey Telemetry */}
        <div>
          <h4 className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>Survey Telemetry{isDemo ? ' (Simulated)' : ''}</span>
          </h4>
          <div className="p-3 rounded-lg bg-aerospace-950/60 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Drone Model:</span>
              <span className="font-medium">{meta?.droneModel || 'Not available'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">GPS Coordinates:</span>
              <span className="font-mono text-slate-300">{gpsDisplay}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Location:</span>
              <span className="font-medium">{meta?.locationName || 'Not available'}</span>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};
