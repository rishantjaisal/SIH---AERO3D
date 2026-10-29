import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban,
  Box,
  BrainCircuit,
  Activity,
  Play,
  Plus,
  ArrowUpRight,
  Clock,
  MapPin,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useProjects } from '../store/ProjectContext';
import { DeleteProjectButton } from '../components/DeleteProjectButton';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setActiveProject, providerStatus } = useProjects();

  const handleOpenProject = (proj: any) => {
    if (proj) {
      setActiveProject(proj);
      navigate(`/viewer/${proj.id}`);
    }
  };

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title="Aero3D Command Dashboard" />

        <main id="main-content" className="p-6 space-y-6 max-w-7xl mx-auto w-full">

          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl glass-panel-elevated border border-slate-700/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  SYSTEM READY
                </span>
                <span className="text-xs text-slate-400 font-mono">Provider Mode: {(providerStatus?.mode || 'demo').toUpperCase()}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 font-sans">Welcome to Aero3D Intelligence</h2>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                Transform drone surveys into interactive 3D digital twins with AI scene understanding & GIS measurements.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (projects && projects.length > 0) {
                    setActiveProject(projects[0]);
                  }
                  navigate('/viewer/demo-proj-001');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-xs shadow-md active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Load Demo Building</span>
              </button>

              <button
                onClick={() => navigate('/projects/new')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-aerospace-800 hover:bg-aerospace-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span>Create New Survey</span>
              </button>
            </div>
          </div>

          {/* Overview cards: every figure is derived from the real project list */}
          {(() => {
            const list = projects || [];
            const norm = (st?: string) => String(st || '').toUpperCase();
            const ready = list.filter(p => norm(p.status) === 'SUCCEEDED').length;
            const running = list.filter(p => ['QUEUED', 'PROCESSING'].includes(norm(p.status))).length;
            const failed = list.filter(p => norm(p.status) === 'FAILED').length;
            const withModel = list.filter(p => !!p.model_url).length;
            const stats = [
              { label: 'Survey projects', value: String(list.length), sub: `${ready} ready`, icon: FolderKanban, tone: 'text-sky-400' },
              { label: '3D models', value: String(withModel), sub: 'GLB, viewable in browser', icon: Box, tone: 'text-sky-400' },
              { label: 'Processing jobs', value: String(running), sub: failed ? `${failed} failed` : 'No failures', icon: Activity, tone: 'text-amber-400' },
              { label: 'AI detections', value: 'Not available', sub: 'Sample data on the demo project only', icon: BrainCircuit, tone: 'text-emerald-400' }
            ];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(st => (
                  <div key={st.label} className="p-4 rounded-xl glass-panel border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-300">
                      <h3 className="text-sm font-medium">{st.label}</h3>
                      <st.icon className={`w-4 h-4 ${st.tone}`} aria-hidden />
                    </div>
                    <p className={`${st.value.length > 6 ? 'text-lg' : 'text-2xl'} font-bold text-slate-100 leading-tight`}>{st.value}</p>
                    <p className="text-xs text-slate-400">{st.sub}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Recent Projects Table */}
          <div className="rounded-xl glass-panel border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-100 tracking-wide">RECENT DRONE SURVEY DIGITAL TWINS</h3>
                <p className="text-slate-400 text-xs">Select a project to launch 3D WebGL viewer or AI analysis</p>
              </div>
              <Link to="/projects" className="text-xs text-sky-400 hover:underline font-mono flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-aerospace-950/80 text-slate-400 font-mono uppercase text-xs border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Survey Project</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Mesh Model</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Survey Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {(projects || []).map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-aerospace-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
                          <Box className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sky-300 font-medium hover:underline cursor-pointer" onClick={() => handleOpenProject(proj)}>
                            {proj.name}
                          </p>
                          <span className="text-xs text-slate-400 font-mono">{proj.id}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{proj.metadata?.locationName || 'Not specified'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-xs text-slate-300">
                        {proj.metadata?.vertices && proj.metadata?.faces ? `${proj.metadata.vertices.toLocaleString()} Verts / ${proj.metadata.faces.toLocaleString()} Faces` : 'Not available'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {proj.status || 'SUCCEEDED'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">{proj.metadata?.surveyDate || (proj.created_at ? proj.created_at.slice(0, 10) : '—')}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenProject(proj)}
                          className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-colors"
                        >
                          View 3D
                        </button>
                        <Link
                          to={`/analysis/${proj.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
                        >
                          AI Detections
                        </Link>
                        <DeleteProjectButton project={proj} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
