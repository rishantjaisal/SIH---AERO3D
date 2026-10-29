import React, { useState } from 'react';
import {
  RotateCcw,
  Ruler,
  MapPin,
  Grid,
  Camera,
  Compass,
  ArrowUp,
  Box,
  Scale,
  Ruler as RulerIcon,
  Type
} from 'lucide-react';
import { LENGTH_UNITS, LengthUnit } from '../../utils/units';

export type ActiveTool = 'orbit' | 'measure-distance' | 'measure-height' | 'add-marker';
export type RenderMode = 'textured' | 'wireframe' | 'solid' | 'pointcloud';
export type CameraPreset = 'default' | 'top' | 'front' | 'side';

interface FloatingToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  renderMode: RenderMode;
  setRenderMode: (mode: RenderMode) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  onTakeScreenshot: () => void;
  onOpenCalibration: () => void;
  isCalibrated: boolean;
  clearMeasurements: () => void;
  measurementCount: number;
  showDimensions: boolean;
  setShowDimensions: (v: boolean) => void;
  showBoundingBox: boolean;
  setShowBoundingBox: (v: boolean) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  unit: LengthUnit;
  setUnit: (u: LengthUnit) => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  activeTool,
  setActiveTool,
  renderMode,
  setRenderMode,
  showGrid,
  setShowGrid,
  setCameraPreset,
  onTakeScreenshot,
  onOpenCalibration,
  isCalibrated,
  clearMeasurements,
  measurementCount,
  showDimensions,
  setShowDimensions,
  showBoundingBox,
  setShowBoundingBox,
  showLabels,
  setShowLabels,
  unit,
  setUnit
}) => {
  const [expanded, setExpanded] = useState(true); // collapsible on small screens
  const tools: Array<{ id: ActiveTool; label: string; Icon: React.ElementType; tip: string; cls?: string }> = [
    { id: 'orbit', label: 'Navigate', Icon: Compass, tip: 'Navigate: drag to orbit, scroll to zoom' },
    { id: 'measure-distance', label: 'Distance', Icon: Ruler, tip: 'Distance: click two points on the model to measure between them' },
    { id: 'measure-height', label: 'Height', Icon: ArrowUp, tip: 'Height: click two points to measure the vertical difference' },
    { id: 'add-marker', label: 'Pin issue', Icon: MapPin, tip: 'Pin issue: click the surface to drop an inspection marker', cls: 'danger' }
  ];
  const modes: Array<{ id: RenderMode; label: string; tip: string }> = [
    { id: 'textured', label: 'Textured', tip: 'Textured: photo-realistic surface' },
    { id: 'wireframe', label: 'Wireframe', tip: 'Wireframe: mesh edges only' },
    { id: 'solid', label: 'Solid', tip: 'Solid: shaded surface without textures' },
    { id: 'pointcloud', label: 'Point cloud', tip: 'Point cloud: model vertices as points' }
  ];
  return (
    <div className="absolute top-3 inset-x-3 z-30 flex flex-col items-center gap-2 pointer-events-none" role="toolbar" aria-label="3D viewer controls">
      <button type="button" onClick={() => setExpanded(e => !e)} aria-expanded={expanded} className="md:hidden pointer-events-auto btn btn-secondary btn-sm">
        {expanded ? 'Hide controls' : 'Show controls'}
      </button>
      <div className={`${expanded ? 'flex' : 'hidden md:flex'} flex-col items-center gap-2 max-w-full`}>
        <div className="pointer-events-auto vt-panel">
          {/* Tools */}
          <div className="seg" role="group" aria-label="Tools">
            {tools.map(({ id, label, Icon, tip, cls }) => (
              <button key={id} onClick={() => setActiveTool(id)} className={`seg-btn tool ${cls || ''}`} title={tip} aria-pressed={activeTool === id}>
                <Icon className="w-4 h-4" aria-hidden />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <span className="vt-sep" aria-hidden />

          {/* Render modes */}
          <div className="seg" role="group" aria-label="Render mode">
            {modes.map(m => (
              <button key={m.id} onClick={() => setRenderMode(m.id)} className="seg-btn" title={m.tip} aria-pressed={renderMode === m.id}>
                {m.label}
              </button>
            ))}
          </div>

          <span className="vt-sep" aria-hidden />

          {/* Camera */}
          <div className="flex items-center gap-1" role="group" aria-label="Camera">
            <button onClick={() => setCameraPreset('default')} className="icon-btn" title="Reset camera view" aria-label="Reset camera view">
              <RotateCcw className="w-4 h-4" aria-hidden />
            </button>
            <button onClick={() => setCameraPreset('top')} className="seg-btn border border-slate-700" title="Top-down plan view" aria-label="Top-down plan view">Top</button>
            <button onClick={() => setCameraPreset('front')} className="seg-btn border border-slate-700" title="Front elevation view" aria-label="Front elevation view">Front</button>
          </div>

          <span className="vt-sep" aria-hidden />

          {/* Utilities */}
          <div className="flex items-center gap-1" role="group" aria-label="Utilities">
            <button onClick={() => setShowGrid(!showGrid)} className="icon-btn" title="Toggle floor grid" aria-label="Toggle floor grid" aria-pressed={showGrid}>
              <Grid className="w-4 h-4" aria-hidden />
            </button>
            <button
              onClick={onOpenCalibration}
              className={`seg-btn border ${isCalibrated ? 'border-emerald-500/50 text-emerald-300' : 'border-amber-500/50 text-amber-300'}`}
              title="Scale calibration" aria-label="Open scale calibration"
            >
              <Scale className="w-4 h-4" aria-hidden />
              <span>{isCalibrated ? 'Calibrated' : 'Calibrate'}</span>
            </button>
            <button onClick={onTakeScreenshot} className="icon-btn" title="Save a PNG snapshot of the 3D view" aria-label="Save a PNG snapshot of the 3D view">
              <Camera className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Annotation controls */}
        <div className="pointer-events-auto vt-panel" aria-label="Model annotations">
          <button onClick={() => setShowDimensions(!showDimensions)} className="seg-btn border border-slate-700" aria-pressed={showDimensions} title="Show length, width and height guide lines (bounding-box size)">
            <RulerIcon className="w-4 h-4" aria-hidden />
            <span>Dimensions</span>
          </button>
          <button onClick={() => setShowBoundingBox(!showBoundingBox)} className="seg-btn border border-slate-700" aria-pressed={showBoundingBox} title="Show model bounding box (Box3)">
            <Box className="w-4 h-4" aria-hidden />
            <span>Bounding box</span>
          </button>
          <button onClick={() => setShowLabels(!showLabels)} className="seg-btn border border-slate-700" aria-pressed={showLabels} title="Show dimension and measurement labels">
            <Type className="w-4 h-4" aria-hidden />
            <span>Labels</span>
          </button>
          <select
            value={unit}
            onChange={e => setUnit(e.target.value as LengthUnit)}
            disabled={!isCalibrated}
            aria-label="Display unit"
            title={isCalibrated ? 'Display unit' : 'Calibrate the scale to enable real-world units'}
            className="vt-select"
          >
            {LENGTH_UNITS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
