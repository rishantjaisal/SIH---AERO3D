import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { Box, BrainCircuit, Cpu, Map, ShieldCheck, Layers, FileText } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title="System Architecture & Innovation" />

        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">
          
          <div>
            <span className="font-mono text-xs text-sky-400 uppercase tracking-widest">TECHNICAL CREDIBILITY DOCUMENTATION</span>
            <h2 className="text-2xl font-extrabold text-slate-100 mt-1">Aero3D System Architecture</h2>
          </div>

          <div className="p-6 rounded-2xl glass-panel-elevated border border-slate-700/80 space-y-4 leading-relaxed text-xs">
            <h3 className="text-sm font-bold text-sky-300 font-mono uppercase">1. Photogrammetry & Provider Abstraction Layer</h3>
            <p className="text-slate-300">
              Aero3D implements a decoupled provider design pattern (<code className="font-mono text-sky-400">ReconstructionProvider</code>). The platform integrates with the Polycam REST API v1 when valid credentials (<code className="font-mono text-sky-400">POLYCAM_API_TOKEN</code>) are configured in backend environment variables. If Polycam access is unconfigured or rate-limited, the system seamlessly transitions to <code className="font-mono text-amber-400">DemoProvider</code>, serving local GLB digital twin assets without exposing raw API errors.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 leading-relaxed text-xs">
            <h3 className="text-sm font-bold text-sky-300 font-mono uppercase">2. WebGL 3D Digital Twin Engine</h3>
            <p className="text-slate-300">
              Built on React Three Fiber and Three.js, the 3D viewer renders volumetric GLB/GLTF assets with 60 FPS performance. Features custom raycasting for 3D distance and vertical elevation measurements, user-calibrated scale factor conversion, and surface issue pin placement.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 leading-relaxed text-xs">
            <h3 className="text-sm font-bold text-sky-300 font-mono uppercase">3. AI Computer Vision Scene Intelligence</h3>
            <p className="text-slate-300">
              Extracted 3D meshes undergo automated semantic segmentation into geospatial categories: Buildings, Flat Concrete Roofs, Access Roads, Vegetation Canopy, Vehicles, and Facade Anomalies. Detections include 3D bounding box extents, footprint area $m^2$, and confidence metrics.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 leading-relaxed text-xs">
            <h3 className="text-sm font-bold text-sky-300 font-mono uppercase">4. GIS Spatial Coordinates & Executive Audit Generator</h3>
            <p className="text-slate-300">
              Leaflet spatial mapping provides synchronized split-screen viewing with CartoDB dark vector, Esri satellite, and flight survey boundary polygons. Executive PDF report generation produces print-ready survey audits with 3D canvas snapshots and inspection signoffs.
            </p>
          </div>

        </main>
      </div>
    </div>
  );
};
