import React from 'react';
import { Menu, Plus, ChevronDown } from 'lucide-react';
import { useProjects } from '../../store/ProjectContext';
import { useNavigate } from 'react-router-dom';

export const Topbar: React.FC<{ title?: string }> = ({ title = 'Dashboard Command Center' }) => {
  const { projects, activeProject, setActiveProject } = useProjects();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-aerospace-950/90 border-b border-slate-700/70 px-3 sm:px-8 flex items-center justify-between gap-2 sticky top-0 z-40 backdrop-blur-md">
      
      {/* Title & Quick Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('aero:toggle-nav'))}
          className="lg:hidden p-2 rounded-lg bg-aerospace-800/80 border border-slate-800 text-slate-300 hover:text-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <h1 className="text-base font-medium text-slate-300 flex items-center gap-2 min-w-0">
          <span className="text-slate-400 hidden sm:inline">AERO3D</span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden>/</span>
          <span className="truncate text-slate-100">{title}</span>
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Project Selector Dropdown */}
        <div className="relative hidden sm:block">
          <select
            aria-label="Active project"
            value={activeProject?.id || 'demo-proj-001'}
            onChange={(e) => {
              const selected = (projects || []).find(p => p.id === e.target.value);
              if (selected) setActiveProject(selected);
            }}
            className="h-10 px-3 rounded-lg bg-aerospace-850 border border-slate-700 text-sm font-medium text-slate-100 hover:border-slate-500 cursor-pointer pr-9 appearance-none transition-colors"
          >
            {(projects || []).map(p => (
              <option key={p.id} value={p.id} className="bg-aerospace-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>

        {/* New Survey Action */}
        <button
          onClick={() => navigate('/projects/new')}
          className="btn btn-primary btn-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Survey</span>
        </button>

      </div>
    </header>
  );
};
