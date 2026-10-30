// Ported from the GeoVision 3D reference project (frontend/src/measure/box.ts); pure math, unchanged apart from import paths.
import { Point3D, AabbResult } from './types';

/**
 * Computes Axis-Aligned Bounding Box (AABB) extents from a collection of 3D points.
 * Note: AABB is orientation-dependent and serves as an envelope estimate.
 */
export function computeAabb(
  points: Point3D[],
  unit: string = 'metre',
  isVerifiedScale: boolean = true
): AabbResult {
  if (points.length === 0) {
    throw new Error('At least one point is required to compute bounding box extents.');
  }

  let minX = points[0][0];
  let maxX = points[0][0];
  let minY = points[0][1];
  let maxY = points[0][1];
  let minZ = points[0][2];
  let maxZ = points[0][2];

  for (let i = 1; i < points.length; i++) {
    const [x, y, z] = points[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    dx: maxX - minX,
    dy: maxY - minY,
    dz: maxZ - minZ,
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    unit: isVerifiedScale ? unit : 'arbitrary units',
    method: 'AXIS_ALIGNED_BOUNDING_BOX',
    accuracyNote: 'AABB extents (estimate), not true physical dimensions. Rotated or non-orthogonal structures may exhibit orientation envelope inflation.'
  };
}
