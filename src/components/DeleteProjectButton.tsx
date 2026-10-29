import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Project } from '../types';
import { useProjects } from '../store/ProjectContext';

/** Delete button with a confirmation dialog. Deletes only the given project. */
export const DeleteProjectButton: React.FC<{ project: Project; compact?: boolean }> = ({ project, compact }) => {
  const { deleteProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (busy) return;
    setOpen(false);
    setError(null);
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await deleteProject(project.id);
      if (!res.ok) {
        setError(res.message || 'Could not delete this project.');
        setBusy(false);
        return;
      }
      setBusy(false);
      setOpen(false);
      if (res.message) window.alert(res.message);
    } catch (err: any) {
      setError(err?.message || 'Could not delete this project.');
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={`Delete ${project.name}`}
        aria-label={`Delete ${project.name}`}
        className={`inline-flex items-center gap-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium transition-colors ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5'
        }`}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left whitespace-normal" role="dialog" aria-modal="true" onClick={close}>
          <div className="w-full max-w-md rounded-2xl glass-panel-elevated border border-slate-700/80 p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-mono font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Delete project?</span>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-white" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-100">{project.name}</span>{' '}
              <span className="font-mono text-slate-500">({project.id})</span> and its markers and measurements will be
              permanently removed. Other projects are not affected. This cannot be undone.
            </p>
            {error && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded p-2">{error}</p>}
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={close} disabled={busy} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
                Cancel
              </button>
              <button onClick={confirm} disabled={busy} className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold disabled:opacity-60">
                {busy ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
