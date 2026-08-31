import React from 'react';
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
  Activity
} from 'lucide-react';
import { useProjects } from '../../store/ProjectContext';
import { SystemStatusBadge } from './SystemStatusBadge';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { activeProject } = useProjects();
  const projId = activeProject?.id || 'demo-proj-001';

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
    <aside className="w-64 bg-aerospace-900 border-r border-slate-800/80 flex flex-col h-full shrink-0 select-none">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold font-mono">
            3D
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 font-mono tracking-wider">AERO<span className="text-sky-400">3D</span></h1>
            <p className="text-[10px] text-slate-400 font-sans">Command Twin System</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">v1.0</span>
      </div>

      {/* Active Project Banner */}
      <div className="p-3 bg-aerospace-950/60 border-b border-slate-800/60">
        <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider mb-1">Active Project</div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-sky-300 truncate max-w-[170px]" title={activeProject?.name || 'KIET Campus Survey'}>
            {activeProject?.name || 'KIET Campus Survey'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isItemActive = location.pathname === item.base || location.pathname.startsWith(item.base + '/');
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={() =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isItemActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isItemActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isItemActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Health & User Section */}
      <div className="p-3 border-t border-slate-800/80 space-y-3 bg-aerospace-950/40">
        <SystemStatusBadge />

        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-aerospace-850 border border-slate-800 text-xs">
          <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold font-mono">
            SIH
          </div>
          <div className="truncate flex-1">
            <p className="font-semibold text-slate-200 text-[11px] truncate">SIH 2026 Evaluator</p>
            <p className="text-[10px] text-slate-400 truncate">Aero3D Drone Twin</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
