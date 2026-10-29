/**
 * Shared, non-React state for the scroll-driven landing story.
 * The page writes `target` from the scroll position; the 3D scene smooths it into `current`
 * and writes telemetry back for the HUD and projected label positions.
 */
export const sm = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export interface LabelState {
  x: number;
  y: number;
  opacity: number;
}

export const story = {
  /** raw scroll progress through the story (0..1) */
  target: 0,
  /** smoothed progress used by the scene */
  current: 0,
  /** 3D model parsed and first frame ready */
  ready: false,
  /** 0..1 intro scan sweep progress */
  intro: 0,
  /** real mesh stats written by the scene */
  stats: { vertices: 0, triangles: 0, points: 0 },
  /** projected screen positions of the on-model tags */
  labels: [] as LabelState[],
  /** pointer parallax (-0.5..0.5) */
  mx: 0,
  my: 0
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True when a WebGL context can be created (guards the scene on very old / locked-down browsers). */
export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
