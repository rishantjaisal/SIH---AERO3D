import React from 'react';
import { useProjects } from '../../store/ProjectContext';

export const SystemStatusBadge: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { providerStatus } = useProjects();
  const isPolycam = providerStatus?.mode === 'polycam';
  const dot = isPolycam ? 'bg-emerald-400' : 'bg-amber-400';

  if (compact) {
    return (
      <span className={`pill ${isPolycam ? "pill-ok" : "pill-warn"}`} title={isPolycam ? 'Reconstruction via Polycam API' : 'Demo engine: offline bundled models'}>
        <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden />
        {isPolycam ? 'Polycam API' : 'Demo engine'}
      </span>
    );
  }

  return (
    <div className="rounded-[10px] border border-slate-700 bg-aerospace-900 p-3 text-sm">
      <div className="mb-1.5">
        <span className="text-slate-400 text-xs block">Reconstruction engine</span>
        <span className={`mt-0.5 inline-flex items-center gap-1.5 font-medium text-sm ${isPolycam ? 'text-emerald-400' : 'text-amber-400'}`}>
          <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden />
          {isPolycam ? 'Polycam connected' : 'Demo engine'}
        </span>
      </div>
      <p className="text-slate-400 text-xs leading-relaxed">
        {isPolycam ? 'Live photogrammetry via Polycam API v1.' : 'Offline mode: bundled 3D models, no external service.'}
      </p>
    </div>
  );
};
