import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BrainCircuit,
  Box,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useProjects } from '../store/ProjectContext';
import { api } from '../services/api';
import { AIObjectDetection } from '../types';

export const AIAnalysisPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjects();
  const targetId = projectId || activeProject?.id || 'demo-proj-001';
  
  const [analysisData, setAnalysisData] = useState<{ isDemo: boolean; summary: any; detections: AIObjectDetection[] }>({
    isDemo: true,
    summary: { totalObjects: 6 },
    detections: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    async function loadAI() {
      setLoading(true);
      const data = await api.getAIAnalysis(targetId);
      setAnalysisData(data);
      setLoading(false);
    }
    loadAI();
  }, [targetId]);

  const filteredDetections = selectedCategory === 'ALL'
    ? analysisData.detections
    : analysisData.detections.filter(d => d.category === selectedCategory);

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title="AI Scene Intelligence & Computer Vision" />

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">

          {/* Header Banner */}
          <div className="p-6 rounded-2xl glass-panel-elevated border border-slate-700/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {analysisData.isDemo ? 'DEMO AI ANALYSIS' : 'LIVE CV CLASSIFICATION'}
                </span>
                <span className="text-xs text-slate-400 font-mono">Model Target: {activeProject?.name || 'KIET Campus Survey'}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 font-sans">AI Object Classification & Anomaly Detection</h2>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                Automated segmentation of drone photogrammetry mesh assets into semantic geospatial categories.
              </p>
            </div>

            <button
              onClick={() => navigate(`/viewer/${targetId}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-xs shadow-md transition-all shrink-0"
            >
              <Box className="w-4 h-4" />
              <span>Highlight in 3D Viewer</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 font-mono text-xs">
            {['ALL', 'Building', 'Roof', 'Road', 'Vegetation', 'Vehicle', 'Structural Anomaly'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-aerospace-950 font-bold border-sky-400 shadow'
                    : 'bg-aerospace-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Detections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDetections.map((det) => (
              <div key={det.id} className="p-4 rounded-xl glass-panel border border-slate-800 space-y-3 hover:border-sky-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {det.category.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs text-emerald-400 font-bold">
                    <span>{(det.confidence * 100).toFixed(0)}% CONFIDENCE</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{det.label}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">{det.status}</p>
                </div>

                <div className="p-2.5 rounded bg-aerospace-950 border border-slate-800/80 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Footprint Area:</span>
                    <span className="text-slate-200 font-semibold">{det.areaM2} m²</span>
                  </div>
                  {det.boundingBox && (
                    <div className="flex justify-between text-slate-400">
                      <span>3D Bounds:</span>
                      <span className="text-sky-300 text-[10px]">
                        [{det.boundingBox.min.join(',')}] to [{det.boundingBox.max.join(',')}]
                      </span>
                    </div>
                  )}
                </div>

                {det.severity && (
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Severity: {det.severity} Inspection Anomaly</span>
                  </div>
                )}
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
};
