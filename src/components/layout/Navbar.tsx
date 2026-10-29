import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { SystemStatusBadge } from './SystemStatusBadge';
import { useProjects } from '../../store/ProjectContext';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/presentation', label: 'Presentation' },
  { to: '/about', label: 'Architecture' }
];

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveProject, projects } = useProjects();

  const handleLaunchDemo = () => {
    if (projects.length > 0) setActiveProject(projects[0]);
    navigate('/viewer/demo-proj-001');
  };

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-slate-700/60 bg-aerospace-950/85 backdrop-blur-md">
      <div className="h-full max-w-[1280px] mx-auto px-5 lg:px-8 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="AERO3D home">
          <span className="w-9 h-9 rounded-[10px] bg-sky-500 text-aerospace-950 font-display font-bold text-sm grid place-items-center" aria-hidden>3D</span>
          <span className="font-display font-semibold text-xl tracking-tight text-slate-100">AERO3D</span>
          <span className="hidden sm:inline-flex items-center h-6 px-2 rounded-full border border-slate-700 text-xs text-slate-400">INNOTECH 2026</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative h-16 px-3.5 inline-flex items-center text-[15px] font-medium transition-colors duration-150 ${
                  isActive ? 'text-slate-100 after:absolute after:left-3.5 after:right-3.5 after:bottom-0 after:h-0.5 after:bg-sky-500' : 'text-slate-400 hover:text-slate-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden xl:block"><SystemStatusBadge compact /></div>
          <Link to="/projects/new" className="hidden sm:inline-flex btn btn-secondary btn-sm">New survey</Link>
          <button onClick={handleLaunchDemo} className="btn btn-primary btn-sm">
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden />
            Open demo
          </button>
        </div>
      </div>
    </header>
  );
};
