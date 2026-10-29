import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban,
  Box,
  BrainCircuit,
  Activity,
  Play,
  Plus,
  MapPin,
  ChevronRight
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
        <Topbar title="Overview" />

        <main id="main-content" className="px-5 sm:px-8 py-8 space-y-10 max-w-[1200px] mx-auto w-full">

          {/* Page header */}
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3">
              <p className="eyebrow">Overview · {(providerStatus?.mode || 'demo') === 'demo' ? 'Demo engine' : `${providerStatus?.mode} engine`}</p>
              <h2 className="page-title">Your digital twins</h2>
              <p className="page-lede">Open a survey in the 3D viewer, measure it, or start a new one from drone footage or a GLB model.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (projects && projects.length > 0) setActiveProject(projects[0]);
                  navigate('/viewer/demo-proj-001');
                }}
                className="btn btn-primary"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden />
                Open demo building
              </button>
              <button onClick={() => navigate('/projects/new')} className="btn btn-secondary">
                <Plus className="w-4 h-4" aria-hidden />
                New survey
              </button>
            </div>
          </header>

          {/* Overview figures: every number is derived from the real project list */}
          {(() => {
            const list = projects || [];
            const norm = (st?: string) => String(st || '').toUpperCase();
            const ready = list.filter(p => norm(p.status) === 'SUCCEEDED').length;
            const running = list.filter(p => ['QUEUED', 'PROCESSING'].includes(norm(p.status))).length;
            const failed = list.filter(p => norm(p.status) === 'FAILED').length;
            const withModel = list.filter(p => !!p.model_url).length;
            const stats = [
              { label: 'Survey projects', value: String(list.length), sub: `${ready} ready to inspect`, icon: FolderKanban },
              { label: '3D models', value: String(withModel), sub: 'GLB, viewable in the browser', icon: Box },
              { label: 'Processing jobs', value: String(running), sub: failed ? `${failed} failed` : 'No failures', icon: Activity },
              { label: 'AI detections', value: 'n/a', sub: 'Sample data on the demo project only', icon: BrainCircuit }
            ];
            return (
              <section aria-label="Overview figures" className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden bg-slate-700/60 border border-slate-700/60">
                {stats.map(st => (
                  <div key={st.label} className="bg-aerospace-850 p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <st.icon className="w-4 h-4 text-sky-400" aria-hidden />
                      <h3 className="text-sm font-medium font-sans tracking-normal">{st.label}</h3>
                    </div>
                    <p className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-slate-100">{st.value}</p>
                    <p className="mt-2 text-sm text-slate-400">{st.sub}</p>
                  </div>
                ))}
              </section>
            );
          })()}

          {/* Projects */}
          <section aria-labelledby="recent-projects">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h3 id="recent-projects" className="font-display text-2xl font-semibold text-slate-100">Recent surveys</h3>
                <p className="text-slate-400 text-sm mt-1">Select a survey to inspect it in 3D.</p>
              </div>
              <Link to="/projects" className="text-sm font-medium text-sky-400 hover:text-sky-300 inline-flex items-center gap-1">
                All projects <ChevronRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>

            {(projects || []).length === 0 ? (
              <div className="card p-10 text-center text-slate-300">
                No surveys yet. <Link to="/projects/new" className="text-sky-400 underline">Create one</Link> to get started.
              </div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(projects || []).map((proj) => {
                  const st = String(proj.status || '').toUpperCase();
                  const pill = st === 'SUCCEEDED' ? 'pill pill-ok' : st === 'FAILED' ? 'pill pill-bad' : 'pill pill-warn';
                  const label = st === 'SUCCEEDED' ? 'Model ready' : st === 'FAILED' ? 'Failed' : st === 'PROCESSING' ? 'Processing' : st === 'QUEUED' ? 'Queued' : 'Unknown';
                  const stats = proj.metadata?.vertices && proj.metadata?.faces
                    ? `${proj.metadata.vertices.toLocaleString()} vertices · ${proj.metadata.faces.toLocaleString()} faces`
                    : 'Mesh statistics not available';
                  return (
                    <li key={proj.id} className="card p-6 flex flex-col gap-5 hover:border-slate-600 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <button type="button" onClick={() => handleOpenProject(proj)} className="card-title text-slate-100 hover:text-sky-300 text-left truncate max-w-full transition-colors">
                            {proj.name}
                          </button>
                          <p className="font-mono text-xs text-slate-400 mt-1 truncate">{proj.id}</p>
                        </div>
                        <span className={pill}>{label}</span>
                      </div>
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-slate-400">Location</dt>
                          <dd className="text-slate-100 mt-0.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden />{proj.metadata?.locationName || 'Not specified'}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Survey date</dt>
                          <dd className="text-slate-100 mt-0.5">{proj.metadata?.surveyDate || (proj.created_at ? proj.created_at.slice(0, 10) : 'Not available')}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-slate-400">Mesh</dt>
                          <dd className="text-slate-100 mt-0.5">{stats}</dd>
                        </div>
                      </dl>
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-700/60 mt-auto pt-5">
                        <button onClick={() => handleOpenProject(proj)} className="btn btn-primary btn-sm">Open in 3D viewer</button>
                        <Link to={`/analysis/${proj.id}`} className="btn btn-secondary btn-sm">AI detections</Link>
                        <span className="ml-auto"><DeleteProjectButton project={proj} compact /></span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

        </main>
      </div>
    </div>
  );
};
