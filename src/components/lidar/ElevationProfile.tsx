import React from 'react';
import { ProfileSample } from '../../lidar/profile';

/** Small SVG cross-section. Gaps (no data) break the line instead of being drawn through. */
export const ElevationProfile: React.FC<{ samples: ProfileSample[] }> = ({ samples }) => {
  const valid = samples.filter(s => s.z !== null) as { d: number; z: number }[];
  if (valid.length < 2) return <p className="text-xs text-slate-400">No surface data along this line.</p>;
  const W = 300, H = 110, P = 22;
  const dMax = samples[samples.length - 1].d || 1;
  let zMin = Math.min(...valid.map(s => s.z)), zMax = Math.max(...valid.map(s => s.z));
  if (zMax - zMin < 0.5) { zMax += 0.25; zMin -= 0.25; }
  const x = (d: number) => P + (d / dMax) * (W - P - 6);
  const y = (z: number) => H - P - ((z - zMin) / (zMax - zMin)) * (H - P - 8);
  let path = '', pen = false;
  for (const s of samples) {
    if (s.z === null) { pen = false; continue; }
    path += `${pen ? 'L' : 'M'}${x(s.d).toFixed(1)},${y(s.z).toFixed(1)} `;
    pen = true;
  }
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Elevation profile from ${zMin.toFixed(1)} to ${zMax.toFixed(1)} metres over ${dMax.toFixed(1)} metres`}>
        <line x1={P} y1={H - P} x2={W - 6} y2={H - P} stroke="#334155" />
        <line x1={P} y1={8} x2={P} y2={H - P} stroke="#334155" />
        <path d={path} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
        <text x={P - 3} y={14} fontSize="8" fill="#94a3b8" textAnchor="end">{zMax.toFixed(1)}</text>
        <text x={P - 3} y={H - P} fontSize="8" fill="#94a3b8" textAnchor="end">{zMin.toFixed(1)}</text>
        <text x={P} y={H - 8} fontSize="8" fill="#94a3b8">0 m</text>
        <text x={W - 6} y={H - 8} fontSize="8" fill="#94a3b8" textAnchor="end">{dMax.toFixed(1)} m</text>
      </svg>
      <figcaption className="text-[11px] text-slate-400">Elevation (m) along the line, from the highest-return surface model.</figcaption>
    </figure>
  );
};
