import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '../DemoProjectCard';
import { LidarDataset } from '../../lidar/datasets';

export const LidarDatasetCard: React.FC<{ dataset: LidarDataset; onOpen: () => void }> = ({ dataset: d, onOpen }) => (
          <article className="group rounded-xl glass-panel border border-slate-800 overflow-hidden flex flex-col transition-colors hover:border-sky-500/50">
    <div className="relative aspect-[16/9] bg-aerospace-900 overflow-hidden">
      <SafeImage src={d.previewUrl} alt={`${d.name} preview`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" label="Preview not available" />
      <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-aerospace-950/85 border border-slate-700 text-[11px] font-semibold text-sky-300">Demo Project</span>
    </div>
    <div className="p-5 flex flex-col gap-3 flex-1">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-400">{d.category}</p>
        <h3 className="text-base font-bold mt-0.5">{d.name}</h3>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{d.summary}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <dt className="text-slate-400">Input</dt><dd className="text-right">{d.inputFormat}</dd>
        <dt className="text-slate-400">Output</dt><dd className="text-right">{d.outputFormat}</dd>
      </dl>
      <div className="flex flex-wrap gap-1.5">
        {d.labels.filter(l => l !== 'Demo Project').map(l => <span key={l} className="px-2 py-0.5 rounded-full border border-slate-700 text-[11px] text-slate-300">{l}</span>)}
      </div>
      <button type="button" onClick={onOpen} className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-xs">
        Open Project <ArrowRight className="w-4 h-4" aria-hidden />
      </button>
    </div>
  </article>
);
