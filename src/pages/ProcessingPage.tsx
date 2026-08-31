import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Clock,
  Box,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useProjects } from '../store/ProjectContext';

export const ProcessingPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { providerStatus, projects } = useProjects();

  const [progress, setProgress] = useState<number>(10);
  const [currentStep, setCurrentStep] = useState<number>(3);
  const [elapsed, setElapsed] = useState<number>(0);

  const steps = [
    { label: 'Video Frame & Asset Ingestion', completed: true },
    { label: 'Feature Point Matching & Alignment', completed: true },
    { label: 'Dense Photogrammetry Point Cloud', completed: currentStep > 2 },
    { label: '3D Mesh Surface Reconstruction', completed: currentStep > 3 },
    { label: '4K UV Texture Baking & Geometry Optimization', completed: currentStep > 4 },
    { label: 'AI Scene Object Intelligence Classification', completed: currentStep > 5 },
    { label: 'Digital Twin Command Engine Ready', completed: currentStep > 6 },
  ];

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        const next = prev + 15;
        if (next > 30 && next < 50) setCurrentStep(3);
        if (next >= 50 && next < 75) setCurrentStep(4);
        if (next >= 75 && next < 95) setCurrentStep(5);
        if (next >= 95) setCurrentStep(7);
        return next;
      });
    }, 1200);

    return () => clearInterval(progressTimer);
  }, []);

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title="Reconstruction Pipeline Progress" />

        <main className="p-6 max-w-3xl mx-auto w-full space-y-6 my-auto">
          
          {/* Main Card */}
          <div className="p-8 rounded-2xl glass-panel-elevated border border-slate-700/80 shadow-2xl space-y-6 text-center">
            
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono text-xs">
              <Activity className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
              <span>{providerStatus.mode === 'demo' ? 'DEMO RECONSTRUCTION PIPELINE' : 'LIVE POLYCAM RECONSTRUCTION'}</span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-100">
              Generating 3D Digital Twin Mesh
            </h2>
            <p className="text-slate-400 text-xs max-w-lg mx-auto">
              Extracting volumetric surface geometry, baking UV texture maps, and computing GIS geospatial coordinates.
            </p>

            {/* Progress Bar & Percentage */}
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-sky-400">Processing...</span>
                <span className="text-slate-200">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-aerospace-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Elapsed: {elapsed}s</span>
                <span>Estimated Remaining: {Math.max(0, 12 - Math.floor(elapsed / 2))}s</span>
              </div>
            </div>

            {/* Step-by-step Timeline */}
            <div className="text-left bg-aerospace-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5 max-w-md mx-auto">
              {steps.map((stepItem, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  {stepItem.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : idx === currentStep - 1 ? (
                    <span className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span className={stepItem.completed ? 'text-slate-200 font-medium' : 'text-slate-500 font-sans'}>
                    {stepItem.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Complete Action */}
            {progress >= 100 && (
              <button
                onClick={() => navigate(`/viewer/${projectId || 'demo-proj-001'}`)}
                className="w-full max-w-md mx-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-aerospace-950 font-bold text-sm shadow-xl transition-all animate-bounce"
              >
                <Box className="w-4 h-4" />
                <span>Launch 3D Digital Twin Viewer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

          </div>

        </main>
      </div>
    </div>
  );
};
