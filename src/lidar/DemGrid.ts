// Ported from the GeoVision 3D reference project (frontend/src/utils/DemGrid.ts); DemMetadata is declared here.
export interface DemMetadata {
  width: number;
  height: number;
  originX: number;
  originY: number;
  cellSizeX: number;
  cellSizeY: number;
  method: string;
  crs: string;
  horizontalUnit: string;
  verticalUnit: string;
  elevationMin: number;
  elevationMax: number;
  elevationMean: number;
  validCellCount: number;
  totalCellCount: number;
}

/**
 * High-performance client-side Digital Elevation Model (DEM) Grid Wrapper.
 * Backed by Float32Array elevation buffers and Uint8Array coverage masks.
 * Strictly adheres to Phase 6.5 R5: Unobserved cells are NaN with coverage 0;
 * bilinear sampling returns unobserved (null) if ANY of the 4 surrounding cells is unobserved.
 */
export class DemGrid {
  readonly elevations: Float32Array;
  readonly coverage: Uint8Array;
  readonly meta: DemMetadata;

  constructor(
    arg0: DemMetadata | Float32Array,
    arg1: ArrayBuffer | Float32Array | Uint8Array,
    arg2: Uint8Array | DemMetadata
  ) {
    if ('width' in arg0) {
      this.meta = arg0 as DemMetadata;
      this.elevations = (arg1 instanceof Float32Array) ? arg1 : new Float32Array(arg1 as ArrayBuffer);
      this.coverage = arg2 as Uint8Array;
    } else {
      this.elevations = arg0 as Float32Array;
      this.coverage = arg1 as Uint8Array;
      this.meta = arg2 as DemMetadata;
    }
  }

  get width(): number {
    return this.meta.width;
  }

  get height(): number {
    return this.meta.height;
  }

  get cellSizeX(): number {
    return this.meta.cellSizeX;
  }

  get cellSizeY(): number {
    return this.meta.cellSizeY;
  }

  get originX(): number {
    return this.meta.originX;
  }

  get originY(): number {
    return this.meta.originY;
  }

  /**
   * Convert world coordinates (X, Y) to continuous grid indices (col, row).
   * Col 0 is originX, moving East (+X).
   * Row 0 is originY (Northernmost), moving South (-Y).
   */
  worldToGrid(x: number, y: number): { col: number; row: number } {
    const col = (x - this.meta.originX) / this.meta.cellSizeX;
    const row = (this.meta.originY - y) / this.meta.cellSizeY;
    return { col, row };
  }

  /**
   * Convert grid (col, row) to world coordinate (X, Y) at cell center.
   */
  gridToWorld(col: number, row: number): { x: number; y: number } {
    const x = this.meta.originX + (col + 0.5) * this.meta.cellSizeX;
    const y = this.meta.originY - (row + 0.5) * this.meta.cellSizeY;
    return { x, y };
  }

  /**
   * Check if a cell contains a real observation (coverage mask == 1).
   */
  isObservedCell(col: number, row: number): boolean {
    if (col < 0 || col >= this.meta.width || row < 0 || row >= this.meta.height) {
      return false;
    }
    const idx = row * this.meta.width + col;
    return this.coverage[idx] === 1;
  }

  /**
   * Check if the cell corresponding to world (x, y) is observed.
   */
  isObserved(x: number, y: number): boolean {
    const { col, row } = this.worldToGrid(x, y);
    const c = Math.floor(col);
    const r = Math.floor(row);
    return this.isObservedCell(c, r);
  }

  /**
   * Get raw elevation at integer cell indices. Returns null if out of bounds, unobserved, or NaN.
   */
  getElevation(col: number, row: number): number | null {
    if (col < 0 || col >= this.meta.width || row < 0 || row >= this.meta.height) {
      return null;
    }
    const idx = row * this.meta.width + col;
    if (this.coverage[idx] !== 1) {
      return null;
    }
    const val = this.elevations[idx];
    return isNaN(val) ? null : val;
  }

  /**
   * Bilinear interpolation of elevation at world coordinates (x, y).
   * Phase 6.5 R5: Returns null if ANY of the 4 surrounding bounding cells is unobserved or out of bounds.
   * Never blends NaN with valid values.
   */
  sample(x: number, y: number): number | null {
    const { col, row } = this.worldToGrid(x, y);

    // Shift by 0.5 to sample between cell centers
    const u = col - 0.5;
    const v = row - 0.5;

    const c0 = Math.floor(u);
    const r0 = Math.floor(v);
    const c1 = c0 + 1;
    const r1 = r0 + 1;

    // Bounds check: all 4 corners must be strictly within the grid
    if (c0 < 0 || c1 >= this.meta.width || r0 < 0 || r1 >= this.meta.height) {
      return null;
    }

    const z00 = this.getElevation(c0, r0);
    const z10 = this.getElevation(c1, r0);
    const z01 = this.getElevation(c0, r1);
    const z11 = this.getElevation(c1, r1);

    // Strict no-fabrication rule: ALL 4 corners must be observed
    if (z00 === null || z10 === null || z01 === null || z11 === null) {
      return null;
    }

    const fx = u - c0;
    const fy = v - r0;

    // Bilinear interpolation
    const zTop = z00 * (1 - fx) + z10 * fx;
    const zBottom = z01 * (1 - fx) + z11 * fx;
    return zTop * (1 - fy) + zBottom * fy;
  }

  /**
   * Alias for sample(x, y).
   */
  sampleElevation(x: number, y: number): number | null {
    return this.sample(x, y);
  }

  /**
   * Computes Horn's slope and aspect for a given grid cell.
   * Phase 6.5 R5: Returns null if ANY cell in the 3x3 window is unobserved or out of bounds.
   */
  computeHorn(col: number, row: number): { slopeDeg: number | null; aspectDeg: number | null } {
    if (col < 1 || col >= this.meta.width - 1 || row < 1 || row >= this.meta.height - 1) {
      return { slopeDeg: null, aspectDeg: null };
    }

    // 8 neighbors
    const z00 = this.getElevation(col - 1, row - 1);
    const z01 = this.getElevation(col, row - 1);
    const z02 = this.getElevation(col + 1, row - 1);
    const z10 = this.getElevation(col - 1, row);
    const z11 = this.getElevation(col, row);
    const z12 = this.getElevation(col + 1, row);
    const z20 = this.getElevation(col - 1, row + 1);
    const z21 = this.getElevation(col, row + 1);
    const z22 = this.getElevation(col + 1, row + 1);

    if (
      z00 === null || z01 === null || z02 === null ||
      z10 === null || z11 === null || z12 === null ||
      z20 === null || z21 === null || z22 === null
    ) {
      return { slopeDeg: null, aspectDeg: null };
    }

    const dx = this.meta.cellSizeX;
    const dy = this.meta.cellSizeY;

    // Horn gradient estimators
    const dz_dx = ((z02 + 2 * z12 + z22) - (z00 + 2 * z10 + z20)) / (8 * dx);
    const dz_dy = ((z20 + 2 * z21 + z22) - (z00 + 2 * z01 + z02)) / (8 * dy);

    const gradMag = Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy);
    const slopeDeg = Math.atan(gradMag) * (180 / Math.PI);

    let aspectDeg = 0;
    if (gradMag >= 1e-6) {
      aspectDeg = 180.0 - Math.atan2(dz_dy, -dz_dx) * (180 / Math.PI);
      if (aspectDeg < 0) aspectDeg += 360.0;
      if (aspectDeg >= 360.0) aspectDeg -= 360.0;
    } else {
      aspectDeg = -1.0; // Flat
    }

    return { slopeDeg, aspectDeg };
  }
}
