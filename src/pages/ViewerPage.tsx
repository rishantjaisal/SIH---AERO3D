import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Layers,
  MapPin,
  X,
  ArrowLeft,
  Scale,
  AlertCircle,
  Play,
  FileQuestion
} from 'lucide-react';
import { ThreeCanvas } from '../components/viewer/ThreeCanvas';
import { FloatingToolbar, ActiveTool, RenderMode, CameraPreset } from '../components/viewer/FloatingToolbar';
import { ModelInfoPanel } from '../components/viewer/ModelInfoPanel';
import { ModelMetrics } from '../components/viewer/BuildingModel';
import { useProjects } from '../store/ProjectContext';
import { api } from '../services/api';
import { LengthUnit } from '../utils/units';

export const ViewerPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    projects,
    setActiveProject,
    markers,
    addMarker,
    measurements,
    addMeasurement,
    clearMeasurements,
    scaleFactor,
    setScaleFactor,
    isCalibrated,
    resetCalibration,
    updateProject
  } = useProjects();

  // Find target project strictly by URL route parameter
  const currentProj = (projects || []).find(p => p && p.id === projectId);

  // Sync active project state when project is found
  useEffect(() => {
    if (currentProj) {
      setActiveProject(currentProj);
    }
  }, [currentProj, setActiveProject]);

  // Viewer state
  const [activeTool, setActiveTool] = useState<ActiveTool>('orbit');
  const [renderMode, setRenderMode] = useState<RenderMode>('textured');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [unit, setUnit] = useState<LengthUnit>('m');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('default');
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(() => typeof window === 'undefined' || window.innerWidth >= 768);
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);
  const [loadedMetricsState, setLoadedMetricsState] = useState<{ projectId: string; metrics: ModelMetrics } | null>(null);
  // Only trust metrics that were reported for the project currently on screen
  const loadedMetrics = loadedMetricsState && loadedMetricsState.projectId === projectId ? loadedMetricsState.metrics : null;

  // Persist the real mesh statistics measured from the loaded GLB onto the project (shown on list/report pages)
  useEffect(() => {
    if (!currentProj || !loadedMetrics) return;
    const meta = currentProj.metadata || {};
    const bb = loadedMetrics.boundingBox;
    const same =
      meta.vertices === loadedMetrics.vertices &&
      meta.faces === loadedMetrics.faces &&
      meta.boundingBox?.x === bb.x && meta.boundingBox?.y === bb.y && meta.boundingBox?.z === bb.z;
    if (!same) {
      updateProject(currentProj.id, {
        metadata: { ...meta, vertices: loadedMetrics.vertices, faces: loadedMetrics.faces, boundingBox: bb }
      });
    }
  }, [loadedMetrics, currentProj?.id]);

  // Reset viewer state when projectId changes
  useEffect(() => {
    setActiveTool('orbit');
    setRenderMode('textured');
    setShowGrid(true);
    setCameraPreset('default');
    setUnit('m');
    clearMeasurements();
    resetCalibration();
  }, [projectId, clearMeasurements, resetCalibration]);

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

  // Debug logging
  useEffect(() => {
    if (currentProj) {
      console.log('[Aero3D Viewer]', {
        projectId: currentProj.id,
        projectName: currentProj.name,
        modelUrl: currentProj.model_url,
        status: currentProj.status,
        isDemo: currentProj.isDemo
      });
    }
  }, [currentProj]);

  // Case 1: Project not found in projects array
  if (!currentProj) {
    return (
      <div className="flex flex-col h-screen bg-aerospace-950 text-slate-100 items-center justify-center p-6 font-sans select-none">
        <div className="max-w-md w-full card-elevated p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <FileQuestion className="w-7 h-7" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-slate-100">Project not found</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            No survey project exists with ID <code className="text-sky-300 font-mono bg-slate-900 px-2 py-0.5 rounded">{projectId}</code>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Project has no 3D model URL or is still processing/queued
  if (!currentProj.model_url || currentProj.status === 'QUEUED' || currentProj.status === 'PROCESSING') {
    return (
      <div className="flex flex-col h-screen bg-aerospace-950 text-slate-100 font-sans">
        <header className="h-14 bg-aerospace-900 border-b border-slate-700 px-4 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="icon-btn"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-display font-semibold text-base text-slate-100">{currentProj.name}</h1>
              <p className="text-xs text-slate-400">ID: {currentProj.id}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full card-elevated p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-slate-100">3D model unavailable</h2>
              <p className="text-sm text-slate-400 leading-relaxed mt-2">
                This project has not generated a 3D digital twin model yet.
              </p>
            </div>

            <div className="p-3 rounded-[10px] bg-aerospace-950 border border-slate-700 text-sm text-left space-y-1">
              <div className="text-slate-400">Status: <span className="text-amber-400 font-bold">{currentProj.status}</span></div>
              <div className="text-slate-400">Source type: <span className="text-slate-200">{currentProj.source_type || currentProj.inputType || 'photos'}</span></div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
              >
                Back to dashboard
              </button>
              <button
                onClick={() => {
                  api.processProject(currentProj.id).catch(() => {});
                  navigate(`/processing/${currentProj.id}`);
                }}
                className="btn btn-primary"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start processing</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Valid model_url exists for this project
  const isDemoProject = currentProj.isDemo || currentProj.source_type === 'demo';

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
      link.download = `Aero3D-${currentProj.id}-Snapshot.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* Top Header Controls Bar */}
      <header className="h-14 bg-aerospace-900 border-b border-slate-700 px-4 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="icon-btn"
            title="Return to Dashboard"
            aria-label="Return to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold text-base text-slate-100 truncate max-w-[40vw] sm:max-w-md">
                {currentProj.name}
              </h1>
              <span className={`pill hidden sm:inline-flex ${isDemoProject ? 'pill-info' : 'pill-ok'}`}>
                {isDemoProject ? 'Demo sample model' : 'Processed digital twin'}
              </span>
            </div>
            <p className="text-[13px] text-slate-400 leading-tight">
              {currentProj.metadata?.locationName ? currentProj.metadata.locationName : 'Location not specified'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/analysis/${currentProj.id}`)}
            className="hidden sm:inline-flex btn btn-secondary btn-sm"
          >
            <Box className="w-4 h-4" aria-hidden />
            <span>AI detections</span>
          </button>

          <button
            onClick={() => navigate(`/map/${currentProj.id}`)}
            className="hidden sm:inline-flex btn btn-secondary btn-sm"
          >
            <MapPin className="w-4 h-4" aria-hidden />
            <span>GIS map</span>
          </button>

          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className="icon-btn"
            title="Show or hide the model information panel"
            aria-label="Toggle model information panel"
            aria-pressed={showInfoPanel}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 3D Canvas Area */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* 3D WebGL Canvas Keyed strictly by projectId & model_url */}
        <div className="flex-1 h-full relative min-w-0">
        {/* Floating toolbar lives inside the canvas area so it never covers the info panel */}
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
          showDimensions={showDimensions}
          setShowDimensions={setShowDimensions}
          showBoundingBox={showBoundingBox}
          setShowBoundingBox={setShowBoundingBox}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          unit={unit}
          setUnit={setUnit}
        />

          <ThreeCanvas
            key={`${currentProj.id}-${currentProj.model_url}`}
            activeTool={activeTool}
            renderMode={renderMode}
            showGrid={showGrid}
            cameraPreset={cameraPreset}
            markers={markers.filter(m => m.projectId === currentProj.id)}
            onAddMarkerAtPoint={handleAddMarkerAtPoint}
            measurements={measurements.filter(m => m.projectId === currentProj.id)}
            onAddMeasurement={addMeasurement}
            scaleFactor={scaleFactor}
            isCalibrated={isCalibrated}
            projectId={currentProj.id}
            modelUrl={currentProj.model_url}
            project={currentProj}
            showDimensions={showDimensions}
            showBoundingBox={showBoundingBox}
            showLabels={showLabels}
            unit={unit}
            onMetricsUpdate={(m) => setLoadedMetricsState({ projectId: currentProj.id, metrics: m })}
          />
        </div>

        {/* Right Info Drawer Panel */}
        {showInfoPanel && (
          <ModelInfoPanel
            project={currentProj}
            metrics={loadedMetrics}
            isCalibrated={isCalibrated}
            scaleFactor={scaleFactor}
            unit={unit}
            onClose={() => setShowInfoPanel(false)}
          />
        )}
      </div>

      {/* Pin Issue Dialog Modal */}
      {pendingMarkerPoint && (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="pin-dialog-title">
          <div className="dialog space-y-5">
            <div className="flex items-center justify-between">
              <h3 id="pin-dialog-title" className="font-display text-xl font-semibold text-slate-100">Pin an inspection issue</h3>
              <button onClick={() => setPendingMarkerPoint(null)} aria-label="Close dialog" title="Close" className="icon-btn border-transparent bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMarker} className="space-y-4">
              <div>
                <label className="field-label">Issue category</label>
                <select
                  value={markerForm.category}
                  onChange={e => setMarkerForm({ ...markerForm, category: e.target.value as any })}
                  className="field"
                >
                  <option value="Structural">Structural crack or beam</option>
                  <option value="Roof">Roof membrane anomaly</option>
                  <option value="Facade">Facade damage or trim</option>
                  <option value="Vegetation">Obstruction or canopy</option>
                  <option value="Anomaly">General surface defect</option>
                </select>
              </div>

              <div>
                <label className="field-label">Severity</label>
                <select
                  value={markerForm.severity}
                  onChange={e => setMarkerForm({ ...markerForm, severity: e.target.value as any })}
                  className="field"
                >
                  <option value="High">High (critical repair)</option>
                  <option value="Medium">Medium (schedule maintenance)</option>
                  <option value="Low">Low (minor observation)</option>
                </select>
              </div>

              <div>
                <label className="field-label">Title *</label>
                <input
                  type="text"
                  required
                  value={markerForm.label}
                  onChange={e => setMarkerForm({ ...markerForm, label: e.target.value })}
                  placeholder="e.g. 3mm Vertical Crack on Beam"
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">Inspection note</label>
                <textarea
                  rows={3}
                  value={markerForm.note}
                  onChange={e => setMarkerForm({ ...markerForm, note: e.target.value })}
                  placeholder="Add detailed inspector observations..."
                  className="field"
                />
              </div>

              <div className="text-sm text-slate-400">
                Location point: <span className="readout"> [{pendingMarkerPoint.map(n => n.toFixed(2)).join(', ')}]</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingMarkerPoint(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save marker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scale Calibration Modal */}
      {showCalibrationModal && (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="cal-dialog-title">
          <div className="dialog space-y-5">
            <div className="flex items-center justify-between">
              <h3 id="cal-dialog-title" className="font-display text-xl font-semibold text-slate-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-sky-400" aria-hidden />
                <span>Calibrate scale</span>
              </h3>
              <button onClick={() => setShowCalibrationModal(false)} aria-label="Close dialog" title="Close" className="icon-btn border-transparent bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCalibration} className="space-y-4">
              <p className="text-slate-400 leading-relaxed text-sm">
                Enter a known real-world distance, such as a building width or a ground control target, to set the model scale.
              </p>

              <div>
                <label className="field-label">Known real-world distance (meters)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={calibrationInput.knownDistance}
                  onChange={e => setCalibrationInput({ ...calibrationInput, knownDistance: e.target.value })}
                  className="field readout"
                />
              </div>

              <div>
                <label className="field-label">Measured model distance (model units)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={calibrationInput.measuredDistance}
                  onChange={e => setCalibrationInput({ ...calibrationInput, measuredDistance: e.target.value })}
                  className="field readout"
                />
              </div>

              <div className="stat-tile text-sm text-slate-400">
                Scale multiplier: <span className="readout text-sky-400">{(parseFloat(calibrationInput.knownDistance) / (parseFloat(calibrationInput.measuredDistance) || 1)).toFixed(4)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalibrationModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Apply calibration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
