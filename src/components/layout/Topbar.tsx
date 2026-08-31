import React from 'react';
import { Search, Bell, Plus, ChevronDown, Compass, Shield } from 'lucide-react';
import { useProjects } from '../../store/ProjectContext';
import { useNavigate } from 'react-router-dom';

export const Topbar: React.FC<{ title?: string }> = ({ title = 'Dashboard Command Center' }) => {
  const { projects, activeProject, setActiveProject } = useProjects();
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-aerospace-900/90 border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      
      {/* Title & Quick Breadcrumb */}
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          {title}
        </h1>
      </div>

      {/* Center Search */}
      <div className="hidden md:flex items-center max-w-sm w-full relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
        <input
          type="text"
          placeholder="Search drone surveys, objects, coordinates..."
          className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-aerospace-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors font-sans"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* Project Selector Dropdown */}
        <div className="relative">
          <select
            value={activeProject?.id || 'demo-proj-001'}
            onChange={(e) => {
              const selected = (projects || []).find(p => p.id === e.target.value);
              if (selected) setActiveProject(selected);
            }}
            className="px-3 py-1.5 rounded-lg bg-aerospace-800 border border-slate-700 text-xs font-medium text-sky-300 focus:outline-none focus:border-sky-500 cursor-pointer pr-8 appearance-none"
          >
            {(projects || []).map(p => (
              <option key={p.id} value={p.id} className="bg-aerospace-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Notifications Icon */}
        <button className="p-2 rounded-lg bg-aerospace-800/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-sky-400 absolute top-1.5 right-1.5" />
        </button>

        {/* New Survey Action */}
        <button
          onClick={() => navigate('/projects/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-semibold text-xs transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Survey</span>
        </button>

      </div>
    </header>
  );
};
