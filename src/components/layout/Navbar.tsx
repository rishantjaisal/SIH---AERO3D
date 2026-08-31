import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Box, Compass, Play, PlusCircle, ShieldAlert, Cpu } from 'lucide-react';
import { SystemStatusBadge } from './SystemStatusBadge';
import { useProjects } from '../../store/ProjectContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveProject, projects } = useProjects();

  const handleLaunchDemo = () => {
    if (projects.length > 0) {
      setActiveProject(projects[0]);
    }
    navigate('/viewer/demo-proj-001');
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-all">
            <div className="w-full h-full bg-aerospace-950 rounded-[7px] flex items-center justify-center">
              <Box className="w-5 h-5 text-sky-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-slate-100 font-mono">AERO<span className="text-sky-400">3D</span></span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">SIH 2026</span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide font-sans hidden sm:block">Intelligent Drone Digital Twin</p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            to="/dashboard"
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              location.pathname === '/dashboard' ? 'text-sky-400 bg-sky-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/projects"
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              location.pathname === '/projects' ? 'text-sky-400 bg-sky-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Projects
          </Link>
          <Link
            to="/presentation"
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              location.pathname === '/presentation' ? 'text-sky-400 bg-sky-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Presentation Mode
          </Link>
          <Link
            to="/about"
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              location.pathname === '/about' ? 'text-sky-400 bg-sky-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Architecture
          </Link>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          <SystemStatusBadge compact />

          <button
            onClick={handleLaunchDemo}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-semibold text-xs transition-all shadow-md shadow-sky-500/20 hover:shadow-sky-500/40 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Interactive Demo</span>
          </button>

          <Link
            to="/projects/new"
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-aerospace-800 hover:bg-aerospace-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>New Survey</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
