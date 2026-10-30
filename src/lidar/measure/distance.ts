// Ported from the GeoVision 3D reference project (frontend/src/measure/distance.ts); pure math, unchanged apart from import paths.
import { Point3D, DistanceResult } from './types';

/**
 * Calculates 3D Euclidean distance, horizontal distance, and vertical height difference
 * directly on float64 world coordinates.
 */
export function computeDistance(
  p1: Point3D,
  p2: Point3D,
  unit: string = 'metre',
  isVerifiedScale: boolean = true
): DistanceResult {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];

  const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const horizontalDistance = Math.sqrt(dx * dx + dy * dy);
  const verticalDifference = Math.abs(dz);

  const accuracyNote = isVerifiedScale
    ? 'Euclidean distance computed from projected Cartesian coordinates. Error depends on point picking precision and sensor beam divergence.'
    : 'Arbitrary uncalibrated scale. Values represent relative coordinate units, not physical meters.';

  return {
    distance3D,
    horizontalDistance,
    verticalDifference,
    signedDz: dz,
    unit: isVerifiedScale ? unit : 'arbitrary units',
    method: 'EUCLIDEAN_3D_VECTOR',
    accuracyNote
  };
}
