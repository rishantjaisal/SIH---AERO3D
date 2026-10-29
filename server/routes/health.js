import express from 'express';
import { PolycamProvider } from '../providers/PolycamProvider.js';
import fs from 'fs';
import path from 'path';
import { getEngine } from '../config.js';
import { ColmapProvider } from '../providers/ColmapProvider.js';
import { isFFmpegAvailable } from '../utils/ffmpegExtractor.js';

const router = express.Router();

// GET /api/health
router.get('/', (req, res) => {
  const polycam = new PolycamProvider();
  const polycamConfigured = polycam.isConfigured();
  const providerSetting = getEngine();

  let storageWritable = false;
  try {
    const dir = path.join(process.cwd(), 'storage', 'projects');
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    storageWritable = true;
  } catch { /* reported below */ }
  const ffmpeg = isFFmpegAvailable();
  const colmap = new ColmapProvider().isConfigured();

  res.json({
    status: storageWritable ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      frontend: { status: 'ONLINE', details: 'Vite React App' },
      backend: { status: 'ONLINE', details: 'Node.js Express Server' },
      database: { status: 'FILE_STORE', details: 'Project records are JSON files on disk (no SQL database is used)' },
      storage: { status: storageWritable ? 'ONLINE' : 'ERROR', details: storageWritable ? 'Local disk storage is writable' : 'storage/projects is not writable' },
      polycam: {
        status: polycamConfigured ? 'ONLINE' : 'NOT_CONFIGURED',
        provider: providerSetting,
        details: polycamConfigured ? 'Connected to Polycam API v1' : 'Demo Provider Fallback Active'
      },
      ffmpeg: { status: ffmpeg ? 'ONLINE' : 'NOT_INSTALLED', details: ffmpeg ? 'Frame extraction available' : 'Video frame extraction unavailable' },
      colmap: { status: colmap ? 'ONLINE' : 'NOT_CONFIGURED', details: colmap ? 'COLMAP executable found' : 'COLMAP not found' },
      aiEngine: { status: 'NOT_CONFIGURED', details: 'No detector is configured; AI analysis only exists for the bundled sample' },
      threeJsEngine: { status: 'ONLINE', details: 'WebGL R3F Canvas' }
    }
  });
});

export default router;
