export type LengthUnit = 'm' | 'cm' | 'mm' | 'ft';
export const LENGTH_UNITS: LengthUnit[] = ['m', 'cm', 'mm', 'ft'];

const PER_METRE: Record<LengthUnit, number> = { m: 1, cm: 100, mm: 1000, ft: 1 / 0.3048 };

/** Convert a length in metres to the given unit. */
export function convertFromMeters(valueMeters: number, unit: LengthUnit): number {
  return valueMeters * PER_METRE[unit];
}

export interface LengthFormatOptions {
  /** true when the user has applied a scale calibration (model units -> metres) */
  calibrated: boolean;
  /** metres per model unit (only used when calibrated) */
  scaleFactor: number;
  unit: LengthUnit;
}

/**
 * Format a length measured in raw model units.
 * Uncalibrated values stay in model units ("u"); calibrated values are scaled once to metres and converted.
 */
export function formatLength(modelUnits: number | undefined | null, opts: LengthFormatOptions): string | null {
  if (typeof modelUnits !== 'number' || !isFinite(modelUnits) || modelUnits <= 0) return null;
  if (!opts.calibrated) return `${modelUnits.toFixed(2)} u`;
  const v = convertFromMeters(modelUnits * opts.scaleFactor, opts.unit);
  const digits = opts.unit === 'mm' ? 0 : 2;
  return `${v.toFixed(digits)} ${opts.unit}`;
}
