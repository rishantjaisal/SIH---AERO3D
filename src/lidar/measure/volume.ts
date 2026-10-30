// Ported from the GeoVision 3D reference project (frontend/src/measure/volume.ts); pure math, unchanged apart from import paths.
import { Point3D, VolumeResult } from './types';
import { DemGrid } from '../DemGrid';
import { isPointInPolygon2D } from './area';

export interface VolumeOptions {
  referenceType: 'PLANE_ELEVATION' | 'BEST_FIT_PLANE';
  baseElevation?: number; // for PLANE_ELEVATION
}

/**
 * Fits a 2D plane z = a*x + b*y + c to a set of 3D points using least squares.
 */
function fitPlane(points: Point3D[]): (x: number, y: number) => number {
  if (points.length < 3) {
    const avgZ = points.reduce((sum, p) => sum + p[2], 0) / (points.length || 1);
    return () => avgZ;
  }

  // Normal equations for least squares: A^T * A * [a, b, c]^T = A^T * z
  let sumX = 0, sumY = 0, sumZ = 0;
  let sumXX = 0, sumYY = 0, sumXY = 0;
  let sumXZ = 0, sumYZ = 0;
  const n = points.length;

  for (const p of points) {
    const [x, y, z] = p;
    sumX += x;
    sumY += y;
    sumZ += z;
    sumXX += x * x;
    sumYY += y * y;
    sumXY += x * y;
    sumXZ += x * z;
    sumYZ += y * z;
  }

  // Centered coordinates for numerical stability
  const meanX = sumX / n;
  const meanY = sumY / n;
  const meanZ = sumZ / n;

  let sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0;
  for (const p of points) {
    const dx = p[0] - meanX;
    const dy = p[1] - meanY;
    const dz = p[2] - meanZ;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
    sxz += dx * dz;
    syz += dy * dz;
  }

  const det = sxx * syy - sxy * sxy;
  if (Math.abs(det) < 1e-12) {
    return () => meanZ;
  }

  const a = (syy * sxz - sxy * syz) / det;
  const b = (sxx * syz - sxy * sxz) / det;
  const c = meanZ - a * meanX - b * meanY;

  return (x: number, y: number) => a * x + b * y + c;
}

/**
 * Computes cut, fill, and net volume of a DEM within a polygon relative to a chosen reference surface.
 */
export function computeVolume(
  polygon: Point3D[],
  demGrid: DemGrid,
  options: VolumeOptions,
  isVerifiedScale: boolean = true
): VolumeResult {
  if (polygon.length < 3) {
    throw new Error('A polygon with at least 3 vertices is required for volume calculation.');
  }

  let refFunc: (x: number, y: number) => number;
  let referenceElevation = 0;

  if (options.referenceType === 'BEST_FIT_PLANE') {
    refFunc = fitPlane(polygon);
    referenceElevation = polygon.reduce((sum, p) => sum + p[2], 0) / polygon.length;
  } else {
    // Fixed base plane elevation
    referenceElevation = options.baseElevation !== undefined 
      ? options.baseElevation 
      : polygon.reduce((min, p) => Math.min(min, p[2]), polygon[0][2]);
    refFunc = () => referenceElevation;
  }

  // Polygon bounding box
  let minX = polygon[0][0], maxX = polygon[0][0];
  let minY = polygon[0][1], maxY = polygon[0][1];
  for (const pt of polygon) {
    if (pt[0] < minX) minX = pt[0];
    if (pt[0] > maxX) maxX = pt[0];
    if (pt[1] < minY) minY = pt[1];
    if (pt[1] > maxY) maxY = pt[1];
  }

  const gMin = demGrid.worldToGrid(minX, maxY);
  const gMax = demGrid.worldToGrid(maxX, minY);

  const startCol = Math.max(0, Math.floor(gMin.col));
  const endCol = Math.min(demGrid.width - 1, Math.ceil(gMax.col));
  const startRow = Math.max(0, Math.floor(gMin.row));
  const endRow = Math.min(demGrid.height - 1, Math.ceil(gMax.row));

  const cellArea = demGrid.cellSizeX * demGrid.cellSizeY;
  let cutVolume = 0;
  let fillVolume = 0;
  let validCellsCount = 0;

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const { x: wx, y: wy } = demGrid.gridToWorld(c, r);
      if (isPointInPolygon2D(wx, wy, polygon) && demGrid.isObservedCell(c, r)) {
        const zTerrain = demGrid.getElevation(c, r);
        if (zTerrain !== null) {
          validCellsCount++;
          const zRef = refFunc(wx, wy);
          const dz = zTerrain - zRef;

          if (dz > 0) {
            cutVolume += dz * cellArea;
          } else {
            fillVolume += Math.abs(dz) * cellArea;
          }
        }
      }
    }
  }

  const assumptions = options.referenceType === 'BEST_FIT_PLANE'
    ? 'Reference surface is a least-squares best-fit plane through boundary vertices.'
    : `Reference surface is a flat horizontal base plane at elevation Z = ${referenceElevation.toFixed(2)} ${isVerifiedScale ? 'm' : 'units'}.`;

  const accuracyNote = isVerifiedScale
    ? 'Cut/Fill computed by integrating cell column prisms (cell area * dz) across observed DEM cells. Unobserved cells excluded.'
    : 'Arbitrary uncalibrated scale. Values represent cubic coordinate units, not physical cubic metres.';

  return {
    cutVolume,
    fillVolume,
    netVolume: cutVolume - fillVolume,
    referenceType: options.referenceType,
    referenceElevation,
    cellArea,
    validCellsCount,
    unit: isVerifiedScale ? 'm³' : 'units³',
    method: 'DEM_PRISMATIC_CELL_INTEGRATION',
    assumptions,
    accuracyNote
  };
}
