// Ported from the GeoVision 3D reference project (frontend/src/measure/area.ts); pure math, unchanged apart from import paths.
import { Point3D, PolygonAreaResult } from './types';
import { DemGrid } from '../DemGrid';

/**
 * Checks whether a 2D point (x, y) lies inside a polygon using ray casting algorithm.
 */
export function isPointInPolygon2D(x: number, y: number, polygon: Point3D[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Computes 2D projected horizontal area (Shoelace formula) and perimeter.
 */
export function computeProjectedPolygonArea(
  polygon: Point3D[]
): { area: number; perimeter: number } {
  const n = polygon.length;
  if (n < 3) {
    return { area: 0, perimeter: 0 };
  }

  let areaSum = 0;
  let perimeter = 0;

  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];

    areaSum += p1[0] * p2[1] - p2[0] * p1[1];

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    perimeter += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  return {
    area: Math.abs(areaSum) / 2.0,
    perimeter
  };
}

/**
 * Computes both projected horizontal area and terrain-following surface area
 * by integrating surface elements dA = sqrt(1 + (dz/dx)^2 + (dz/dy)^2) * dx * dy across observed DEM cells.
 */
export function computePolygonArea(
  polygon: Point3D[],
  demGrid?: DemGrid | null,
  isVerifiedScale: boolean = true
): PolygonAreaResult {
  const { area: projectedArea, perimeter } = computeProjectedPolygonArea(polygon);
  const unit = isVerifiedScale ? 'm²' : 'units²';

  if (!demGrid || polygon.length < 3) {
    return {
      projectedArea,
      perimeter,
      unit,
      method: 'SHOELACE_2D_PROJECTED',
      accuracyNote: 'Projected horizontal area computed via Shoelace formula on 2D coordinates. Terrain relief not accounted for.',
      hasDem: false
    };
  }

  // Find bounding box of polygon in world coordinates
  let minX = polygon[0][0], maxX = polygon[0][0];
  let minY = polygon[0][1], maxY = polygon[0][1];
  for (const pt of polygon) {
    if (pt[0] < minX) minX = pt[0];
    if (pt[0] > maxX) maxX = pt[0];
    if (pt[1] < minY) minY = pt[1];
    if (pt[1] > maxY) maxY = pt[1];
  }

  // Convert bounding box to DEM grid ranges
  const gMin = demGrid.worldToGrid(minX, maxY); // Northernmost is smaller row
  const gMax = demGrid.worldToGrid(maxX, minY);

  const startCol = Math.max(0, Math.floor(gMin.col));
  const endCol = Math.min(demGrid.width - 1, Math.ceil(gMax.col));
  const startRow = Math.max(0, Math.floor(gMin.row));
  const endRow = Math.min(demGrid.height - 1, Math.ceil(gMax.row));

  let terrainSurfaceArea = 0;
  let cellCount = 0;

  const dx = demGrid.cellSizeX;
  const dy = demGrid.cellSizeY;
  const cellArea = dx * dy;

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const { x: wx, y: wy } = demGrid.gridToWorld(c, r);
      if (isPointInPolygon2D(wx, wy, polygon) && demGrid.isObservedCell(c, r)) {
        cellCount++;

        // Compute local gradient
        const zLeft = demGrid.getElevation(c - 1, r);
        const zRight = demGrid.getElevation(c + 1, r);
        const zNorth = demGrid.getElevation(c, r - 1);
        const zSouth = demGrid.getElevation(c, r + 1);

        let dz_dx = 0;
        let dz_dy = 0;

        if (zLeft !== null && zRight !== null) {
          dz_dx = (zRight - zLeft) / (2 * dx);
        }
        if (zNorth !== null && zSouth !== null) {
          dz_dy = (zNorth - zSouth) / (2 * dy);
        }

        // Differential surface element dA
        const dA = Math.sqrt(1 + dz_dx * dz_dx + dz_dy * dz_dy) * cellArea;
        terrainSurfaceArea += dA;
      }
    }
  }

  // If cellCount is low (polygon smaller than DEM cell resolution), fallback to projected area
  if (cellCount === 0 || terrainSurfaceArea < projectedArea) {
    terrainSurfaceArea = projectedArea;
  }

  return {
    projectedArea,
    terrainSurfaceArea,
    perimeter,
    unit,
    method: 'DEM_SURFACE_INTEGRATION',
    accuracyNote: 'Shows both 2D horizontal footprint area and terrain-following 3D surface area derived from DEM elevation gradients.',
    hasDem: true
  };
}
