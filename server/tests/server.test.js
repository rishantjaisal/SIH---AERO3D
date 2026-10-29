import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidProjectId, getEngine, getFrameRate } from '../config.js';
import { JobManager } from '../services/JobManager.js';
import { validateMediaFile } from '../utils/ffmpegExtractor.js';

test('isValidProjectId accepts safe ids and rejects traversal', () => {
  assert.equal(isValidProjectId('demo-proj-001'), true);
  assert.equal(isValidProjectId('aero_123-abc'), true);
  assert.equal(isValidProjectId('../etc'), false);
  assert.equal(isValidProjectId('a/b'), false);
  assert.equal(isValidProjectId('a\\b'), false);
  assert.equal(isValidProjectId(''), false);
  assert.equal(isValidProjectId('x'.repeat(65)), false);
  assert.equal(isValidProjectId(undefined), false);
});

test('getEngine prefers PHOTOGRAMMETRY_ENGINE and falls back to legacy names', () => {
  const saved = { ...process.env };
  delete process.env.PHOTOGRAMMETRY_ENGINE;
  delete process.env.RECONSTRUCTION_ENGINE;
  delete process.env.RECONSTRUCTION_PROVIDER;
  assert.equal(getEngine(), 'demo');
  process.env.RECONSTRUCTION_PROVIDER = 'polycam';
  assert.equal(getEngine(), 'polycam');
  process.env.PHOTOGRAMMETRY_ENGINE = 'COLMAP';
  assert.equal(getEngine(), 'colmap');
  process.env = saved;
});

test('getFrameRate reads FRAME_RATE and defaults to 3', () => {
  const saved = process.env.FRAME_RATE;
  delete process.env.FRAME_RATE;
  assert.equal(getFrameRate(), 3);
  process.env.FRAME_RATE = '5';
  assert.equal(getFrameRate(), 5);
  process.env.FRAME_RATE = 'abc';
  assert.equal(getFrameRate(), 3);
  if (saved === undefined) delete process.env.FRAME_RATE;
  else process.env.FRAME_RATE = saved;
});

test('JobManager.getJobByProject returns the latest job', () => {
  const jm = new JobManager();
  const first = jm.createJob('proj-a');
  const second = jm.createJob('proj-a');
  jm.createJob('proj-b');
  assert.notEqual(first.id, second.id);
  assert.equal(jm.getJobByProject('proj-a').id, second.id);
  assert.equal(jm.getJobByProject('missing'), null);
});

test('JobManager.failJob marks job failed with stage', () => {
  const jm = new JobManager();
  const job = jm.createJob('proj-a');
  jm.failJob(job.id, 'FRAME_EXTRACTION', 'boom');
  const stored = jm.getJob(job.id);
  assert.equal(stored.status, 'failed');
  assert.equal(stored.error.stage, 'FRAME_EXTRACTION');
});

test('validateMediaFile rejects unsupported extensions', () => {
  assert.throws(() => validateMediaFile(undefined, 'virus.exe', 0), /Unsupported file extension/);
  assert.throws(() => validateMediaFile(undefined, 'notes.txt', 0), /Unsupported file extension/);
  assert.equal(validateMediaFile(undefined, 'flight.MP4', 0).isVideo, true);
  assert.equal(validateMediaFile(undefined, 'photo.jpg', 0).isImage, true);
});
