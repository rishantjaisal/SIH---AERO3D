import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Play,
  PlusCircle,
  BrainCircuit,
  Map,
  Ruler,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Layers,
  Cpu,
  Compass,
  FileText,
  Sparkles
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useProjects } from '../store/ProjectContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setActiveProject } = useProjects();

  const handleLaunchDemo = () => {
    if (projects.length > 0) {
      setActiveProject(projects[0]);
    }
    navigate('/viewer/demo-proj-001');
  };

  return (
    <div className="min-h-screen bg-aerospace-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Main Hero Section */}
      <main className="flex-1">
        
        <section className="relative overflow-hidden pt-16 pb-24 border-b border-slate-800/80">
          
          {/* Subtle Background Glow Grids */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-aerospace-950 to-aerospace-950 pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-aerospace-850 border border-sky-500/30 text-sky-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Smart India Hackathon 2026 Project Innovation</span>
              </div>

              {/* Title & Tagline */}
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 font-sans leading-tight">
                Turn a Single Drone Flight into an <br />
                <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Intelligent 3D Digital Twin
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Transform raw drone surveys and flight footage into interactive, browser-native 3D WebGL environments with integrated AI scene intelligence, GIS mapping, and millimetric measurements.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <button
                  onClick={handleLaunchDemo}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-sm transition-all shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Interactive Demo</span>
                </button>

                <Link
                  to="/projects/new"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-aerospace-850 hover:bg-aerospace-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4 text-sky-400" />
                  <span>Start New Survey</span>
                </Link>
              </div>

            </div>

            {/* Pipeline Workflow Banner */}
            <div className="mt-16 p-6 rounded-2xl glass-panel-elevated border border-slate-700/80 shadow-2xl">
              <div className="text-center mb-6">
                <h3 className="font-mono text-xs text-sky-400 uppercase tracking-widest">End-to-End Processing Workflow</h3>
                <h2 className="text-lg font-bold text-slate-100">From Aerial Imagery to Autonomous Digital Twin</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-aerospace-950/80 border border-slate-800 text-center space-y-2 hover:border-sky-500/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono font-bold mx-auto">01</div>
                  <h4 className="font-bold text-slate-200 text-sm">Drone Capture</h4>
                  <p className="text-slate-400 text-xs">Ingest MP4, MOV videos or image sets</p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-aerospace-950/80 border border-slate-800 text-center space-y-2 hover:border-sky-500/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono font-bold mx-auto">02</div>
                  <h4 className="font-bold text-slate-200 text-sm">3D Photogrammetry</h4>
                  <p className="text-slate-400 text-xs">Polycam API / Local mesh reconstruction</p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-aerospace-950/80 border border-slate-800 text-center space-y-2 hover:border-sky-500/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono font-bold mx-auto">03</div>
                  <h4 className="font-bold text-slate-200 text-sm">AI Scene Intelligence</h4>
                  <p className="text-slate-400 text-xs">Classify buildings, roads, vegetation & damage</p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl bg-aerospace-950/80 border border-slate-800 text-center space-y-2 hover:border-sky-500/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono font-bold mx-auto">04</div>
                  <h4 className="font-bold text-slate-200 text-sm">GIS & Measurements</h4>
                  <p className="text-slate-400 text-xs">Distance, height & spatial coordinate sync</p>
                </div>

                {/* Step 5 */}
                <div className="p-4 rounded-xl bg-aerospace-950/80 border border-slate-800 text-center space-y-2 hover:border-sky-500/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono font-bold mx-auto">05</div>
                  <h4 className="font-bold text-slate-200 text-sm">Digital Twin Report</h4>
                  <p className="text-slate-400 text-xs">Executive PDF & interactive command center</p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="font-mono text-xs text-sky-400 uppercase tracking-widest">Built for Aerospace & Engineering</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">Professional Drone Mapping Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3 hover:border-sky-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">High-Performance 3D WebGL</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Render dense GLB digital twin models smoothly in the browser using Three.js and React Three Fiber with zero plugin installation.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3 hover:border-sky-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">AI Scene Intelligence</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Automated detection of buildings, roof structures, pavement, vegetation canopy, vehicles, and facade cracks with confidence scoring.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3 hover:border-sky-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Ruler className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">3D Measurement Toolkit</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Raycasted 3D distance, elevation delta, and surface area measurements with user-defined scale calibration controls.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3 hover:border-sky-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">GIS Coordinate Synchronization</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Leaflet split-screen mapping with satellite imagery overlays, flight survey boundary polygons, and GPS tagging.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3 hover:border-sky-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">Polycam Provider Abstraction</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Secure backend proxy layer supporting Polycam API captures with zero exposed client secrets and seamless offline demo fallback.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3 hover:border-sky-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">Executive Report Generator</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Export comprehensive inspection reports with 3D canvas snapshots, coordinate summaries, and structural findings.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-aerospace-950 py-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-slate-300 font-bold">Aero3D Intelligence</span> © 2026 — Smart India Hackathon Project
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/presentation" className="hover:text-sky-300">Presentation Mode</Link>
            <Link to="/about" className="hover:text-sky-300">Architecture</Link>
            <Link to="/settings" className="hover:text-sky-300">System Health</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
