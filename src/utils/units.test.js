import test from 'node:test';
import assert from 'node:assert/strict';
import { convertFromMeters, formatLength } from './units.ts';
import { dimensionsFromExtents } from './dimensions.ts';

test('unit conversion from metres', () => {
  assert.equal(convertFromMeters(2, 'cm'), 200);
  assert.equal(convertFromMeters(2, 'mm'), 2000);
  assert.ok(Math.abs(convertFromMeters(0.3048, 'ft') - 1) < 1e-9);
});

test('uncalibrated values stay in model units and are never scaled', () => {
  assert.equal(formatLength(3.2765, { calibrated: false, scaleFactor: 50, unit: 'm' }), '3.28 u');
});

test('calibration is applied exactly once, then converted to the selected unit', () => {
  const o = { calibrated: true, scaleFactor: 2, unit: 'm' };
  assert.equal(formatLength(3, o), '6.00 m');
  assert.equal(formatLength(3, { ...o, unit: 'cm' }), '600.00 cm');
  assert.equal(formatLength(3, { ...o, unit: 'mm' }), '6000 mm');
});

test('invalid or empty values return null instead of NA/undefined text', () => {
  const o = { calibrated: false, scaleFactor: 1, unit: 'm' };
  assert.equal(formatLength(0, o), null);
  assert.equal(formatLength(undefined, o), null);
  assert.equal(formatLength(NaN, o), null);
});

test('dimensionsFromExtents picks the longer horizontal axis as length', () => {
  assert.deepEqual(dimensionsFromExtents({ x: 4, y: 2, z: 9 }), { length: 9, width: 4, height: 2, lengthAxis: 'z' });
  assert.equal(dimensionsFromExtents({ x: 0, y: 0, z: 0 }), null);
  assert.equal(dimensionsFromExtents({ x: NaN, y: 1, z: 1 }), null);
  assert.equal(dimensionsFromExtents(null), null);
});
