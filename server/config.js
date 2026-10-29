/**
 * Central runtime configuration. Reads env at call time so tests and late dotenv loading work.
 */

/** Active reconstruction engine: demo | colmap | polycam. */
export function getEngine() {
  return (
    process.env.PHOTOGRAMMETRY_ENGINE ||
    process.env.RECONSTRUCTION_ENGINE ||
    process.env.RECONSTRUCTION_PROVIDER ||
    'demo'
  ).toLowerCase();
}

/** FFmpeg frame sampling rate (fps), default 3. */
export function getFrameRate() {
  const fps = parseFloat(process.env.FRAME_RATE);
  return Number.isFinite(fps) && fps > 0 && fps <= 30 ? fps : 3;
}

const PROJECT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

/** True when the id is safe to use as a single path segment. */
export function isValidProjectId(id) {
  return typeof id === 'string' && PROJECT_ID_PATTERN.test(id);
}

/** Allowed CORS origins from CORS_ORIGIN (comma-separated). Empty list means same-origin only. */
export function getAllowedOrigins() {
  return (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
}
