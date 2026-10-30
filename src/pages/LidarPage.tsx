import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, FileQuestion, MousePointer2, Ruler, Hexagon, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { LidarDatasetCard } from '../components/lidar/LidarDatasetCard';
import { ElevationProfile } from '../components/lidar/ElevationProfile';
import { elevationProfile } from '../lidar/profile';
import { LidarScene, ColorMode, LidarTool, CLASS_NAMES, classColor } from '../components/lidar/LidarScene';
import { LIDAR_DATASETS, LidarDataset, getLidarDataset } from '../lidar/datasets';
import { LasCloud, parseLas } from '../lidar/las';
import { buildDsm, computeChange, pointChange, ChangeResult } from '../lidar/dem';
import { DemGrid } from '../lidar/DemGrid';
import { Point3D, computeAabb, computeDistance, computeLineSlope, computePolygonArea, computeVolume } from '../lidar/measure';

const CELL = 0.5;
const fmt = (v: number, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : '—');

/* ---------- index: dataset cards ---------- */
const LidarIndex: React.FC = () => {
  const navigate = useNavigate();
  return (
    <main id="main-content" className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold">LiDAR demo</h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl">
          Interactive point-cloud viewer with elevation, colour and classification views, distance, area and volume tools, and change detection between two surveys.
          The two datasets here are <strong>synthetic benchmarks</strong> with exactly known geometry, so each measurement can be checked against the right answer. They are not real surveys.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {LIDAR_DATASETS.map(d => <LidarDatasetCard key={d.id} dataset={d} onOpen={() => navigate(`/lidar/${d.id}`)} />)}
      </div>

      <section className="rounded-xl glass-panel border border-slate-800 p-5 text-sm text-slate-300 space-y-2">
        <h2 className="font-bold text-slate-100">LiDAR and photogrammetry</h2>
        <p><strong>Photogrammetry</strong> rebuilds 3D from overlapping photographs and gives textured colour models (see the building project). <strong>LiDAR</strong> measures distances with laser pulses and gives a point cloud with true elevations, which can see through gaps in vegetation. This viewer shows the point cloud as measured. No mesh or texture is added.</p>
      </section>
    </main>
  );
};

/* ---------- data loading ---------- */
interface Loaded { clouds: Record<string, LasCloud>; truth: any }

function useDataset(ds: LidarDataset) {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; data?: Loaded; error?: string }>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const clouds: Record<string, LasCloud> = {};
        for (const f of ds.files) {
          const r = await fetch(f.url);
          const ct = r.headers.get('content-type') || '';
          if (!r.ok || ct.includes('text/html')) throw new Error(`Could not load ${f.label} (HTTP ${r.status}).`);
          clouds[f.role] = parseLas(await r.arrayBuffer());
        }
        let truth: any = null;
        try { const t = await fetch(ds.groundTruthUrl); if (t.ok) truth = await t.json(); } catch { /* ground truth is optional */ }
        if (!cancelled) setState({ status: 'ready', data: { clouds, truth } });
      } catch (e: any) {
        if (!cancelled) setState({ status: 'error', error: e?.message || 'Failed to load point cloud.' });
      }
    })();
    return () => { cancelled = true; };
  }, [ds, attempt]);
  return { ...state, retry: () => setAttempt(a => a + 1) };
}

/* ---------- viewer ---------- */
const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex justify-between gap-3 py-1 border-b border-slate-800/60 text-xs"><span className="text-slate-400">{k}</span><span className="text-slate-100 text-right font-mono">{v}</span></div>
);

