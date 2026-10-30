// Ported from the GeoVision 3D reference project (frontend/src/measure/slope.ts); pure math, import paths adjusted.
import { Point3D, SlopeResult } from './types';
import { DemGrid } from '../DemGrid';

/**
 * Computes the line inclination angle and grade percentage between two 3D points.
 */
export function computeLineSlope(
  p1: Point3D,
  p2: Point3D,
  isVerifiedScale: boolean = true
): SlopeResult {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];

  const horizontalDist = Math.sqrt(dx * dx + dy * dy);
  const verticalDiff = Math.abs(dz);

  let angleDeg = 0;
  let gradePercent = 0;

  if (horizontalDist > 1e-9) {
    const angleRad = Math.atan2(verticalDiff, horizontalDist);
    angleDeg = (angleRad * 180) / Math.PI;
    gradePercent = (verticalDiff / horizontalDist) * 100;
  } else if (verticalDiff > 1e-9) {
    // Pure vertical line
    angleDeg = 90.0;
    gradePercent = Infinity;
  }

  return {
    lineAngleDeg: angleDeg,
    gradePercent,
    method: 'TWO_POINT_INCLINATION_ANGLE',
    unit: 'degrees',
    accuracyNote: isVerifiedScale
      ? 'Line inclination angle calculated relative to the horizontal projection plane.'
      : 'Unverified scale. Angle is computed in relative coordinate ratios.'
  };
}

/**
 * Computes terrain surface slope at world coordinates (x, y) using local DEM gradient (Horn / central differences).
 */
export function computeSurfaceSlope(
  demGrid: DemGrid,
  worldX: number,
  worldY: number,
  isVerifiedScale: boolean = true
): SlopeResult | null {
  const { col, row } = demGrid.worldToGrid(worldX, worldY);
  const c = Math.round(col);
  const r = Math.round(row);

  if (!demGrid.isObservedCell(c, r)) {
    return null;
  }

  // Sample horizontal gradient dz/dx
  const zLeft = demGrid.getElevation(c - 1, r);
  const zRight = demGrid.getElevation(c + 1, r);
  let dz_dx = 0;
  if (zLeft !== null && zRight !== null) {
    dz_dx = (zRight - zLeft) / (2 * demGrid.cellSizeX);
  } else if (zRight !== null) {
    const zCenter = demGrid.getElevation(c, r)!;
    dz_dx = (zRight - zCenter) / demGrid.cellSizeX;
  } else if (zLeft !== null) {
    const zCenter = demGrid.getElevation(c, r)!;
    dz_dx = (zCenter - zLeft) / demGrid.cellSizeX;
  }

  // Sample vertical gradient dz/dy (Note: row 0 is North / highest Y)
  const zNorth = demGrid.getElevation(c, r - 1);
  const zSouth = demGrid.getElevation(c, r + 1);
  let dz_dy = 0;
  if (zNorth !== null && zSouth !== null) {
    dz_dy = (zNorth - zSouth) / (2 * demGrid.cellSizeY);
  } else if (zNorth !== null) {
    const zCenter = demGrid.getElevation(c, r)!;
    dz_dy = (zNorth - zCenter) / demGrid.cellSizeY;
  } else if (zSouth !== null) {
    const zCenter = demGrid.getElevation(c, r)!;
    dz_dy = (zCenter - zSouth) / demGrid.cellSizeY;
  }

  const gradientMag = Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy);
  const surfaceSlopeRad = Math.atan(gradientMag);
  const surfaceSlopeDeg = (surfaceSlopeRad * 180) / Math.PI;
  const gradePercent = gradientMag * 100;

  return {
    lineAngleDeg: surfaceSlopeDeg,
    gradePercent,
    surfaceSlopeDeg,
    method: 'DEM_SURFACE_NORMAL_GRADIENT',
    unit: 'degrees',
    accuracyNote: isVerifiedScale
      ? 'Terrain surface slope computed via finite-difference elevation gradient from verified DEM grid.'
      : 'Unverified scale. Slope calculated in arbitrary coordinate ratios.'
  };
}
