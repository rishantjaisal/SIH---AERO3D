import React from 'react';
import { ShieldCheck, Cpu, AlertTriangle } from 'lucide-react';
import { useProjects } from '../../store/ProjectContext';

export const SystemStatusBadge: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { providerStatus } = useProjects();
  const isPolycam = providerStatus?.mode === 'polycam';

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-aerospace-800/90 border border-slate-700/80 text-slate-300">
        <span className={`w-2 h-2 rounded-full animate-pulse ${isPolycam ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span>{isPolycam ? 'POLYCAM API' : 'DEMO MODE'}</span>
      </div>
    );
  }

  return (
    <div className="glass-panel p-3 rounded-lg border border-slate-800 text-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">Reconstruction Engine</span>
        <span className={`flex items-center gap-1 font-mono font-semibold ${isPolycam ? 'text-emerald-400' : 'text-amber-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isPolycam ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          {isPolycam ? 'POLYCAM CONNECTED' : 'DEMO MODE'}
        </span>
      </div>
      <p className="text-slate-400 text-[11px] leading-relaxed">
        {isPolycam
          ? 'Live photogrammetry via Polycam API v1.'
          : 'Operating in Demo Mode. Offline 3D Digital Twin GLB rendering.'}
      </p>
    </div>
  );
};