const LidarViewer: React.FC<{ ds: LidarDataset }> = ({ ds }) => {
  const { status, data, error, retry } = useDataset(ds);
  const [epoch, setEpoch] = useState<'pre' | 'post'>('post');
  const cloud: LasCloud | undefined = data ? (ds.kind === 'change' ? data.clouds[epoch] : data.clouds.single) : undefined;

  const [colorMode, setColorMode] = useState<ColorMode>('elevation');
  const [pointSize, setPointSize] = useState(0.35);
  const [tool, setTool] = useState<LidarTool>('orbit');
  const [picks, setPicks] = useState<Point3D[]>([]);
  const [closed, setClosed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showBox, setShowBox] = useState(false);
  const [baseZ, setBaseZ] = useState<string>('');
  const [lastIdx, setLastIdx] = useState<number | null>(null);

  // Derived data, computed once per loaded dataset
  const dsms = useMemo(() => {
    if (!data) return null;
    const out: Record<string, DemGrid> = {};
    for (const k of Object.keys(data.clouds)) out[k] = buildDsm(data.clouds[k], CELL);
    return out;
  }, [data]);
  const change = useMemo<Float32Array | null>(() => {
    if (!data || !dsms || ds.kind !== 'change' || !data.clouds.post) return null;
    return pointChange(data.clouds.post, dsms.pre, dsms.post);
  }, [data, dsms, ds.kind]);

  useEffect(() => { if (cloud && baseZ === '') setBaseZ(String(cloud.min[2])); }, [cloud, baseZ]);
  useEffect(() => { setPicks([]); setClosed(false); setLastIdx(null); }, [tool, epoch]);
  useEffect(() => { if (colorMode === 'change' && !(ds.kind === 'change' && epoch === 'post')) setColorMode('elevation'); }, [epoch, colorMode, ds.kind]);

  const onPick = useCallback((p: Point3D, idx: number) => {
    setLastIdx(idx);
    setPicks(prev => {
      if (tool === 'distance') return prev.length >= 2 ? [p] : [...prev, p];
      if (tool === 'polygon') return closed ? [p] : [...prev, p];
      return prev;
    });
    if (tool === 'polygon' && closed) setClosed(false);
  }, [tool, closed]);

  const dem = dsms && dsms[ds.kind === 'change' ? epoch : 'single'];
  const distance = tool === 'distance' && picks.length === 2 ? computeDistance(picks[0], picks[1]) : null;
  const polyResult = useMemo(() => {
    if (tool !== 'polygon' || !closed || picks.length < 3 || !dem) return null;
    const area = computePolygonArea(picks, dem);
    const bz = parseFloat(baseZ);
    const volume = Number.isFinite(bz) ? computeVolume(picks, dem, { referenceType: 'PLANE_ELEVATION', baseElevation: bz }) : null;
    return { area, volume };
  }, [tool, closed, picks, dem, baseZ]);

  const slope = distance ? computeLineSlope(picks[0], picks[1]) : null;
  const profile = useMemo(() => (tool === 'distance' && picks.length === 2 && dem ? elevationProfile(picks[0], picks[1], dem) : null), [tool, picks, dem]);

  const aabb = cloud ? computeAabb([cloud.min as Point3D, cloud.max as Point3D]) : null;

  /* ground-truth checks: measured here, expected from the dataset's own ground-truth file */
  const checks = useMemo(() => {
    if (!data?.truth || !dsms) return null;
    const t = data.truth;
    if (ds.kind === 'terrain') {
      const c = data.clouds.single;
      const f = t.features;
      const bx = f.box_structure;
      // building-class points -> bounding box
      const bp: Point3D[] = [];
      for (let i = 0; i < c.count; i++) if (c.classification[i] === 6) bp.push([c.xyz[i * 3], c.xyz[i * 3 + 1], c.xyz[i * 3 + 2]]);
      const rows: { label: string; measured: number; expected: number; unit: string }[] = [];
      if (bp.length) {
        const a = computeAabb(bp);
        rows.push({ label: 'Structure width (X)', measured: a.dx, expected: bx.width_x_m, unit: 'm' });
        rows.push({ label: 'Structure length (Y)', measured: a.dy, expected: bx.length_y_m, unit: 'm' });
        rows.push({ label: 'Structure height (Z)', measured: a.dz, expected: bx.height_z_m, unit: 'm' });
      }
      const poly: Point3D[] = [[bx.bounds_x[0] - 0.01, bx.bounds_y[0] - 0.01, 0], [bx.bounds_x[1] + 0.01, bx.bounds_y[0] - 0.01, 0], [bx.bounds_x[1] + 0.01, bx.bounds_y[1] + 0.01, 0], [bx.bounds_x[0] - 0.01, bx.bounds_y[1] + 0.01, 0]];
      const v = computeVolume(poly, dsms.single, { referenceType: 'PLANE_ELEVATION', baseElevation: f.flat_plane.elevation_m });
      rows.push({ label: 'Structure volume above ground', measured: v.cutVolume, expected: bx.expected_volume_m3, unit: 'm³' });
      rows.push({ label: 'Highest point (hill peak)', measured: c.max[2], expected: f.gaussian_hill.peak_elevation_m, unit: 'm' });
      rows.push({ label: 'Ground elevation (lowest)', measured: c.min[2], expected: f.flat_plane.elevation_m, unit: 'm' });
      return { kind: 'terrain' as const, rows, note: 'The volume reads about 10% high: the surface model has 0.5 m cells centred on the wall points, so the structure covers 21 × 21 cells instead of 20 × 20. This is a resolution limit of the method, not a data error.' };
    }
    const r: ChangeResult = computeChange(dsms.pre, dsms.post, 0);
    return { kind: 'change' as const, result: r, truth: t };
  }, [data, dsms, ds.kind]);

  /* ---------- render ---------- */
  if (status === 'loading') return <div className="p-10 text-center text-sm text-slate-300">Loading point cloud…</div>;
  if (status === 'error' || !cloud) {
    return (
      <div className="p-10 text-center space-y-3 text-sm text-slate-300">
        <FileQuestion className="w-8 h-8 mx-auto text-slate-400" aria-hidden />
        <p className="font-semibold">Point cloud could not be loaded</p>
        <p className="text-xs text-slate-400">{error}</p>
        <button type="button" onClick={retry} className="px-3 py-1.5 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 text-xs">Try again</button>
      </div>
    );
  }

  const classes = Array.from(new Set(Array.from(cloud.classification))).sort((a, b) => a - b);
  const modes: { id: ColorMode; label: string; ok: boolean }[] = [
    { id: 'elevation', label: 'Elevation', ok: true },
    { id: 'rgb', label: 'RGB colour', ok: !!cloud.rgb },
    { id: 'classification', label: 'Classification', ok: true },
    { id: 'change', label: 'Elevation change', ok: ds.kind === 'change' && epoch === 'post' },
  ];
  const tools: { id: LidarTool; label: string; icon: React.ReactNode }[] = [
    { id: 'orbit', label: 'Orbit', icon: <MousePointer2 className="w-3.5 h-3.5" /> },
    { id: 'distance', label: 'Distance', icon: <Ruler className="w-3.5 h-3.5" /> },
    { id: 'polygon', label: 'Area & volume', icon: <Hexagon className="w-3.5 h-3.5" /> },
  ];
  const last = lastIdx !== null ? lastIdx : null;

  return (
    <main id="main-content" className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      <Link to="/lidar" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-300"><ArrowLeft className="w-3.5 h-3.5" aria-hidden /> LiDAR demos</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{ds.name}</h1>
          <p className="text-xs uppercase tracking-wider text-slate-400 mt-0.5">{ds.category}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">{ds.labels.map(l => <span key={l} className="px-2 py-0.5 rounded-full border border-slate-700 text-[11px] text-slate-300">{l}</span>)}</div>
      </div>
      <p className="text-sm text-slate-300 max-w-4xl">{ds.description}</p>

      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {tools.map(t => (
              <button key={t.id} type="button" onClick={() => setTool(t.id)} aria-pressed={tool === t.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${tool === t.id ? 'bg-sky-500/20 border-sky-500/60 text-sky-200' : 'bg-aerospace-900 border-slate-700 text-slate-300 hover:border-slate-500'}`}>{t.icon}{t.label}</button>
            ))}
            {ds.kind === 'change' && (
              <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden ml-auto" role="group" aria-label="Survey epoch">
                {(['pre', 'post'] as const).map(e => (
                  <button key={e} type="button" onClick={() => setEpoch(e)} aria-pressed={epoch === e} className={`px-3 py-1.5 ${epoch === e ? 'bg-sky-500/20 text-sky-200' : 'bg-aerospace-900 text-slate-300'}`}>{e === 'pre' ? 'Before event' : 'After event'}</button>
                ))}
              </div>
            )}
          </div>

          <div className="relative rounded-xl border border-slate-800 overflow-hidden h-[420px] sm:h-[560px] bg-aerospace-950">
            <LidarScene cloud={cloud} colorMode={colorMode} pointSize={pointSize} tool={tool} picks={picks} closePolygon={closed} showGrid={showGrid} showBox={showBox} change={change} changeRange={4} onPick={onPick} />
            <div className="absolute left-3 bottom-3 px-2.5 py-1.5 rounded bg-aerospace-950/85 border border-slate-800 text-[11px] text-slate-300 pointer-events-none">
              {tool === 'orbit' && 'Drag to rotate · scroll to zoom · right-drag to pan'}
              {tool === 'distance' && `Click two points (${picks.length}/2)`}
              {tool === 'polygon' && (closed ? 'Polygon closed. Click a point to start a new one' : `Click points to outline an area (${picks.length}), then close it`)}
            </div>
            {colorMode === 'change' && (
              <div className="absolute right-3 bottom-3 px-2.5 py-1.5 rounded bg-aerospace-950/85 border border-slate-800 text-[11px] text-slate-300 pointer-events-none space-y-0.5">
                <div><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500 mr-1.5" />Surface lowered</div>
                <div><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500 mr-1.5" />Surface raised</div>
                <div><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-500 mr-1.5" />Within ±0.05 m</div>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <fieldset className="rounded-lg bg-aerospace-900 border border-slate-800 p-3 space-y-2">
              <legend className="px-1 text-slate-400">Colour by</legend>
              <div className="flex flex-wrap gap-1.5">
                {modes.map(m => (
                  <button key={m.id} type="button" disabled={!m.ok} onClick={() => setColorMode(m.id)} aria-pressed={colorMode === m.id}
                    className={`px-2.5 py-1 rounded border ${colorMode === m.id ? 'bg-sky-500/20 border-sky-500/60 text-sky-200' : 'border-slate-700 text-slate-300'} disabled:opacity-35`}>{m.label}</button>
                ))}
              </div>
              {colorMode === 'classification' && (
                <ul className="flex flex-wrap gap-x-3 gap-y-1">{classes.map(c => { const [r, g, b] = classColor(c); return <li key={c} className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: `rgb(${r * 255},${g * 255},${b * 255})` }} />{CLASS_NAMES[c] || `Class ${c}`}</li>; })}</ul>
              )}
              {colorMode === 'elevation' && <p className="text-slate-400">Blue = {fmt(cloud.min[2], 1)} m, red = {fmt(cloud.max[2], 1)} m</p>}
            </fieldset>
            <fieldset className="rounded-lg bg-aerospace-900 border border-slate-800 p-3 space-y-2">
              <legend className="px-1 text-slate-400">Display</legend>
              <label className="flex items-center gap-2">Point size
                <input type="range" min={0.1} max={1.2} step={0.05} value={pointSize} onChange={e => setPointSize(parseFloat(e.target.value))} className="flex-1" aria-label="Point size" />
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />Grid</label>
                <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={showBox} onChange={e => setShowBox(e.target.checked)} />Bounding box</label>
              </div>
            </fieldset>
          </div>
        </div>

        <aside className="space-y-3" aria-label="Measurements and dataset information">
          <section className="rounded-lg bg-aerospace-900 border border-slate-800 p-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Measurement</h2>
            {tool === 'orbit' && <p className="text-xs text-slate-400">Choose Distance or Area &amp; volume, then click points in the cloud.</p>}
            {tool === 'distance' && (distance ? (
              <div>
                <Row k="3D distance" v={`${fmt(distance.distance3D)} m`} />
                <Row k="Horizontal" v={`${fmt(distance.horizontalDistance)} m`} />
                <Row k="Height difference" v={`${fmt(distance.signedDz)} m`} />
                {slope && <><Row k="Inclination" v={`${fmt(slope.lineAngleDeg, 2)}°`} /><Row k="Grade" v={Number.isFinite(slope.gradePercent) ? `${fmt(slope.gradePercent, 1)} %` : 'vertical'} /></>}
                {profile && <div className="mt-2"><ElevationProfile samples={profile} /></div>}
              </div>
            ) : <p className="text-xs text-slate-400">Pick two points.</p>)}
            {tool === 'polygon' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button type="button" disabled={picks.length < 3 || closed} onClick={() => setClosed(true)} className="px-2.5 py-1 rounded border border-sky-500/50 text-sky-200 text-xs disabled:opacity-35">Close &amp; compute</button>
                  <button type="button" onClick={() => { setPicks([]); setClosed(false); }} className="px-2.5 py-1 rounded border border-slate-700 text-slate-300 text-xs inline-flex items-center gap-1"><RotateCcw className="w-3 h-3" aria-hidden />Reset</button>
                </div>
                <label className="flex items-center justify-between gap-2 text-xs text-slate-300">Base elevation (m)
                  <input type="number" step="0.1" value={baseZ} onChange={e => setBaseZ(e.target.value)} className="w-24 px-2 py-1 rounded bg-aerospace-950 border border-slate-700 text-right font-mono" aria-label="Base elevation in metres" />
                </label>
                {polyResult ? (
                  <div>
                    <Row k="Projected area" v={`${fmt(polyResult.area.projectedArea)} m²`} />
                    {polyResult.area.terrainSurfaceArea !== undefined && <Row k="Surface area" v={`${fmt(polyResult.area.terrainSurfaceArea)} m²`} />}
                    <Row k="Perimeter" v={`${fmt(polyResult.area.perimeter)} m`} />
                    {polyResult.volume && <>
                      <Row k="Volume above base" v={`${fmt(polyResult.volume.cutVolume)} m³`} />
                      <Row k="Volume below base" v={`${fmt(polyResult.volume.fillVolume)} m³`} />
                      <Row k="Cells used" v={polyResult.volume.validCellsCount} />
                    </>}
                    <p className="text-[11px] text-slate-400 mt-1">Highest-return surface model, 0.5 m cells. Empty cells are skipped, never filled in.</p>
                  </div>
                ) : <p className="text-xs text-slate-400">Outline at least 3 points, then close the polygon.</p>}
              </div>
            )}
            {last !== null && (
              <div className="mt-3 pt-2 border-t border-slate-800">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Last picked point</p>
                <Row k="X / Y / Z" v={`${fmt(cloud.xyz[last * 3], 2)} / ${fmt(cloud.xyz[last * 3 + 1], 2)} / ${fmt(cloud.xyz[last * 3 + 2], 2)}`} />
                <Row k="Class" v={CLASS_NAMES[cloud.classification[last]] || cloud.classification[last]} />
              </div>
            )}
          </section>

          <section className="rounded-lg bg-aerospace-900 border border-slate-800 p-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Dataset</h2>
            <Row k="Points" v={cloud.count.toLocaleString()} />
            <Row k="Format" v={`LAS ${cloud.version}, point format ${cloud.pointFormat}`} />
            <Row k="Colour in file" v={cloud.rgb ? 'Yes' : 'No'} />
            {aabb && <>
              <Row k="Extent X × Y × Z" v={`${fmt(aabb.dx, 1)} × ${fmt(aabb.dy, 1)} × ${fmt(aabb.dz, 1)} m`} />
              <Row k="Elevation" v={`${fmt(cloud.min[2], 1)} – ${fmt(cloud.max[2], 1)} m`} />
            </>}
            <Row k="Coordinates" v="Local, metres (no CRS)" />
          </section>

          {checks && (
            <section className="rounded-lg bg-aerospace-900 border border-emerald-500/30 p-3" aria-labelledby="gt-h">
              <h2 id="gt-h" className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2 inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden />Check against ground truth</h2>
              {checks.kind === 'terrain' ? (
                <>
                  <table className="w-full text-[11px]">
                    <thead><tr className="text-slate-400 text-left"><th className="font-normal pb-1">Quantity</th><th className="font-normal text-right">Measured</th><th className="font-normal text-right">Expected</th></tr></thead>
                    <tbody>{checks.rows.map(r => (
                      <tr key={r.label} className="border-t border-slate-800/60"><td className="py-1 pr-2">{r.label}</td><td className="text-right font-mono">{fmt(r.measured)}</td><td className="text-right font-mono text-slate-400">{fmt(r.expected)} {r.unit}</td></tr>
                    ))}</tbody>
                  </table>
                  <p className="text-[11px] text-slate-400 mt-2">Measured here from the loaded points. Expected comes from the dataset's ground-truth file. {checks.note}</p>
                </>
              ) : (
                <>
                  <table className="w-full text-[11px]">
                    <thead><tr className="text-slate-400 text-left"><th className="font-normal pb-1">Volume</th><th className="font-normal text-right">Measured</th><th className="font-normal text-right">Analytical</th></tr></thead>
                    <tbody>
                      <tr className="border-t border-slate-800/60"><td className="py-1">Material removed</td><td className="text-right font-mono">{fmt(checks.result.lossVolume, 1)}</td><td className="text-right font-mono text-slate-400">{fmt(checks.truth.theoretical.cut_volume_m3, 1)} m³</td></tr>
                      <tr className="border-t border-slate-800/60"><td className="py-1">Material deposited</td><td className="text-right font-mono">{fmt(checks.result.gainVolume, 1)}</td><td className="text-right font-mono text-slate-400">{fmt(checks.truth.theoretical.fill_volume_m3, 1)} m³</td></tr>
                      <tr className="border-t border-slate-800/60"><td className="py-1">Net change</td><td className="text-right font-mono">{fmt(checks.result.netVolume, 1)}</td><td className="text-right font-mono text-slate-400">{fmt(checks.truth.theoretical.net_volume_m3, 1)} m³</td></tr>
                    </tbody>
                  </table>
                  <p className="text-[11px] text-slate-400 mt-2">Computed in your browser as a surface-model difference over {checks.result.comparedCells.toLocaleString()} cells observed in both surveys. Analytical values come from the generator's ground-truth file.</p>
                </>
              )}
            </section>
          )}

          <section className="rounded-lg bg-aerospace-900 border border-slate-800 p-3 text-xs space-y-1.5">
            <h2 className="font-bold uppercase tracking-wider text-slate-300 text-xs mb-1">Source &amp; licence</h2>
            <p className="text-slate-300">{ds.source}</p>
            <p className="text-slate-400">Licence: {ds.licence}</p>
            <p className="text-amber-300/90">Synthetic data generated for benchmarking. It does not depict a real place and was not captured by a drone or sensor.</p>
            {ds.files.map(f => <a key={f.url} href={f.url} download className="flex items-center gap-1 text-sky-300 hover:underline">{f.label}<ExternalLink className="w-3 h-3" aria-hidden /></a>)}
          </section>
        </aside>
      </div>
    </main>
  );
};

export const LidarPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>();
  const ds = getLidarDataset(datasetId);
  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title={ds ? ds.name : 'LiDAR Demo'} />
        {datasetId && !ds ? (
          <main id="main-content" className="p-10 text-center text-slate-300 space-y-3"><FileQuestion className="w-8 h-8 mx-auto text-slate-400" aria-hidden /><p>Unknown LiDAR dataset.</p><Link to="/lidar" className="text-sky-300 hover:underline">Back to LiDAR demos</Link></main>
        ) : ds ? <LidarViewer key={ds.id} ds={ds} /> : <LidarIndex />}
      </div>
    </div>
  );
};
