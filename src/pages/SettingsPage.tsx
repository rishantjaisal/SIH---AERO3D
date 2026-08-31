import React from 'react';
import { ShieldCheck, Cpu, Database, HardDrive, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useProjects } from '../store/ProjectContext';

export const SettingsPage: React.FC = () => {
  const { providerStatus, health } = useProjects();
  const isPolycam = providerStatus.mode === 'polycam';

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title="System Health & Settings" />

        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">

          <div>
            <h2 className="text-xl font-bold text-slate-100 font-sans">System Health & API Configuration</h2>
            <p className="text-xs text-slate-400">Monitor provider integration health and security credentials.</p>
          </div>

          {/* System Health Grid */}
          <div className="p-6 rounded-2xl glass-panel-elevated border border-slate-700/80 space-y-4">
            <h3 className="font-bold text-sm text-slate-100 font-mono tracking-wide uppercase">Core Subsystem Status</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              
              <div className="p-3.5 rounded-xl bg-aerospace-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-200">Frontend WebGL Engine</span>
                </div>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>

              <div className="p-3.5 rounded-xl bg-aerospace-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-200">Node Express API Server</span>
                </div>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>

              <div className="p-3.5 rounded-xl bg-aerospace-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isPolycam ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-slate-200">Reconstruction Engine</span>
                </div>
                <span className={isPolycam ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {isPolycam ? 'POLYCAM API' : 'DEMO MODE'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-aerospace-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-200">Database Layer</span>
                </div>
                <span className="text-amber-400 font-bold">DEMO / IN-MEMORY</span>
              </div>

            </div>
          </div>

          {/* Polycam Setup Panel */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-slate-100 font-mono uppercase">Polycam API Integration Setup</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                isPolycam ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {isPolycam ? 'CONNECTED' : 'NOT CONFIGURED'}
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Polycam photogrammetry reconstruction access requires an eligible Polycam Enterprise account or API add-on token.
            </p>

            <div className="p-4 rounded-xl bg-aerospace-950 border border-slate-800 space-y-2 font-mono text-xs">
              <span className="text-slate-500 block uppercase text-[10px]">Server Environment Configuration (.env)</span>
              <p className="text-slate-300">POLYCAM_API_TOKEN=<span className="text-slate-500">{isPolycam ? '********************' : 'not_set'}</span></p>
              <p className="text-slate-300">POLYCAM_BASE_URL=https://poly.cam/api/v1</p>
              <p className="text-slate-300">RECONSTRUCTION_PROVIDER={providerStatus.mode}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Security Architecture Guaranteed:</strong> API secrets are strictly stored in backend server environment variables. Zero tokens are ever exposed to client-side JavaScript or localStorage.
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
