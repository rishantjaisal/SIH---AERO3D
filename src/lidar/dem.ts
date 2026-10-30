import { DemGrid } from './DemGrid';
import { LasCloud } from './las';

/** Digital surface model: highest return per cell. Cells with no point stay unobserved (never interpolated). */
export function buildDsm(cloud: LasCloud, cell: number): DemGrid {
  const [minX, minY] = cloud.min;
  const [maxX, maxY] = cloud.max;
  const width = Math.floor((maxX - minX) / cell + 1e-6) + 1;
  const height = Math.floor((maxY - minY) / cell + 1e-6) + 1;
  const originX = minX - cell / 2;
  const originY = maxY + cell / 2;
  const elevations = new Float32Array(width * height).fill(NaN);
  const coverage = new Uint8Array(width * height);
  for (let i = 0; i < cloud.count; i++) {
    const col = Math.floor((cloud.xyz[i * 3] - originX) / cell);
    const row = Math.floor((originY - cloud.xyz[i * 3 + 1]) / cell);
    if (col < 0 || col >= width || row < 0 || row >= height) continue;
    const idx = row * width + col;
    const z = cloud.xyz[i * 3 + 2];
    if (!coverage[idx] || z > elevations[idx]) { elevations[idx] = z; coverage[idx] = 1; }
  }
  let valid = 0, sum = 0, zmin = Infinity, zmax = -Infinity;
  for (let i = 0; i < elevations.length; i++) if (coverage[i]) { valid++; sum += elevations[i]; zmin = Math.min(zmin, elevations[i]); zmax = Math.max(zmax, elevations[i]); }
  return new DemGrid({
    width, height, originX, originY, cellSizeX: cell, cellSizeY: cell,
    method: 'MAX_Z_PER_CELL', crs: 'local (no CRS)', horizontalUnit: 'm', verticalUnit: 'm',
    elevationMin: zmin, elevationMax: zmax, elevationMean: valid ? sum / valid : 0,
    validCellCount: valid, totalCellCount: width * height
  }, elevations, coverage);
}

export interface ChangeResult {
  lossVolume: number; // pre higher than post
  gainVolume: number; // post higher than pre
  netVolume: number;
  comparedCells: number;
  cellArea: number;
  lod: number;
}

/** DEM of difference over cells observed in BOTH epochs. Changes within ±lod are ignored. */
export function computeChange(pre: DemGrid, post: DemGrid, lod = 0): ChangeResult {
  if (pre.width !== post.width || pre.height !== post.height || pre.originX !== post.originX || pre.originY !== post.originY) {
    throw new Error('Pre and post grids do not share the same extent.');
  }
  const cellArea = pre.cellSizeX * pre.cellSizeY;
  let loss = 0, gain = 0, n = 0;
  for (let r = 0; r < pre.height; r++) {
    for (let c = 0; c < pre.width; c++) {
      const a = pre.getElevation(c, r), b = post.getElevation(c, r);
      if (a === null || b === null) continue;
      n++;
      const d = b - a;
      if (Math.abs(d) <= lod) continue;
      if (d < 0) loss += -d * cellArea; else gain += d * cellArea;
    }
  }
  return { lossVolume: loss, gainVolume: gain, netVolume: gain - loss, comparedCells: n, cellArea, lod };
}

/** Per-point elevation change (post − pre) for points that fall in a cell observed in both epochs; NaN elsewhere. */
export function pointChange(post: LasCloud, pre: DemGrid, postGrid: DemGrid): Float32Array {
  const out = new Float32Array(post.count).fill(NaN);
  for (let i = 0; i < post.count; i++) {
    const col = Math.floor((post.xyz[i * 3] - postGrid.originX) / postGrid.cellSizeX);
    const row = Math.floor((postGrid.originY - post.xyz[i * 3 + 1]) / postGrid.cellSizeY);
    const a = pre.getElevation(col, row);
    if (a !== null) out[i] = post.xyz[i * 3 + 2] - a;
  }
  return out;
}
