import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban,
  Box,
  BrainCircuit,
  Map,
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useProjects } from '../store/ProjectContext';
import { DeleteProjectButton } from '../components/DeleteProjectButton';
import { DemoProjectCard } from '../components/DemoProjectCard';
import { getDemoInfo } from '../data/demoProjects';
import { LidarDatasetCard } from '../components/lidar/LidarDatasetCard';
import { LIDAR_DATASETS } from '../lidar/datasets';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setActiveProject, activeProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = (projects || []).filter(p => {
    if (!p) return false;
    const nameMatch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const locMatch = (p.metadata?.locationName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || locMatch;
  });

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title="Drone Survey Project Directory" />

        <main id="main-content" className="p-6 max-w-7xl mx-auto w-full space-y-6">

          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Survey projects</h2>
              <p className="text-xs text-slate-400">Manage photogrammetry digital twin surveys and asset exports.</p>
            </div>

            <button
              onClick={() => navigate('/projects/new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-xs shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Survey</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden />
            <input
              type="search"
              aria-label="Search projects by title or location"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search survey title or location..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-aerospace-900 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-400 focus:border-sky-500"
            />
          </div>

          {/* Showcase projects built from published external datasets */}
          {(() => {
            const showcase = (projects || []).filter(p => p && getDemoInfo(p.id));
            if (showcase.length === 0) return null;
            return (
              <section aria-labelledby="showcase-heading" className="space-y-3">
                <div>
                  <h3 id="showcase-heading" className="text-sm font-bold text-slate-100">Showcase projects</h3>
                  <p className="text-xs text-slate-400">Published external datasets with preprocessed outputs, opened in the AERO3D viewer.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {showcase.map(p => (
                    <DemoProjectCard key={p.id} project={p} info={getDemoInfo(p.id)!} onOpen={() => { setActiveProject(p); navigate(`/projects/${p.id}`); }} />
                  ))}
                </div>
              </section>
            );
          })()}

          {/* LiDAR point-cloud demos (synthetic benchmarks) */}
          <section aria-labelledby="lidar-heading" className="space-y-3">
            <div>
              <h3 id="lidar-heading" className="text-sm font-bold text-slate-100">LiDAR demo projects</h3>
              <p className="text-xs text-slate-400">Point-cloud viewer with distance, slope, profile, area, volume and change-detection tools. Synthetic benchmark datasets with known answers. <Link to="/lidar" className="text-sky-300 hover:underline">All LiDAR demos</Link></p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {LIDAR_DATASETS.map(d => <LidarDatasetCard key={d.id} dataset={d} onOpen={() => navigate(`/lidar/${d.id}`)} />)}
            </div>
          </section>

          {/* Projects Table */}
          <div className="rounded-xl glass-panel border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <caption className="sr-only">Survey projects</caption>
                <thead className="bg-aerospace-950/80 text-slate-400 text-xs font-medium border-b border-slate-800">
                  <tr>
                    <th scope="col" className="p-4">Project</th>
                    <th scope="col" className="p-4">Status</th>
                    <th scope="col" className="p-4">Location</th>
                    <th scope="col" className="p-4">Mesh vertices</th>
                    <th scope="col" className="p-4">Provider</th>
                    <th scope="col" className="p-4">Survey date</th>
                    <th scope="col" className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-semibold text-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-aerospace-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0" aria-hidden>
                            <Box className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="text-sky-300 font-bold hover:underline text-sm text-left"
                              onClick={() => {
                                setActiveProject(proj);
                                navigate(`/viewer/${proj.id}`);
                              }}
                            >
                              {proj.name}
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">{proj.id}</span>
                              {activeProject?.id === proj.id && (
                                <span className="text-xs px-1.5 rounded border border-sky-500/40 text-sky-300">Active</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {(() => {
                          const st = String(proj.status || '').toUpperCase();
                          const tone = st === 'SUCCEEDED' ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                            : st === 'FAILED' ? 'text-rose-300 border-rose-500/40 bg-rose-500/10'
                            : 'text-amber-300 border-amber-500/40 bg-amber-500/10';
                          const pending = getDemoInfo(proj.id)?.outputShipped === false;
                          const label = pending ? 'Output pending' : st === 'SUCCEEDED' ? 'Model ready' : st === 'FAILED' ? 'Failed' : st === 'PROCESSING' ? 'Processing' : st === 'QUEUED' ? 'Queued' : 'Unknown';
                          return <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tone}`}>{label}</span>;
                        })()}
                      </td>
                      <td className="p-4 text-slate-300">{proj.metadata?.locationName || 'Not specified'}</td>
                      <td className="p-4 text-slate-300 whitespace-nowrap">
                        {proj.metadata?.vertices ? `${proj.metadata.vertices.toLocaleString()} Verts` : 'Not available'}
                      </td>
                      <td className="p-4 font-mono">
                        <span className="px-2 py-0.5 rounded text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {(proj.provider || 'demo').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400 whitespace-nowrap">{proj.metadata?.surveyDate || (proj.created_at ? proj.created_at.slice(0, 10) : '—')}</td>
                      <td className="p-4 text-right"><div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => {
                            setActiveProject(proj);
                            navigate(`/viewer/${proj.id}`);
                          }}
                          className="inline-flex px-3 py-1.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold"
                        >
                          View 3D
                        </button>
                        <Link
                          to={`/analysis/${proj.id}`}
                          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium"
                        >
                          AI Detections
                        </Link>
                        <Link
                          to={`/reports/${proj.id}`}
                          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium"
                        >
                          Report
                        </Link>
                        <DeleteProjectButton project={proj} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-300">
                        {(projects || []).length === 0
                          ? 'No projects yet. Create a survey to upload drone footage or a .glb model.'
                          : `No projects match "${searchTerm}".`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
