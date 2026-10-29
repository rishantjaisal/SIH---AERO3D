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
import { EnvironmentId, EnvironmentStatus, ENVIRONMENT_LABEL, MOUNTAIN_URL } from '../components/viewer/EnvironmentLayer';
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
  const [environment, setEnvironment] = useState<EnvironmentId>('default');
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus>('idle');
  const [environmentError, setEnvironmentError] = useState<string | null>(null);
  const handleEnvironmentStatus = React.useCallback((st: EnvironmentStatus) => {
    setEnvironmentStatus(st);
    if (st === 'error') {
      // Return to the default environment; the project model is untouched
      setEnvironment('default');
      setEnvironmentError(`The mountain model could not be loaded from ${MOUNTAIN_URL}. Check that the file is a valid GLB.`);
    }
  }, []);
  const chooseEnvironment = (e: EnvironmentId) => {
    setEnvironmentError(null);
    setEnvironment(e);
  };
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
      <div className="flex flex-col h-screen bg-aerospace-950 text-slate-100 items-center justify-center p-6 font-mono select-none">
        <div className="max-w-md w-full glass-panel-elevated p-8 rounded-2xl border border-slate-700/80 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <FileQuestion className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Project Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            No survey project exists with ID <code className="text-sky-300 font-mono bg-slate-900 px-2 py-0.5 rounded">{projectId}</code>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-xs shadow-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
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
        <header className="h-14 bg-aerospace-900 border-b border-slate-800 px-4 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 rounded-lg bg-aerospace-950 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-bold text-sm text-slate-100">{currentProj.name}</h1>
              <p className="text-xs text-slate-400">ID: {currentProj.id}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 font-mono">
          <div className="max-w-md w-full glass-panel-elevated p-8 rounded-2xl border border-sky-500/30 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">3D Model Unavailable</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">
                This project has not generated a 3D digital twin model yet.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-aerospace-950 border border-slate-800 text-xs text-left space-y-1 font-mono">
              <div className="text-slate-400">Status: <span className="text-amber-400 font-bold">{currentProj.status}</span></div>
              <div className="text-slate-400">Source Type: <span className="text-slate-200">{currentProj.source_type || currentProj.inputType || 'photos'}</span></div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  api.processProject(currentProj.id).catch(() => {});
                  navigate(`/processing/${currentProj.id}`);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-xs shadow-lg transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Processing</span>
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
      <header className="h-14 bg-aerospace-900 border-b border-slate-800 px-4 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded-lg bg-aerospace-950 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Return to Dashboard"
            aria-label="Return to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-100 tracking-wide truncate max-w-xs sm:max-w-md">
                {currentProj.name}
              </h1>
              <span className={`px-2 py-0.5 rounded text-xs font-mono border ${
                isDemoProject ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {isDemoProject ? 'DEMO SAMPLE MODEL' : 'PROCESSED 3D DIGITAL TWIN'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              {currentProj.metadata?.locationName ? `Location: ${currentProj.metadata.locationName}` : 'Survey Location: Unspecified'}
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
          environment={environment}
          setEnvironment={chooseEnvironment}
          environmentStatus={environmentStatus}
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
            environment={environment}
            onEnvironmentStatus={handleEnvironmentStatus}
          />

          {/* Current environment label */}
          <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-md bg-aerospace-900/80 border border-slate-700 text-xs text-slate-300 pointer-events-none" aria-live="polite">
            {ENVIRONMENT_LABEL[environment]}
          </div>
          {environmentError && (
            <div role="alert" className="absolute bottom-12 left-3 right-3 sm:right-auto sm:max-w-md z-20 flex items-start gap-3 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs">
              <span className="flex-1">{environmentError}</span>
              <button type="button" onClick={() => setEnvironmentError(null)} className="text-amber-300 hover:text-white">Dismiss</button>
            </div>
          )}
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel-elevated p-6 rounded-2xl border border-slate-700 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100">Add Inspection Marker Pin</h3>
              <button onClick={() => setPendingMarkerPoint(null)} aria-label="Close dialog" className="text-slate-400 hover:text-white">
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

              <div className="text-xs text-slate-400 font-mono">
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
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-sky-400" />
                <span>3D Model Scale Calibration</span>
              </h3>
              <button onClick={() => setShowCalibrationModal(false)} aria-label="Close dialog" className="text-slate-400 hover:text-white">
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
                <label className="block text-slate-300 font-medium mb-1">Measured Model Distance (model units)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={calibrationInput.measuredDistance}
                  onChange={e => setCalibrationInput({ ...calibrationInput, measuredDistance: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-aerospace-950 border border-slate-800 text-xs font-mono text-sky-400">
                Calculated Scale Multiplier: {(parseFloat(calibrationInput.knownDistance) / (parseFloat(calibrationInput.measuredDistance) || 1)).toFixed(4)}
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
