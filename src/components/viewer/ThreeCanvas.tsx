import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingModel } from './BuildingModel';
import { InspectionMarkers } from './InspectionMarkers';
import { MeasurementTool } from './MeasurementTool';
import { ActiveTool, RenderMode, CameraPreset } from './FloatingToolbar';
import { InspectionMarker, Measurement3D, Project } from '../../types';

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
  project
}) => {
  const controlsRef = useRef<any>(null);
  const [activePoints, setActivePoints] = useState<Array<[number, number, number]>>([]);

  // Adjust camera position based on preset
  React.useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    if (cameraPreset === 'top') {
      controls.object.position.set(0, 50, 0);
      controls.target.set(0, 5, 0);
    } else if (cameraPreset === 'front') {
      controls.object.position.set(0, 10, 45);
      controls.target.set(0, 5, 0);
    } else if (cameraPreset === 'side') {
      controls.object.position.set(45, 10, 0);
      controls.target.set(0, 5, 0);
    } else {
      controls.object.position.set(25, 20, 25);
      controls.target.set(0, 5, 0);
    }
    controls.update();
  }, [cameraPreset]);

  // Click handler on 3D scene surface
  const handlePointerDown = (e: any) => {
    // Only capture click when interacting with measurement or marker tools
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
          unit: 'm',
          points: [p1, p2]
        });

        setActivePoints([]);
      }
    }
  };

  return (
    <div className="w-full h-full relative bg-aerospace-950">
      
      {/* Status Overlay Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel text-xs font-mono font-semibold border border-slate-700/80">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-200">LIVE 3D DIGITAL TWIN</span>
      </div>

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
          minDistance={3}
          maxDistance={120}
          enabled={activeTool === 'orbit'}
        />

        {/* Lighting Rig */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[30, 40, 20]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />
        <directionalLight position={[-20, 20, -20]} intensity={0.4} />

        {/* Floor Grid Helper */}
        {showGrid && (
          <Grid
            position={[0, -0.41, 0]}
            args={[100, 100]}
            cellSize={2}
            cellThickness={0.8}
            cellColor="#1f3152"
            sectionSize={10}
            sectionThickness={1.5}
            sectionColor="#38bdf8"
            fadeDistance={80}
          />
        )}

        {/* Ground Contact Shadows */}
        <ContactShadows
          position={[0, -0.4, 0]}
          opacity={0.6}
          scale={70}
          blur={1.5}
          far={10}
        />

        {/* 3D Digital Twin Mesh Model */}
        <Suspense fallback={null}>
          <BuildingModel renderMode={renderMode} project={project} />
        </Suspense>

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
    </div>
  );
};
