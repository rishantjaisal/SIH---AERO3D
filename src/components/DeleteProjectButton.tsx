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
        className={`btn btn-ghost text-rose-300 hover:text-rose-200 ${compact ? 'btn-sm' : ''}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden />
        <span>Delete</span>
      </button>

      {open && (
        <div className="dialog-backdrop !z-[100] text-left whitespace-normal" role="dialog" aria-modal="true" aria-labelledby="delete-title" onClick={close}>
          <div className="dialog space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-display font-semibold text-xl">
                <AlertTriangle className="w-5 h-5" aria-hidden />
                <span id="delete-title">Delete project?</span>
              </div>
              <button onClick={close} className="icon-btn border-transparent bg-transparent" aria-label="Close" title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-100">{project.name}</span>{' '}
              <span className="readout text-slate-400">({project.id})</span> and its markers and measurements will be
              permanently removed. Other projects are not affected. This cannot be undone.
            </p>
            {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3" role="alert">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={close} disabled={busy} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirm} disabled={busy} className="btn btn-danger">
                {busy ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
