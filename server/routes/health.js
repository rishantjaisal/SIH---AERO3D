import express from 'express';
import { PolycamProvider } from '../providers/PolycamProvider.js';

const router = express.Router();

// GET /api/health
router.get('/', (req, res) => {
  const polycam = new PolycamProvider();
  const polycamConfigured = polycam.isConfigured();
  const providerSetting = process.env.RECONSTRUCTION_PROVIDER || 'demo';

  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      frontend: { status: 'ONLINE', details: 'Vite React App' },
      backend: { status: 'ONLINE', details: 'Node.js Express Server' },
      database: { status: process.env.DATABASE_URL ? 'ONLINE' : 'DEMO_MODE', details: process.env.DATABASE_URL ? 'PostgreSQL Active' : 'In-Memory State' },
      storage: { status: 'ONLINE', details: 'Local Disk Storage (S3 Ready)' },
      polycam: {
        status: polycamConfigured ? 'ONLINE' : 'NOT_CONFIGURED',
        provider: providerSetting,
        details: polycamConfigured ? 'Connected to Polycam API v1' : 'Demo Provider Fallback Active'
      },
      aiEngine: { status: 'DEMO_MODE', details: 'Aero3D Computer Vision Abstract Layer' },
      threeJsEngine: { status: 'ONLINE', details: 'WebGL R3F Canvas' }
    }
  });
});

export default router;
