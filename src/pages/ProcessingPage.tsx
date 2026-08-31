import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Box,
  ArrowRight,
  Download,
  FileText,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  Layers
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useProjects } from '../store/ProjectContext';
import { api } from '../services/api';

export const ProcessingPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { providerStatus, projects, refreshData, setActiveProject } = useProjects();

  const targetId = projectId || 'demo-proj-001';
  const currentProject = projects.find(p => p.id === targetId);

  const [job, setJob] = useState<any>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Poll real job status from backend
  const fetchJobStatus = useCallback(async () => {
    try {
      const jobData = await api.getJob(targetId);
      if (jobData) {
        setJob(jobData);
        if (jobData.status === 'completed') {
          refreshData();
        } else if (jobData.status === 'failed') {
          setErrorMsg(jobData.message || 'Photogrammetry reconstruction engine encountered an error.');
        }
      }
    } catch (_err) {
      // Backend status polling notice
    }
  }, [targetId, refreshData]);

  useEffect(() => {
    let isMounted = true;

    fetchJobStatus();
    const interval = setInterval(() => {
      if (isMounted) fetchJobStatus();
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [targetId, fetchJobStatus]);

  // Elapsed timer for user reference
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCompleted = job ? job.status === 'completed' : currentProject?.status === 'SUCCEEDED';
  const isFailed = job ? job.status === 'failed' : false;
  const isEngineUnavailable = job?.stage === 'ENGINE_UNAVAILABLE';
  const progress = job ? job.progress : isCompleted ? 100 : 0;

  const stagesList = [
    { key: 'QUEUED', label: 'Queued in Processing Pipeline' },
    { key: 'FRAME_EXTRACTION', label: 'FFmpeg Video Frame Extraction' },
    { key: 'FEATURE_EXTRACTION', label: 'Feature Keypoint Extraction' },
    { key: 'FEATURE_MATCHING', label: 'Feature Matching & Overlap Alignment' },
    { key: 'SPARSE_RECONSTRUCTION', label: 'Camera Pose & Sparse Point Cloud' },
    { key: 'DENSE_RECONSTRUCTION', label: 'Multi-View Stereo Dense Cloud' },
    { key: 'MESH_GENERATION', label: '3D Surface Mesh Reconstruction' },
    { key: 'TEXTURE_GENERATION', label: 'UV Texture Map Baking' },
    { key: 'GLB_CONVERSION', label: 'GLB Output Asset Export' },
    { key: 'COMPLETED', label: 'Digital Twin Ready' }
  ];

  const getStageIndex = (stage: string) => {
    const idx = stagesList.findIndex(s => s.key === stage);
    return idx >= 0 ? idx : 0;
  };

  const currentStageIdx = isCompleted ? stagesList.length - 1 : getStageIndex(job?.stage || 'QUEUED');

  const handleLaunchViewer = () => {
    if (currentProject) {
      setActiveProject(currentProject);
    }
    navigate(`/viewer/${targetId}`);
  };

  const handleUseDemoModel = () => {
    navigate(`/viewer/demo-proj-001`);
  };

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title="Reconstruction Pipeline Status" />

        <main className="p-6 max-w-3xl mx-auto w-full space-y-6 my-auto">
          
          {/* Main Status Card */}
          <div className="p-8 rounded-2xl glass-panel-elevated border border-slate-700/80 shadow-2xl space-y-6 text-center">
            
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono text-xs">
              <Activity className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
              <span>RECONSTRUCTION ENGINE: {(job?.reconstructionEngine || providerStatus?.mode || 'demo').toUpperCase()}</span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-100">
              {isCompleted
                ? (job?.reconstructionEngine === 'demo' ? 'DEMO MODE — Sample Photogrammetry Model Ready' : '3D Reconstruction Completed')
                : isFailed
                ? (isEngineUnavailable ? 'Reconstruction Engine Unavailable' : 'Reconstruction Failed')
                : job
                ? 'Reconstructing 3D Digital Twin'
                : 'Waiting for processing job...'}
            </h2>

            <p className="text-slate-400 text-xs max-w-lg mx-auto leading-relaxed">
              {job?.message || (job ? 'Executing backend photogrammetry pipeline stages.' : 'Initialising job queue status from backend server...')}
            </p>

            {/* Progress Bar & Percentage */}
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className={isFailed ? 'text-rose-400' : isCompleted ? 'text-emerald-400' : 'text-sky-400'}>
                  {isFailed ? 'FAILED' : isCompleted ? 'COMPLETED' : 'Processing...'}
                </span>
                <span className="text-slate-200">{progress}%</span>
              </div>

              <div className="w-full h-3 bg-aerospace-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isFailed
                      ? 'bg-rose-500'
                      : isCompleted
                      ? 'bg-emerald-400'
                      : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Elapsed: {elapsed}s</span>
                <span>Stage: {job?.stageLabel || (job ? 'Queued' : 'Waiting')}</span>
              </div>
            </div>

            {/* Error Diagnostics State */}
            {isFailed && (
              <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-left space-y-3 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{isEngineUnavailable ? 'ENGINE UNAVAILABLE' : 'RECONSTRUCTION FAILED'}</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {errorMsg || 'COLMAP is not available on this machine. Install/configure COLMAP or switch to Demo Mode.'}
                </p>
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={handleUseDemoModel}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-aerospace-950 text-xs font-bold shadow-md"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Use Demo Model</span>
                  </button>
                  <button
                    onClick={() => navigate('/projects/new')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Different Dataset</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step-by-step Timeline */}
            {!isFailed && job && (
              <div className="text-left bg-aerospace-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5 max-w-md mx-auto">
                {stagesList.map((stepItem, idx) => {
                  const isDone = idx < currentStageIdx || isCompleted;
                  const isCurrent = idx === currentStageIdx && !isCompleted;
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <span className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                      )}
                      <span className={isDone ? 'text-slate-200 font-medium' : isCurrent ? 'text-sky-300 font-semibold' : 'text-slate-500'}>
                        {stepItem.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quality Metrics Summary (Only displayed if returned by actual engine) */}
            {isCompleted && job?.qualityMetrics && !job.qualityMetrics.isDemoSample && (
              <div className="p-4 rounded-xl bg-aerospace-950 border border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="font-mono font-bold text-sky-300 uppercase border-b border-slate-800 pb-1">
                  Reconstruction Quality Metrics
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Input Images:</span>
                  <span className="font-mono text-slate-200">{job.qualityMetrics.inputImages || 'Not available'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Registered Images:</span>
                  <span className="font-mono text-slate-200">{job.qualityMetrics.registeredImages || 'Not available'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sparse Point Cloud:</span>
                  <span className="font-mono text-slate-200">{job.qualityMetrics.sparsePoints || 'Not available'}</span>
                </div>
              </div>
            )}

            {/* Complete Action Buttons */}
            {isCompleted && (
              <div className="space-y-3 max-w-md mx-auto">
                <button
                  onClick={handleLaunchViewer}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-aerospace-950 font-bold text-sm shadow-xl transition-all animate-bounce"
                >
                  <Box className="w-4 h-4" />
                  <span>Open 3D Digital Twin Viewer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <a
                    href={`/api/projects/${targetId}/model`}
                    download={`${targetId}_model.glb`}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg glass-panel hover:bg-slate-800 text-sky-400 font-mono font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download GLB</span>
                  </a>
                  <button
                    onClick={() => navigate(`/reports`)}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg glass-panel hover:bg-slate-800 text-slate-300 font-mono font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Inspection Report</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
};
