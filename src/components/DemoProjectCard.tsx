import React, { useState } from 'react';
import { ArrowRight, ImageOff } from 'lucide-react';
import { Project } from '../types';
import { DemoProjectInfo } from '../data/demoProjects';

/** Image that degrades to a quiet placeholder instead of a broken-image icon. */
export const SafeImage: React.FC<{ src: string; alt: string; className?: string; label?: string }> = ({ src, alt, className = '', label }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-aerospace-900 text-slate-400 text-xs text-center p-4 ${className}`} role="img" aria-label={`${alt} (image not available)`}>
        <ImageOff className="w-5 h-5" aria-hidden />
        <span>{label || 'Image not available'}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className} />;
};

interface Props {
  project: Project;
  info: DemoProjectInfo;
  onOpen: () => void;
}

export const DemoProjectCard: React.FC<Props> = ({ project, info, onOpen }) => {
  const hasRealImage = !project.thumbnail_url.startsWith('data:');
  return (
    <article className="group rounded-xl glass-panel border border-slate-800 overflow-hidden flex flex-col transition-colors hover:border-sky-500/50">
      <div className="relative aspect-[16/9] bg-aerospace-900 overflow-hidden">
        {hasRealImage ? (
          <SafeImage src={project.thumbnail_url} alt={`${project.name} reference image`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center p-6 bg-gradient-to-br from-aerospace-900 to-aerospace-950">
            Reference image is added once the dataset files are available
          </div>
        )}
        <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-aerospace-950/85 border border-slate-700 text-[11px] font-semibold text-sky-300 tracking-wide">
          Demo Project
        </span>
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">{info.category}</p>
          <h3 className="text-base font-bold text-slate-100 mt-0.5">{project.name}</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{info.summary}</p>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <dt className="text-slate-400">Input images</dt>
          <dd className="text-slate-200 text-right">{info.inputImageCount !== null ? info.inputImageCount.toLocaleString() : 'Not yet verified'}</dd>
          <dt className="text-slate-400">Output format</dt>
          <dd className="text-slate-200 text-right">{info.outputFormat}</dd>
        </dl>

        <div className="flex flex-wrap gap-1.5">
          {info.labels.filter(l => l !== 'Demo Project').map(l => (
            <span key={l} className="px-2 py-0.5 rounded-full border border-slate-700 text-[11px] text-slate-300">{l}</span>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-xs transition-colors"
        >
          Open Project <ArrowRight className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </article>
  );
};
