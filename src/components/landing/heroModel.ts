/**
 * Homepage-only 3D asset. It is deliberately separate from the demo project's model (public/demo/build.glb),
 * which carries the measured geometry used by the real viewer.
 *
 * Preferred: /models/hero/hero-building.glb (see public/models/hero/ATTRIBUTION.md).
 * Fallback:  the bundled demo model, so the homepage never breaks if the hero asset is absent.
 *
 * Netlify answers unknown paths with index.html (SPA fallback, HTTP 200), so we check the GLB magic bytes
 * instead of trusting the status code.
 */
export const HERO_MODEL_URL = '/models/hero/hero-building.glb';
export const FALLBACK_MODEL_URL = '/demo/build.glb';

let pending: Promise<string> | null = null;

export function resolveHeroModelUrl(): Promise<string> {
  if (!pending) {
    pending = (async () => {
      try {
        const res = await fetch(HERO_MODEL_URL, { headers: { Range: 'bytes=0-3' } });
        if (!res.ok) return FALLBACK_MODEL_URL;
        const head = new Uint8Array(await res.arrayBuffer()).slice(0, 4);
        const isGlb = head[0] === 0x67 && head[1] === 0x6c && head[2] === 0x54 && head[3] === 0x46; // "glTF"
        return isGlb ? HERO_MODEL_URL : FALLBACK_MODEL_URL;
      } catch {
        return FALLBACK_MODEL_URL;
      }
    })();
  }
  return pending;
}

/**
 * Selectable homepage backgrounds. "flatroof" is the original; "mountain" is an extra CC0 terrain model with the same scroll effects.
 * Both are homepage-only visuals, not drone reconstructions (see public/models/hero and public/models/environments).
 */
export type SiteId = 'flatroof' | 'mountain';
export const MOUNTAIN_MODEL_URL = '/models/environments/mountain-range.glb';

/** True only if the URL really serves a GLB (SPA fallbacks answer 200 with index.html). */
export async function isGlb(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { Range: 'bytes=0-3' } });
    if (!res.ok) return false;
    const h = new Uint8Array(await res.arrayBuffer()).slice(0, 4);
    return h[0] === 0x67 && h[1] === 0x6c && h[2] === 0x54 && h[3] === 0x46;
  } catch {
    return false;
  }
}
