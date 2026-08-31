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

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setActiveProject } = useProjects();
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

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">

          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-sans">Survey Project Directory</h2>
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
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search survey title or location..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-aerospace-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Projects Table */}
          <div className="rounded-xl glass-panel border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-aerospace-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Project Title</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Mesh Vertices</th>
                    <th className="p-4">Provider</th>
                    <th className="p-4">Survey Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-semibold text-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-aerospace-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
                          <Box className="w-5 h-5" />
                        </div>
                        <div>
                          <p
                            className="text-sky-300 font-bold hover:underline cursor-pointer text-sm"
                            onClick={() => {
                              setActiveProject(proj);
                              navigate(`/viewer/${proj.id}`);
                            }}
                          >
                            {proj.name}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">{proj.id}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{proj.metadata?.locationName || 'Delhi NCR, India'}</td>
                      <td className="p-4 font-mono text-slate-300">
                        {proj.metadata?.vertices?.toLocaleString() || '48,520'} Verts
                      </td>
                      <td className="p-4 font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {(proj.provider || 'demo').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">{proj.metadata?.surveyDate || '2026-08-28'}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setActiveProject(proj);
                            navigate(`/viewer/${proj.id}`);
                          }}
                          className="px-3 py-1.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold"
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
