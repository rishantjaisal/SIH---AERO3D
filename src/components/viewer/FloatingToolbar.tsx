import React from 'react';
import {
  RotateCcw,
  Ruler,
  MapPin,
  Eye,
  Grid,
  Maximize2,
  Camera,
  Layers,
  Compass,
  ArrowUp,
  Box,
  Scale,
  Sparkles,
  SlidersHorizontal,
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
  const toggleCls = (on: boolean) =>
    `flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-mono font-medium border transition-all ${
      on ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-aerospace-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
    }`;
  return (
    <>
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 max-w-full overflow-x-auto p-1.5 rounded-xl glass-panel-elevated shadow-2xl border border-slate-700/80">
      
      {/* Tool Selection Group */}
      <div className="flex items-center gap-1 bg-aerospace-950/80 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTool('orbit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTool === 'orbit'
              ? 'bg-sky-500 text-aerospace-950 shadow'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Rotate & Navigate Camera"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Navigate</span>
        </button>

        <button
          onClick={() => setActiveTool('measure-distance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTool === 'measure-distance'
              ? 'bg-sky-500 text-aerospace-950 shadow'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Measure 3D Distance (Click 2 points on model)"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Distance</span>
        </button>

        <button
          onClick={() => setActiveTool('measure-height')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTool === 'measure-height'
              ? 'bg-sky-500 text-aerospace-950 shadow'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Measure Elevation / Vertical Delta (Click 2 points)"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Height</span>
        </button>

        <button
          onClick={() => setActiveTool('add-marker')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTool === 'add-marker'
              ? 'bg-rose-500 text-white shadow'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Place Inspection Issue Pin (Click surface)"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Pin Issue</span>
        </button>
      </div>

      <div className="w-px h-6 bg-slate-800" />

      {/* Render Modes Selector */}
      <div className="flex items-center gap-1 bg-aerospace-950/80 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setRenderMode('textured')}
          className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-medium transition-all ${
            renderMode === 'textured' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Textured
        </button>
        <button
          onClick={() => setRenderMode('wireframe')}
          className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-medium transition-all ${
            renderMode === 'wireframe' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Wireframe
        </button>
        <button
          onClick={() => setRenderMode('solid')}
          className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-medium transition-all ${
            renderMode === 'solid' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Solid
        </button>
        <button
          onClick={() => setRenderMode('pointcloud')}
          className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-medium transition-all ${
            renderMode === 'pointcloud' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Point Cloud
        </button>
      </div>

      <div className="w-px h-6 bg-slate-800" />

      {/* Camera Presets */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCameraPreset('default')}
          className="p-1.5 rounded-lg bg-aerospace-950/80 text-slate-300 hover:text-sky-300 hover:bg-slate-800 transition-colors border border-slate-800"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setCameraPreset('top')}
          className="px-2 py-1.5 rounded-lg bg-aerospace-950/80 text-[10px] font-mono text-slate-300 hover:text-sky-300 border border-slate-800"
          title="Top Down Plan View"
        >
          TOP
        </button>
        <button
          onClick={() => setCameraPreset('front')}
          className="px-2 py-1.5 rounded-lg bg-aerospace-950/80 text-[10px] font-mono text-slate-300 hover:text-sky-300 border border-slate-800"
          title="Front Elevation View"
        >
          FRONT
        </button>
      </div>

      <div className="w-px h-6 bg-slate-800" />

      {/* Utility Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded-lg border transition-colors ${
            showGrid ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-aerospace-950/80 text-slate-400 border-slate-800'
          }`}
          title="Toggle Floor Grid"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenCalibration}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
            isCalibrated
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}
          title="Scale Calibration Settings"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{isCalibrated ? 'Calibrated' : 'Scale'}</span>
        </button>

        <button
          onClick={onTakeScreenshot}
          className="p-1.5 rounded-lg bg-aerospace-950/80 text-slate-300 hover:text-sky-300 border border-slate-800 transition-colors"
          title="Capture PNG High-Res 3D Snapshot"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>

    {/* Model annotation controls (second row so the main toolbar keeps its layout) */}
    <div className="absolute top-[84px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1 rounded-lg glass-panel border border-slate-700/80 max-w-full overflow-x-auto">
      <button onClick={() => setShowDimensions(!showDimensions)} className={toggleCls(showDimensions)} aria-pressed={showDimensions} title="Show Length / Width / Height guide lines">
        <RulerIcon className="w-3.5 h-3.5" />
        <span>Dimensions</span>
      </button>
      <button onClick={() => setShowBoundingBox(!showBoundingBox)} className={toggleCls(showBoundingBox)} aria-pressed={showBoundingBox} title="Show model bounding box (Box3)">
        <Box className="w-3.5 h-3.5" />
        <span>Box3</span>
      </button>
      <button onClick={() => setShowLabels(!showLabels)} className={toggleCls(showLabels)} aria-pressed={showLabels} title="Show dimension and measurement labels">
        <Type className="w-3.5 h-3.5" />
        <span>Labels</span>
      </button>
      <select
        value={unit}
        onChange={e => setUnit(e.target.value as LengthUnit)}
        disabled={!isCalibrated}
        title={isCalibrated ? 'Display unit' : 'Calibrate the scale to enable real-world units'}
        className="px-2 py-1.5 rounded-md text-[11px] font-mono bg-aerospace-950/80 border border-slate-800 text-slate-300 disabled:opacity-50"
      >
        {LENGTH_UNITS.map(u => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
    </div>
    </>
  );
};
