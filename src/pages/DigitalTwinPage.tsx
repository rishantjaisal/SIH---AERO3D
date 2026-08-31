import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Activity,
  Layers,
  Box,
  BrainCircuit,
  Ruler,
  MapPin,
  ShieldCheck,
  CheckSquare,
  Square
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { ThreeCanvas } from '../components/viewer/ThreeCanvas';
import { useProjects } from '../store/ProjectContext';

export const DigitalTwinPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, activeProject, markers, measurements, scaleFactor, isCalibrated } = useProjects();
  const currentProj = (projects || []).find(p => p && p.id === projectId) || activeProject || projects[0];

  const [layers, setLayers] = useState({
    building: true,
    roads: true,
    vegetation: true,
    inspectionMarkers: true,
    measurements: true,
    gpsGrid: true
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title="Digital Twin Mission Control Center" />

        <div className="flex-1 flex min-h-0 relative">
          
          {/* Main 3D Canvas */}
          <div className="flex-1 h-full relative">
            <ThreeCanvas
              activeTool="orbit"
              renderMode="textured"
              showGrid={layers.gpsGrid}
              cameraPreset="default"
              markers={layers.inspectionMarkers ? markers : []}
              onAddMarkerAtPoint={() => {}}
              measurements={layers.measurements ? measurements : []}
              onAddMeasurement={() => {}}
              scaleFactor={scaleFactor}
              isCalibrated={isCalibrated}
              projectId={currentProj?.id || 'demo-proj-001'}
              project={currentProj}
            />
          </div>

          {/* Layer Control Panel */}
          <div className="w-72 bg-aerospace-900/95 border-l border-slate-800 p-4 space-y-4 font-sans text-xs backdrop-blur-md z-20">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-slate-100 font-mono">COMMAND LAYERS</h3>
            </div>

            <div className="space-y-2">
              {[
                { key: 'building', label: 'Building Mesh Structure', count: `${(currentProj?.metadata?.vertices || 48520).toLocaleString()} Verts` },
                { key: 'roads', label: 'Access Roads & Parking', count: '3 Segments' },
                { key: 'vegetation', label: 'Vegetation Canopy', count: '5 Clusters' },
                { key: 'inspectionMarkers', label: 'Inspection Issue Markers', count: `${markers.length} Pins` },
                { key: 'measurements', label: '3D Telemetry Measurements', count: `${measurements.length} Active` },
                { key: 'gpsGrid', label: 'Geospatial Elevation Grid', count: '10m Mesh' },
              ].map(item => {
                const isChecked = layers[item.key as keyof typeof layers];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleLayer(item.key as any)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                      isChecked ? 'bg-sky-500/10 border-sky-500/30 text-slate-200' : 'bg-aerospace-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-sky-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                      <span className="font-medium text-xs">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{item.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-aerospace-950 border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <span className="text-slate-500 block uppercase">Mission Telemetry</span>
              <div className="flex justify-between text-slate-300">
                <span>Signal Status:</span>
                <span className="text-emerald-400 font-bold">OPTIMAL</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>FPS Performance:</span>
                <span className="text-sky-300 font-bold">60.0 FPS</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
