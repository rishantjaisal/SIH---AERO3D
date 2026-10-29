import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Box,
  BrainCircuit,
  Ruler,
  Map,
  ShieldCheck,
  FileText,
  Settings,
  Presentation,
  Info,
  ChevronRight,
  Activity,
  X
} from 'lucide-react';
import { useProjects } from '../../store/ProjectContext';
import { SystemStatusBadge } from './SystemStatusBadge';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { activeProject } = useProjects();
  const projId = activeProject?.id || 'demo-proj-001';
  const [open, setOpen] = useState(false); // mobile drawer

  useEffect(() => {
    const toggle = () => setOpen(o => !o);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('aero:toggle-nav', toggle);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('aero:toggle-nav', toggle); window.removeEventListener('keydown', esc); };
  }, []);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const navItems = [
    { label: 'Overview', path: '/dashboard', base: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', base: '/projects', icon: FolderKanban },
    { label: '3D Viewer', path: `/viewer/${projId}`, base: '/viewer', icon: Box },
    { label: 'AI Intelligence', path: `/analysis/${projId}`, base: '/analysis', icon: BrainCircuit },
    { label: 'GIS Mapping', path: `/map/${projId}`, base: '/map', icon: Map },
    { label: 'Digital Twin', path: `/digital-twin/${projId}`, base: '/digital-twin', icon: Activity },
    { label: 'Inspection Reports', path: `/reports/${projId}`, base: '/reports', icon: FileText },
    { label: 'Presentation Mode', path: '/presentation', base: '/presentation', icon: Presentation },
    { label: 'System Settings', path: '/settings', base: '/settings', icon: Settings },
    { label: 'Architecture', path: '/about', base: '/about', icon: Info },
  ];

  return (
    <>
    {open && <div className="fixed inset-0 z-50 bg-slate-950/70 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
    <aside
      aria-label="Primary navigation"
      className={`fixed lg:static inset-y-0 left-0 z-[60] w-72 max-w-[85vw] bg-aerospace-900 border-r border-slate-700/70 flex flex-col h-full shrink-0 select-none transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-700/70 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3" aria-label="AERO3D home">
          <span className="w-9 h-9 rounded-lg bg-sky-500 text-aerospace-950 flex items-center justify-center font-display font-bold text-sm">3D</span>
          <span>
            <span className="block font-display font-semibold text-lg leading-none text-slate-100">AERO<span className="text-sky-400">3D</span></span>
            <span className="block text-xs text-slate-400 mt-1">Geospatial intelligence</span>
          </span>
        </NavLink>
        <button type="button" onClick={() => setOpen(false)} className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white" aria-label="Close navigation menu"><X className="w-4 h-4" /></button>
      </div>

      {/* Active Project Banner */}
      <div className="mx-4 mt-5 mb-2 p-3 rounded-xl bg-aerospace-850 border border-slate-700/70">
        <div className="text-xs text-slate-400 mb-1">Active project</div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-100 truncate" title={activeProject?.name || 'KIET Campus Survey'}>
            {activeProject?.name || 'KIET Campus Survey'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-label="Project available" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5" aria-label="Sections">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isItemActive = location.pathname === item.base || location.pathname.startsWith(item.base + '/');
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={() =>
                `relative flex items-center justify-between pl-4 pr-3 h-11 rounded-lg text-sm font-medium transition-colors ${
                  isItemActive
                    ? 'bg-aerospace-800 text-slate-100 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-sky-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-aerospace-850'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isItemActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Health & User Section */}
      <div className="p-3 border-t border-slate-700/70 space-y-3">
        <SystemStatusBadge />

        <div className="flex items-center gap-3 p-2.5 rounded-[10px] bg-aerospace-900 border border-slate-700 text-sm">
          <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold font-display">
            IT
          </div>
          <div className="truncate flex-1">
            <p className="font-medium text-slate-100 text-sm truncate">INNOTECH 2026 evaluator</p>
            <p className="text-xs text-slate-400 truncate">AERO3D drone twin</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
