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
        <Topbar title="Projects" />

        <main id="main-content" className="p-6 max-w-7xl mx-auto w-full space-y-6">

          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="page-title">Survey projects</h2>
              <p className="page-lede mt-2">Manage photogrammetry digital twin surveys and asset exports.</p>
            </div>

            <button
              onClick={() => navigate('/projects/new')}
              className="btn btn-primary shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New survey</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden />
            <input
              type="search"
              aria-label="Search projects by title or location"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by title or location"
              className="field pl-10"
            />
          </div>

          {/* Projects Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <caption className="sr-only">Survey projects</caption>
                <thead className="bg-aerospace-950 text-slate-400 text-[13px] font-medium border-b border-slate-700">
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
                <tbody className="divide-y divide-slate-700/60">
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
                              className="text-slate-100 font-display font-semibold hover:text-sky-300 text-base text-left"
                              onClick={() => {
                                setActiveProject(proj);
                                navigate(`/viewer/${proj.id}`);
                              }}
                            >
                              {proj.name}
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="readout text-xs text-slate-400">{proj.id}</span>
                              {activeProject?.id === proj.id && (
                                <span className="pill pill-info !py-0">Active</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {(() => {
                          const st = String(proj.status || '').toUpperCase();
                          const tone = st === 'SUCCEEDED' ? 'pill-ok' : st === 'FAILED' ? 'pill-bad' : 'pill-warn';
                          const label = st === 'SUCCEEDED' ? 'Model ready' : st === 'FAILED' ? 'Failed' : st === 'PROCESSING' ? 'Processing' : st === 'QUEUED' ? 'Queued' : 'Unknown';
                          return <span className={`pill ${tone}`}>{label}</span>;
                        })()}
                      </td>
                      <td className="p-4 text-slate-300">{proj.metadata?.locationName || 'Not specified'}</td>
                      <td className="p-4 text-slate-300 whitespace-nowrap">
                        {proj.metadata?.vertices ? `${proj.metadata.vertices.toLocaleString()} vertices` : 'Not available'}
                      </td>
                      <td className="p-4">
                        <span className="pill pill-info">
                          {(proj.provider || 'demo') === 'demo' ? 'Demo' : String(proj.provider)}
                        </span>
                      </td>
                      <td className="p-4 readout text-sm text-slate-400 whitespace-nowrap">{proj.metadata?.surveyDate || (proj.created_at ? proj.created_at.slice(0, 10) : '—')}</td>
                      <td className="p-4 text-right"><div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => {
                            setActiveProject(proj);
                            navigate(`/viewer/${proj.id}`);
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          View 3D
                        </button>
                        <Link
                          to={`/analysis/${proj.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          AI detections
                        </Link>
                        <Link
                          to={`/reports/${proj.id}`}
                          className="btn btn-secondary btn-sm"
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
