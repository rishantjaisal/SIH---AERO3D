export interface Extents {
  x: number;
  y: number;
  z: number;
}

export interface ModelDimensions {
  /** longer horizontal extent */
  length: number;
  /** shorter horizontal extent */
  width: number;
  /** vertical (Y) extent */
  height: number;
  /** which world axis carries the length ('x' or 'z') */
  lengthAxis: 'x' | 'z';
}

/** Derive length / width / height from world-space bounding-box extents (Y is up). Returns null for empty or invalid boxes. */
export function dimensionsFromExtents(e: Extents | null | undefined): ModelDimensions | null {
  if (!e) return null;
  const { x, y, z } = e;
  if (![x, y, z].every(v => typeof v === 'number' && isFinite(v) && v >= 0)) return null;
  if (x === 0 && y === 0 && z === 0) return null;
  const lengthAxis = x >= z ? 'x' : 'z';
  return { length: Math.max(x, z), width: Math.min(x, z), height: y, lengthAxis };
}
