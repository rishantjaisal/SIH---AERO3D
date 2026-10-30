// Ported from the GeoVision 3D reference project (frontend/src/measure/types.ts); pure math, unchanged apart from import paths.
export type Point3D = [number, number, number]; // [X, Y, Z] in float64 world coordinates

export interface DistanceResult {
  distance3D: number;
  horizontalDistance: number;
  verticalDifference: number; // absolute
  signedDz: number; // z2 - z1
  unit: string;
  method: string;
  accuracyNote: string;
}

export interface AabbResult {
  min: Point3D;
  max: Point3D;
  dx: number; // width
  dy: number; // length
  dz: number; // height
  center: Point3D;
  unit: string;
  method: string;
  accuracyNote: string;
}

export interface SlopeResult {
  lineAngleDeg: number; // angle of segment relative to horizontal
  gradePercent: number; // (|dz| / d_h) * 100
  surfaceSlopeDeg?: number; // local terrain surface normal slope if DEM is queried
  method: string;
  unit: string;
  accuracyNote: string;
}

export interface PolygonAreaResult {
  projectedArea: number; // 2D horizontal shoelace area
  terrainSurfaceArea?: number; // 3D triangulated terrain area across DEM cells
  perimeter: number;
  unit: string;
  method: string;
  accuracyNote: string;
  hasDem: boolean;
}

export interface VolumeResult {
  cutVolume: number; // volume above reference
  fillVolume: number; // volume below reference
  netVolume: number; // cut - fill
  referenceType: 'PLANE_ELEVATION' | 'BEST_FIT_PLANE' | 'CUSTOM_DEM';
  referenceElevation: number;
  cellArea: number;
  validCellsCount: number;
  unit: string;
  method: string;
  assumptions: string;
  accuracyNote: string;
}
