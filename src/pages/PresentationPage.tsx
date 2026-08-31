import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Box,
  BrainCircuit,
  Map,
  Ruler,
  ShieldCheck,
  Zap,
  Maximize2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useProjects } from '../store/ProjectContext';

export const PresentationPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveProject, projects } = useProjects();
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const slides = [
    {
      title: "Problem Statement",
      subtitle: "The Challenge in Drone Data Utilization",
      points: [
        "Unstructured Drone Video: Commercial drones capture terabytes of aerial footage, but raw videos remain disconnected flat media.",
        "Manual Inspection Delays: Structural engineers spend hours reviewing video frames to identify facade cracks and roof leaks.",
        "Lack of 3D Spatial Context: Flat images fail to deliver accurate volumetric height, foot-print area, or 3D coordinate measurements.",
        "Aero3D Solution: Automated conversion of drone survey footage into an interactive 3D digital twin with AI scene intelligence."
      ],
      tag: "01 / PROBLEM DEFINITION"
    },
    {
      title: "Drone Input & Ingestion Pipeline",
      subtitle: "Multi-Format Ingestion Engine",
      points: [
        "Universal Drone Ingestion: Accepts raw MP4/MOV flight videos, overlapping JPG image zips, or pre-built 3D models (GLB, GLTF, OBJ, PLY).",
        "Automated Video Keyframe Sampling: Extracts optimal spatial keyframes with high visual overlap for photogrammetry.",
        "Flight Telemetry Preservation: Ingests drone GSD, camera sensor payload, flight altitude, and GPS coordinates."
      ],
      tag: "02 / DATA INGESTION"
    },
    {
      title: "3D Photogrammetry Reconstruction",
      subtitle: "Provider Abstraction Layer",
      points: [
        "Polycam API Integration: Secure backend proxy handling API v1 captures, status polling, and mesh artifacts.",
        "Zero Client Secret Exposure: POLYCAM_API_TOKEN is strictly isolated in server environment variables.",
        "Demo Provider Fallback: Seamless offline 3D WebGL rendering using pre-packaged digital twin building assets."
      ],
      tag: "03 / 3D RECONSTRUCTION"
    },
    {
      title: "AI Scene Intelligence",
      subtitle: "Semantic Object Classification & Damage Detection",
      points: [
        "Semantic Segmentation: Automated classification of Academic Buildings, Flat Roof Systems, Asphalt Access Roads, Canopy, and Vehicles.",
        "Computer Vision Confidence Scoring: Provides quantitative confidence ratings (e.g. 96% Building, 94% Roof).",
        "Structural Defect Flagging: Detects hairline cracks, facade discoloration, and roof membrane anomalies."
      ],
      tag: "04 / AI SCENE INTELLIGENCE"
    },
    {
      title: "GIS Spatial Mapping & Sync",
      subtitle: "Geospatial Context Integration",
      points: [
        "Split-Screen Synchronization: Interactive Leaflet map synchronized with live 3D WebGL model viewport.",
        "Multi-Layer Tiles: Toggle between CartoDB Dark Vector, Esri High-Res Satellite, and Street maps.",
        "Boundary Polygon Mapping: Automated flight survey perimeter visualization."
      ],
      tag: "05 / GIS SPATIAL MAPPING"
    },
    {
      title: "3D Measurement & Inspection Engine",
      subtitle: "Interactive 3D Raycasting Toolkit",
      points: [
        "Raycasted 3D Measurements: Click any 2 points on the 3D model surface to calculate Euclidean distance and vertical height deltas.",
        "User Scale Calibration: Input known reference distance (e.g. 10m Ground Control Target) to calibrate scale factor.",
        "3D Pin Placement: Attach spatial issue markers with category, severity ratings, notes, and exact [x, y, z] coordinates."
      ],
      tag: "06 / 3D MEASUREMENT & INSPECTION"
    },
    {
      title: "Digital Twin Mission Control Center",
      subtitle: "Unified Operational Dashboard",
      points: [
        "Command Center Interface: Combines 3D Mesh geometry, GIS map, AI objects, and inspection pins into a single view.",
        "Layer Visibility Toggles: Selectively toggle Buildings, Roads, Vegetation, Inspection Pins, and GPS Grid.",
        "Executive PDF Audit Generator: Instant printable survey reports with 3D canvas snapshots and signoff lines."
      ],
      tag: "07 / DIGITAL TWIN COMMAND"
    },
    {
      title: "Impact, Innovation & Future Scope",
      subtitle: "Smart India Hackathon 2026 Vision",
      points: [
        "Infrastructure Impact: Accelerated structural safety audits for smart cities, highways, bridges, and industrial campuses.",
        "Key Innovation: Browser-native 3D WebGL performance with zero plugin requirement + secure API provider abstraction.",
        "Future Scope: Real-time IoT sensor telemetry overlays, AR field inspection headset sync, and thermal drone imaging."
      ],
      tag: "08 / SIH 2026 IMPACT"
    }
  ];

  const slide = slides[currentSlide];

  return (
    <div className="h-screen w-screen bg-aerospace-950 text-slate-100 flex flex-col justify-between p-8 font-sans selection:bg-sky-500/30 overflow-hidden relative">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold font-mono">
            SIH
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 font-mono tracking-wider">AERO<span className="text-sky-400">3D</span> INTELLIGENCE</h1>
            <p className="text-[10px] text-slate-400 font-sans">Smart India Hackathon 2026 Presentation Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {slide.tag}
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 rounded-lg bg-aerospace-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono"
          >
            Exit Presentation
          </button>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="max-w-5xl mx-auto w-full my-auto space-y-6 animate-in fade-in zoom-in-95">
        <div>
          <span className="text-xs font-mono text-sky-400 uppercase tracking-widest block mb-1">{slide.subtitle}</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-100">{slide.title}</h2>
        </div>

        <div className="space-y-4 pt-4">
          {slide.points.map((pt, idx) => {
            const [boldPart, ...rest] = pt.split(':');
            return (
              <div key={idx} className="p-4 rounded-xl glass-panel border border-slate-800 flex items-start gap-3 hover:border-sky-500/40 transition-colors">
                <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">
                  <strong className="text-sky-300 font-bold">{boldPart}:</strong> {rest.join(':')}
                </p>
              </div>
            );
          })}
        </div>

        {/* Final Slide Launch Demo Button */}
        {currentSlide === slides.length - 1 && (
          <div className="pt-4 text-center">
            <button
              onClick={() => {
                setActiveProject(projects[0]);
                navigate('/viewer/demo-proj-001');
              }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-extrabold text-base shadow-2xl shadow-sky-500/30 transition-all animate-bounce"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Launch Live 3D Digital Twin Demo</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer Controls */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="text-xs text-slate-500 font-mono">
          Slide {currentSlide + 1} of {slides.length}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
            disabled={currentSlide === 0}
            className="p-2 rounded-lg bg-aerospace-850 border border-slate-700 text-slate-300 disabled:opacity-40 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold disabled:opacity-40"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
};
