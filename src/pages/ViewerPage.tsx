import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Layers,
  MapPin,
  Ruler,
  Compass,
  Scale,
  Maximize,
  X,
  AlertTriangle,
  ArrowLeft,
  Share2,
  Download
} from 'lucide-react';
import { ThreeCanvas } from '../components/viewer/ThreeCanvas';
import { FloatingToolbar, ActiveTool, RenderMode, CameraPreset } from '../components/viewer/FloatingToolbar';
import { ModelInfoPanel } from '../components/viewer/ModelInfoPanel';
import { useProjects } from '../store/ProjectContext';
import { Project } from '../types';

const DEFAULT_FALLBACK_PROJECT: Project = {
  id: 'demo-proj-001',
  name: 'KIET Campus Building Survey',
  status: 'SUCCEEDED',
  provider: 'demo',
  created_at: new Date().toISOString(),
  model_url: '/demo/build.glb',
  thumbnail_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
  isDemo: true,
  metadata: {
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
  }
};

export const ViewerPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    projects,
    activeProject,
    setActiveProject,
    markers,
    addMarker,
    deleteMarker,
    measurements,
    addMeasurement,
    clearMeasurements,
    scaleFactor,
    setScaleFactor,
    isCalibrated
  } = useProjects();

  const currentProj = (projects || []).find(p => p && p.id === projectId) || activeProject || DEFAULT_FALLBACK_PROJECT;

  // Viewer state
  const [activeTool, setActiveTool] = useState<ActiveTool>('orbit');
  const [renderMode, setRenderMode] = useState<RenderMode>('textured');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('default');
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(true);
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);

  // Pin marker creation dialog state
  const [pendingMarkerPoint, setPendingMarkerPoint] = useState<[number, number, number] | null>(null);
  const [markerForm, setMarkerForm] = useState({
    category: 'Structural' as const,
    severity: 'High' as const,
    label: '',
    note: ''
  });

  // Calibration state
  const [calibrationInput, setCalibrationInput] = useState({
    knownDistance: '10',
    measuredDistance: '10'
  });

  const handleAddMarkerAtPoint = (point: [number, number, number]) => {
    setPendingMarkerPoint(point);
  };

  const handleSaveMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMarkerPoint) return;
    addMarker({
      projectId: currentProj.id,
      category: markerForm.category,
      severity: markerForm.severity,
      label: markerForm.label || 'Facade Defect Marker',
      note: markerForm.note || 'Identified anomaly during 3D inspection.',
      position: pendingMarkerPoint,
      author: 'Inspector Pilot'
    });
    setPendingMarkerPoint(null);
    setActiveTool('orbit');
  };

  const handleApplyCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    const known = parseFloat(calibrationInput.knownDistance);
    const measured = parseFloat(calibrationInput.measuredDistance);
    if (known > 0 && measured > 0) {
      const factor = known / measured;
      setScaleFactor(factor);
      setShowCalibrationModal(false);
    }
  };

  const handleTakeScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${currentProj.name}-3D-Snapshot.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* Top Header Controls Bar */}
      <header className="h-14 bg-aerospace-900 border-b border-slate-800 px-4 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded-lg bg-aerospace-950 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-bold text-sm text-slate-100 font-mono tracking-wide truncate max-w-xs sm:max-w-md">
              {currentProj.name}
            </h1>
            <p className="text-[10px] text-slate-400 font-sans">
              3D WebGL Digital Twin • {currentProj.metadata?.locationName || 'Delhi NCR, India'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/analysis/${currentProj.id}`)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold"
          >
            <Box className="w-3.5 h-3.5" />
            <span>AI Detections</span>
          </button>

          <button
            onClick={() => navigate(`/map/${currentProj.id}`)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aerospace-800 hover:bg-aerospace-700 text-slate-200 border border-slate-700 text-xs font-medium"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>GIS Map</span>
          </button>

          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
              showInfoPanel ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-aerospace-800 text-slate-300 border-slate-700'
            }`}
            title="Toggle Model Info Drawer"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 3D Canvas Area */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Floating Toolbar Controls */}
        <FloatingToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          renderMode={renderMode}
          setRenderMode={setRenderMode}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          setCameraPreset={setCameraPreset}
          onTakeScreenshot={handleTakeScreenshot}
          onOpenCalibration={() => setShowCalibrationModal(true)}
          isCalibrated={isCalibrated}
          clearMeasurements={clearMeasurements}
          measurementCount={measurements.length}
        />

        {/* 3D WebGL Canvas */}
        <div className="flex-1 h-full relative">
          <ThreeCanvas
            activeTool={activeTool}
            renderMode={renderMode}
            showGrid={showGrid}
            cameraPreset={cameraPreset}
            markers={markers}
            onAddMarkerAtPoint={handleAddMarkerAtPoint}
            measurements={measurements}
            onAddMeasurement={addMeasurement}
            scaleFactor={scaleFactor}
            isCalibrated={isCalibrated}
            projectId={currentProj.id}
            project={currentProj}
          />
        </div>

        {/* Right Info Drawer Panel */}
        {showInfoPanel && (
          <ModelInfoPanel
            project={currentProj}
            onClose={() => setShowInfoPanel(false)}
          />
        )}
      </div>

      {/* Pin Issue Dialog Modal */}
      {pendingMarkerPoint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel-elevated p-6 rounded-2xl border border-slate-700 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 font-mono">Add Inspection Marker Pin</h3>
              <button onClick={() => setPendingMarkerPoint(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMarker} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Issue Category</label>
                <select
                  value={markerForm.category}
                  onChange={e => setMarkerForm({ ...markerForm, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200"
                >
                  <option value="Structural">Structural Crack / Beam</option>
                  <option value="Roof">Roof Membrane Anomaly</option>
                  <option value="Facade">Facade Damage / Trim</option>
                  <option value="Vegetation">Obstruction / Canopy</option>
                  <option value="Anomaly">General Surface Defect</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Severity Level</label>
                <select
                  value={markerForm.severity}
                  onChange={e => setMarkerForm({ ...markerForm, severity: e.target.value as any })}
                  className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200"
                >
                  <option value="High">High Severity (Critical Repair)</option>
                  <option value="Medium">Medium Severity (Schedule Maintenance)</option>
                  <option value="Low">Low Severity (Minor Observation)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Issue Title / Label *</label>
                <input
                  type="text"
                  required
                  value={markerForm.label}
                  onChange={e => setMarkerForm({ ...markerForm, label: e.target.value })}
                  placeholder="e.g. 3mm Vertical Crack on Beam"
                  className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Inspection Note / Description</label>
                <textarea
                  rows={3}
                  value={markerForm.note}
                  onChange={e => setMarkerForm({ ...markerForm, note: e.target.value })}
                  placeholder="Add detailed inspector observations..."
                  className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                Location Point: [{pendingMarkerPoint.map(n => n.toFixed(2)).join(', ')}]
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingMarkerPoint(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold"
                >
                  Save 3D Marker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scale Calibration Modal */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel-elevated p-6 rounded-2xl border border-slate-700 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 font-mono flex items-center gap-2">
                <Scale className="w-4 h-4 text-sky-400" />
                <span>3D Model Scale Calibration</span>
              </h3>
              <button onClick={() => setShowCalibrationModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCalibration} className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Enter a known physical reference distance (e.g. building width or Ground Control Target) to calibrate photogrammetry scale factor:
              </p>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Known Reference Physical Distance (meters)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={calibrationInput.knownDistance}
                  onChange={e => setCalibrationInput({ ...calibrationInput, knownDistance: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Measured Model Distance (units)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={calibrationInput.measuredDistance}
                  onChange={e => setCalibrationInput({ ...calibrationInput, measuredDistance: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-aerospace-950 border border-slate-800 text-[11px] font-mono text-sky-400">
                Calculated Scale Multiplier $S$: {(parseFloat(calibrationInput.knownDistance) / (parseFloat(calibrationInput.measuredDistance) || 1)).toFixed(4)}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalibrationModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-aerospace-950 font-bold"
                >
                  Apply Calibration Factor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
