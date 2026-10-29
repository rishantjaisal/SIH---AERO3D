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
    <aside aria-label="Model information" className="absolute md:static inset-y-0 right-0 z-30 w-80 max-w-[88vw] shrink-0 bg-aerospace-900 border-l border-slate-700 flex flex-col h-full overflow-y-auto shadow-2xl md:shadow-none">

      <div className="h-14 px-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-aerospace-900 z-10">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-sky-400" aria-hidden />
          <h3 className="font-display font-semibold text-slate-100 text-base">Model information</h3>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close model information panel" title="Close panel" className="icon-btn border-transparent bg-transparent">
            <X className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="p-4 space-y-6 text-sm">

        {/* Project */}
        <section className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <span className="font-display font-semibold text-slate-100 text-base leading-snug">{projectName}</span>
            <span className={`pill shrink-0 ${isDemo ? 'pill-info' : 'pill-ok'}`}>{isDemo ? 'Demo' : 'Processed'}</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            {project?.isDemo
              ? 'Demo sample: a real photogrammetry model bundled with the app.'
              : isDemo
                ? 'Demo-engine output (simulated reconstruction, not a real drone reconstruction).'
                : 'Processed 3D digital twin GLB model.'}
          </p>
        </section>

        {/* Mesh statistics */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" aria-hidden />
              Mesh
            </h4>
            <span className="text-xs text-slate-400">{metrics ? 'Measured from the loaded scene' : 'From project metadata'}</span>
          </div>
          <dl className="grid grid-cols-2 gap-2">
            <div className="stat-tile"><dt>Meshes</dt><dd>{meshes || 'Not available'}</dd></div>
            <div className="stat-tile"><dt>Vertices</dt><dd>{vertices ? vertices.toLocaleString() : 'Not available'}</dd></div>
            <div className="stat-tile col-span-2"><dt>Triangles</dt><dd>{faces ? faces.toLocaleString() : 'Not available'}</dd></div>
          </dl>
        </section>

        {/* Bounding box */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-100">Bounding box</h4>
            <span className={`pill ${isCalibrated ? 'pill-ok' : 'pill-warn'}`}>{isCalibrated ? 'Calibrated' : 'Uncalibrated'}</span>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            <div className="stat-tile"><dt>Length</dt><dd>{fmt(dims?.length)}</dd></div>
            <div className="stat-tile"><dt>Width</dt><dd>{fmt(dims?.width)}</dd></div>
            <div className="stat-tile"><dt>Height</dt><dd>{fmt(dims?.height)}</dd></div>
          </dl>
        </section>

        {/* Scale note */}
        <section className="rounded-[10px] border border-slate-700 bg-aerospace-950 p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-medium">
            <Info className="w-4 h-4" aria-hidden />
            <span>Scale and accuracy</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            {isCalibrated
              ? 'Calibrated against a known reference distance. Dimensions are shown in the selected unit.'
              : 'Uncalibrated. Dimensions are in model units. Use Calibrate to set a real-world scale.'}
          </p>
        </section>

        {/* Telemetry */}
        <section>
          <h4 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-sky-400" aria-hidden />
            Survey details{isDemo ? ' (simulated)' : ''}
          </h4>
          <dl className="divide-y divide-slate-700/70 rounded-[10px] border border-slate-700">
            <div className="flex justify-between gap-4 px-3 py-2.5"><dt className="text-slate-400">Drone</dt><dd className="text-slate-100 text-right">{meta?.droneModel || 'Not available'}</dd></div>
            <div className="flex justify-between gap-4 px-3 py-2.5"><dt className="text-slate-400">GPS</dt><dd className="readout text-slate-100 text-right text-[13px]">{gpsDisplay}</dd></div>
            <div className="flex justify-between gap-4 px-3 py-2.5"><dt className="text-slate-400">Location</dt><dd className="text-slate-100 text-right">{meta?.locationName || 'Not available'}</dd></div>
          </dl>
        </section>

      </div>
    </aside>
  );
};
