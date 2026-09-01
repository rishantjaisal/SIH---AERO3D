import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingModel, ModelMetrics } from './BuildingModel';
import { InspectionMarkers } from './InspectionMarkers';
import { MeasurementTool } from './MeasurementTool';
import { ActiveTool, RenderMode, CameraPreset } from './FloatingToolbar';
import { InspectionMarker, Measurement3D, Project } from '../../types';
import { AlertTriangle, RefreshCw, EyeOff } from 'lucide-react';

interface ThreeCanvasProps {
  activeTool: ActiveTool;
  renderMode: RenderMode;
  showGrid: boolean;
  cameraPreset: CameraPreset;
  markers: InspectionMarker[];
  onAddMarkerAtPoint: (point: [number, number, number]) => void;
  measurements: Measurement3D[];
  onAddMeasurement: (meas: Omit<Measurement3D, 'id' | 'timestamp'>) => void;
  scaleFactor: number;
  isCalibrated: boolean;
  projectId: string;
  project?: Project;
  onMetricsUpdate?: (metrics: ModelMetrics) => void;
}

const LoadingOverlay: React.FC<{ projectName?: string }> = ({ projectName }) => {
  const { progress } = useProgress();
  return (
    <div className="absolute inset-0 z-30 bg-aerospace-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none font-mono">
      <div className="max-w-sm w-full glass-panel-elevated p-6 rounded-2xl border border-slate-700/80 space-y-4 text-center shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>3D CANVAS INGESTION</span>
        </div>
        <h3 className="text-sm font-bold tracking-wider text-slate-100 uppercase truncate">
          LOADING {projectName ? projectName.toUpperCase() : '3D DIGITAL TWIN'}
        </h3>
        <div className="space-y-2">
          <div className="w-full h-3 bg-aerospace-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(8, progress)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Loading 3D model geometry...</span>
            <span className="text-sky-300 font-bold">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

class GLTFErrorBoundary extends React.Component<
  { children: React.ReactNode; projectUrl: string; fallback: (error: Error, reset: () => void) => React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[Aero3D 3D Viewer] GLTF Load Error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return this.props.children;
  }
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  activeTool,
  renderMode,
  showGrid,
  cameraPreset,
  markers,
  onAddMarkerAtPoint,
  measurements,
  onAddMeasurement,
  scaleFactor,
  isCalibrated,
  projectId,
  project,
  onMetricsUpdate
}) => {
  const controlsRef = useRef<any>(null);
  const [activePoints, setActivePoints] = useState<Array<[number, number, number]>>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [hasNativePointCloud, setHasNativePointCloud] = useState<boolean>(true);

  const handleModelLoaded = useCallback((metrics: ModelMetrics) => {
    setModelMetrics(metrics);
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [onMetricsUpdate]);

  // Automatic Camera Auto-Fit based on actual loaded model size
  useEffect(() => {
    if (!controlsRef.current || !modelMetrics) return;
    const controls = controlsRef.current;

    const size = modelMetrics.size;
    const maxDim = modelMetrics.maxDimension || 20;
    const dist = maxDim * 1.8;
    const targetY = size.y / 2;

    controls.target.set(0, targetY, 0);

    if (cameraPreset === 'top') {
      controls.object.position.set(0, targetY + dist * 1.6, 0);
    } else if (cameraPreset === 'front') {
      controls.object.position.set(0, targetY + dist * 0.2, dist * 1.2);
    } else if (cameraPreset === 'side') {
      controls.object.position.set(dist * 1.2, targetY + dist * 0.2, 0);
    } else {
      controls.object.position.set(dist * 0.75, targetY + dist * 0.5, dist * 0.75);
    }
    controls.update();
  }, [cameraPreset, modelMetrics]);

  // Click handler on 3D scene surface
  const handlePointerDown = (e: any) => {
    if (activeTool === 'orbit') return;
    e.stopPropagation();

    const point: [number, number, number] = [e.point.x, e.point.y, e.point.z];

    if (activeTool === 'add-marker') {
      onAddMarkerAtPoint(point);
    } else if (activeTool === 'measure-distance' || activeTool === 'measure-height') {
      const nextPoints = [...activePoints, point];
      if (nextPoints.length === 1) {
        setActivePoints(nextPoints);
      } else if (nextPoints.length === 2) {
        const [p1, p2] = nextPoints;
        let rawVal = 0;
        if (activeTool === 'measure-height') {
          rawVal = Math.abs(p2[1] - p1[1]);
        } else {
          rawVal = Math.sqrt(
            Math.pow(p2[0] - p1[0], 2) +
            Math.pow(p2[1] - p1[1], 2) +
            Math.pow(p2[2] - p1[2], 2)
          );
        }
        const realMeter = rawVal * scaleFactor;

        onAddMeasurement({
          projectId,
          type: activeTool === 'measure-height' ? 'height' : 'distance',
          value: rawVal,
          realValueMeter: realMeter,
          unit: isCalibrated ? 'm' : 'model units',
          points: [p1, p2]
        });

        setActivePoints([]);
      }
    }
  };

  const gridScale = modelMetrics ? Math.max(80, modelMetrics.maxDimension * 3) : 100;
  const targetUrl = project?.model_url || '/demo/build.glb';

  return (
    <div className="w-full h-full relative bg-aerospace-950 overflow-hidden">
      
      {/* Top Status Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel text-xs font-mono font-semibold border border-slate-700/80 shadow-lg select-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-200">
          {project?.isDemo ? 'DEMO PHOTOGRAMMETRY MODEL' : 'PROCESSED 3D DIGITAL TWIN'}
        </span>
      </div>

      {/* Point Cloud Unavailable Notice */}
      {renderMode === 'pointcloud' && !hasNativePointCloud && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono backdrop-blur-md shadow-xl">
          <EyeOff className="w-4 h-4 shrink-0" />
          <span>Point cloud representation unavailable for this model.</span>
        </div>
      )}

      <GLTFErrorBoundary
        projectUrl={targetUrl}
        fallback={(_error, reset) => (
          <div className="absolute inset-0 z-30 bg-aerospace-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none font-mono">
            <div className="max-w-md w-full glass-panel-elevated p-6 rounded-2xl border border-rose-500/40 space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">3D MODEL ASSET NOT LOADED</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Model binary asset <code className="text-sky-300 bg-slate-900 px-1.5 py-0.5 rounded">{targetUrl}</code> is not available or still processing.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    reset();
                    window.location.reload();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-xs shadow-lg transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Loading Model</span>
                </button>
              </div>
            </div>
          </div>
        )}
      >
        <Suspense fallback={<LoadingOverlay projectName={project?.name} />}>
          <Canvas
            shadows
            gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' }}
            camera={{ position: [25, 20, 25], fov: 45 }}
            onPointerDown={handlePointerDown}
          >
            {/* Orbit Controls */}
            <OrbitControls
              ref={controlsRef}
              makeDefault
              enableDamping
              dampingFactor={0.05}
              maxPolarAngle={Math.PI / 2 + 0.05}
              minDistance={1}
              maxDistance={500}
              enabled={activeTool === 'orbit'}
            />

            {/* Lighting Rig Optimized for Photogrammetry */}
            <ambientLight intensity={0.8} />
            <directionalLight position={[30, 40, 20]} intensity={1.5} castShadow />
            <directionalLight position={[-20, 20, -20]} intensity={0.5} />
            <directionalLight position={[0, -20, 0]} intensity={0.2} />

            {/* Ground Grid Helper */}
            {showGrid && (
              <Grid
                position={[0, -0.01, 0]}
                args={[gridScale, gridScale]}
                cellSize={2}
                cellThickness={0.8}
                cellColor="#1f3152"
                sectionSize={10}
                sectionThickness={1.5}
                sectionColor="#38bdf8"
                fadeDistance={gridScale * 0.8}
              />
            )}

            {/* Ground Contact Shadows */}
            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.5}
              scale={gridScale * 0.8}
              blur={1.5}
              far={15}
            />

            {/* 3D Digital Twin Mesh Model */}
            <BuildingModel
              renderMode={renderMode}
              project={project}
              onModelLoaded={handleModelLoaded}
              onHasPointcloudChange={setHasNativePointCloud}
            />

            {/* 3D Inspection Markers Overlay */}
            <InspectionMarkers markers={markers} />

            {/* 3D Distance / Height Measurement Tool Overlay */}
            <MeasurementTool
              activePoints={activePoints}
              measurements={measurements}
              scaleFactor={scaleFactor}
              isCalibrated={isCalibrated}
            />
          </Canvas>
        </Suspense>
      </GLTFErrorBoundary>
    </div>
  );
};
