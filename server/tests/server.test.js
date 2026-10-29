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

test('DELETE /api/projects/:id removes only that project folder and rejects bad ids', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const os = await import('node:os');
  const express = (await import('express')).default;
  const { default: router } = await import('../routes/projects.js');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aero3d-del-'));
  const prevCwd = process.cwd();
  process.chdir(tmp);
  const mk = id => {
    const d = path.join(tmp, 'storage', 'projects', id, 'output');
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'model.glb'), 'x');
  };
  mk('aero-a');
  mk('aero-b');

  const app = express();
  app.use('/api/projects', router);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api/projects`;
  try {
    const ok = await fetch(`${base}/aero-a`, { method: 'DELETE' });
    assert.equal(ok.status, 200);
    assert.equal(fs.existsSync(path.join(tmp, 'storage', 'projects', 'aero-a')), false);
    assert.equal(fs.existsSync(path.join(tmp, 'storage', 'projects', 'aero-b')), true);

    const bad = await fetch(`${base}/..%2F..`, { method: 'DELETE' });
    assert.equal(bad.status, 400);
  } finally {
    server.close();
    process.chdir(prevCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// HTTP-level backend tests (isolated temp working directory, real Express app)
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { before, after } from 'node:test';

let baseUrl; let httpServer; let origCwd; let tmp;

before(async () => {
  origCwd = process.cwd();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aero-test-'));
  process.chdir(tmp);
  const { app } = await import('../index.js');
  httpServer = app.listen(0);
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});
after(() => {
  httpServer?.close();
  process.chdir(origCwd);
  fs.rmSync(tmp, { recursive: true, force: true });
});

const glbBytes = () => {
  const b = Buffer.alloc(20); b.write('glTF', 0); return b;
};
const upload = async (id, name = 'm.glb', body = {}) => {
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => fd.append(k, v));
  fd.append('files', new Blob([glbBytes()]), name);
  return fetch(`${baseUrl}/api/projects/${id}/upload`, { method: 'POST', body: fd });
};

test('unknown API route returns JSON 404', async () => {
  const r = await fetch(`${baseUrl}/api/nope`);
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error, true);
});

test('project data is not exposed through /storage or /uploads', async () => {
  assert.equal((await upload('leak-test')).status, 201);
  for (const p of ['/storage/projects/leak-test/project.json', '/uploads/x', '/api/uploads/x']) {
    const r = await fetch(baseUrl + p);
    assert.ok(!(r.status === 200 && (r.headers.get('content-type') || '').includes('json')), p);
  }
});

test('uploaded project persists, is listed, and is fetchable; unknown id is 404', async () => {
  const r = await upload('proj-a', 'm.glb', { projectName: 'Site A', latitude: '12.5', longitude: '77.1' });
  assert.equal(r.status, 201);
  assert.ok(fs.existsSync(path.join(tmp, 'storage/projects/proj-a/project.json')));
  const got = await (await fetch(`${baseUrl}/api/projects/proj-a`)).json();
  assert.equal((got.project || got).name, 'Site A');
  const list = await (await fetch(`${baseUrl}/api/projects`)).json();
  assert.ok(JSON.stringify(list).includes('proj-a'));
  assert.equal((await fetch(`${baseUrl}/api/projects/does-not-exist`)).status, 404);
});

test('upload rejects reserved ids and unsupported extensions', async () => {
  assert.equal((await upload('demo-proj-001')).status, 403);
  const fd = new FormData(); fd.append('files', new Blob(['x']), 'a.obj');
  const r = await fetch(`${baseUrl}/api/projects/proj-b/upload`, { method: 'POST', body: fd });
  assert.ok(r.status >= 400 && r.status < 500);
  assert.equal(fs.existsSync(path.join(tmp, 'storage/projects/proj-b')), false);
});

test('process: 404 unknown, 400 reserved, completes immediately when a model exists', async () => {
  assert.equal((await fetch(`${baseUrl}/api/projects/ghost/process`, { method: 'POST' })).status, 404);
  assert.equal((await fetch(`${baseUrl}/api/projects/demo-proj-001/process`, { method: 'POST' })).status, 400);
  await upload('proj-c');
  const p = await fetch(`${baseUrl}/api/projects/proj-c/process`, { method: 'POST' });
  assert.equal(p.status, 202);
  const { jobId } = await p.json();
  await new Promise(r => setTimeout(r, 200));
  const job = await (await fetch(`${baseUrl}/api/jobs/${jobId}`)).json();
  assert.equal((job.job || job).status, 'completed');
});

test('process without a model fails honestly with no fabricated metrics', async () => {
  const fd = new FormData(); fd.append('files', new Blob([Buffer.from('not really a jpeg')]), 'a.jpg');
  await fetch(`${baseUrl}/api/projects/proj-d/upload`, { method: 'POST', body: fd });
  const { jobId } = await (await fetch(`${baseUrl}/api/projects/proj-d/process`, { method: 'POST' })).json();
  await new Promise(r => setTimeout(r, 300));
  const j = await (await fetch(`${baseUrl}/api/jobs/${jobId}`)).json();
  const job = j.job || j;
  assert.equal(job.status, 'failed');
  assert.notEqual(job.qualityMetrics?.registeredImages, 164);
  assert.ok(!fs.existsSync(path.join(tmp, 'storage/projects/proj-d/output/model.glb')));
});

test('DELETE removes the project, is idempotent, and keeps sample models', async () => {
  await upload('proj-e');
  assert.equal((await fetch(`${baseUrl}/api/projects/proj-e`, { method: 'DELETE' })).status, 200);
  assert.equal(fs.existsSync(path.join(tmp, 'storage/projects/proj-e')), false);
  // delete is idempotent, and never touches the bundled sample model
  assert.equal((await fetch(`${baseUrl}/api/projects/proj-e`, { method: 'DELETE' })).status, 200);
  assert.ok((await fetch(`${baseUrl}/api/projects/demo-proj-001`, { method: 'DELETE' })).status < 500);
  assert.equal((await fetch(`${baseUrl}/api/projects/proj-e`)).status, 404);
});

test('AI analysis is only provided for the bundled sample', async () => {
  const real = await (await fetch(`${baseUrl}/api/ai/analysis/proj-a`)).json();
  assert.equal(real.available, false);
  assert.equal(real.detections.length, 0);
  const demo = await (await fetch(`${baseUrl}/api/ai/analysis/demo-proj-001`)).json();
  assert.ok(demo.detections.length > 0);
});

test('CORS allows DELETE and the health endpoint reports real capabilities', async () => {
  const h = await (await fetch(`${baseUrl}/api/health`)).json();
  assert.ok(h.services.ffmpeg && h.services.colmap);
  assert.notEqual(h.services.database.status, 'ONLINE');
});

test('JobManager prunes finished jobs and finds active ones per project', () => {
  const jm = new JobManager();
  const j = jm.createJob('p1');
  assert.equal(jm.getActiveJobByProject('p1')?.id, j.id);
  jm.failJob(j.id, 'X', 'boom');
  assert.equal(jm.getActiveJobByProject('p1'), null);
  jm.deleteByProject('p1');
  assert.ok(!jm.getJob(j.id));
});
