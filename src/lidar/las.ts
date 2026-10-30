/**
 * Minimal, dependency-free LAS reader (uncompressed LAS 1.0–1.4, point formats 0–3).
 * LAZ (compressed) and formats 4+ are rejected with a clear message rather than guessed at.
 * Coordinates are decoded in float64 from the header scale/offset.
 */
export interface LasCloud {
  count: number;
  /** World X,Y,Z interleaved, float64. */
  xyz: Float64Array;
  /** 8-bit RGB interleaved, or null when the point format has no colour. */
  rgb: Uint8Array | null;
  classification: Uint8Array;
  intensity: Uint16Array;
  min: [number, number, number];
  max: [number, number, number];
  version: string;
  pointFormat: number;
}

const RGB_OFFSET: Record<number, number | undefined> = { 2: 20, 3: 28 };
const GPS_FORMATS = new Set([1, 3]);

export function parseLas(buf: ArrayBuffer): LasCloud {
  if (buf.byteLength < 227) throw new Error('File is too small to be a LAS file.');
  const dv = new DataView(buf);
  const sig = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (sig !== 'LASF') throw new Error('Not a LAS file (missing LASF signature).');

  const major = dv.getUint8(24);
  const minor = dv.getUint8(25);
  const dataOffset = dv.getUint32(96, true);
  const rawFormat = dv.getUint8(104);
  const pointFormat = rawFormat & 0x3f;
  if (rawFormat & 0x80) throw new Error('LAZ (compressed) files are not supported in the browser viewer. Use an uncompressed .las file.');
  if (pointFormat > 3) throw new Error(`LAS point format ${pointFormat} is not supported (formats 0–3 only).`);
  const recLen = dv.getUint16(105, true);
  let count = dv.getUint32(107, true);
  if (major === 1 && minor >= 4 && count === 0) count = Number(dv.getBigUint64(247, true));

  const sx = dv.getFloat64(131, true), sy = dv.getFloat64(139, true), sz = dv.getFloat64(147, true);
  const ox = dv.getFloat64(155, true), oy = dv.getFloat64(163, true), oz = dv.getFloat64(171, true);
  if (dataOffset + count * recLen > buf.byteLength) throw new Error('LAS file is truncated.');

  const hasGps = GPS_FORMATS.has(pointFormat);
  const rgbAt = RGB_OFFSET[pointFormat];
  const xyz = new Float64Array(count * 3);
  const rgb = rgbAt !== undefined ? new Uint8Array(count * 3) : null;
  const classification = new Uint8Array(count);
  const intensity = new Uint16Array(count);
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  void hasGps;

  // Colour is 16-bit in the spec, but many writers store 8-bit values; scale by the observed maximum.
  let rgbMax = 0;
  const rgb16 = rgb ? new Uint16Array(count * 3) : null;

  for (let i = 0; i < count; i++) {
    const p = dataOffset + i * recLen;
    const x = dv.getInt32(p, true) * sx + ox;
    const y = dv.getInt32(p + 4, true) * sy + oy;
    const z = dv.getInt32(p + 8, true) * sz + oz;
    xyz[i * 3] = x; xyz[i * 3 + 1] = y; xyz[i * 3 + 2] = z;
    if (x < min[0]) min[0] = x; if (x > max[0]) max[0] = x;
    if (y < min[1]) min[1] = y; if (y > max[1]) max[1] = y;
    if (z < min[2]) min[2] = z; if (z > max[2]) max[2] = z;
    intensity[i] = dv.getUint16(p + 12, true);
    classification[i] = dv.getUint8(p + 15) & 0x1f;
    if (rgb16 && rgbAt !== undefined) {
      for (let c = 0; c < 3; c++) {
        const v = dv.getUint16(p + rgbAt + c * 2, true);
        rgb16[i * 3 + c] = v;
        if (v > rgbMax) rgbMax = v;
      }
    }
  }
  if (rgb && rgb16) {
    const div = rgbMax > 255 ? 257 : 1; // 16-bit full-range -> 8-bit
    for (let i = 0; i < rgb16.length; i++) rgb[i] = Math.min(255, Math.round(rgb16[i] / div));
  }
  return { count, xyz, rgb, classification, intensity, min, max, version: `${major}.${minor}`, pointFormat };
}
