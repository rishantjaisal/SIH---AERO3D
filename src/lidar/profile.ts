import { DemGrid } from './DemGrid';
import { Point3D } from './measure';

export interface ProfileSample { d: number; z: number | null }

/** Elevation along a straight line, sampled from the surface model. Unobserved cells give null (never interpolated across). */
export function elevationProfile(a: Point3D, b: Point3D, dem: DemGrid, steps = 120): ProfileSample[] {
  const total = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const out: ProfileSample[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push({ d: total * t, z: dem.sample(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) });
  }
  return out;
}
