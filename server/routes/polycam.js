import express from 'express';
import { PolycamProvider } from '../providers/PolycamProvider.js';
import { DemoProvider } from '../providers/DemoProvider.js';

const router = express.Router();

function getActiveProvider() {
  const polycam = new PolycamProvider();
  if (process.env.RECONSTRUCTION_PROVIDER === 'polycam' && polycam.isConfigured()) {
    return { provider: polycam, mode: 'polycam' };
  }
  return { provider: new DemoProvider(), mode: 'demo' };
}

// GET /api/polycam/status
router.get('/status', (req, res) => {
  const { provider, mode } = getActiveProvider();
  res.json({
    mode,
    name: provider.name,
    configured: mode === 'polycam' ? provider.isConfigured() : true,
    message: mode === 'polycam'
      ? 'Polycam API connected successfully.'
      : 'Using Demo Reconstruction Provider (No Polycam credentials configured or fallback active).'
  });
});

// GET /api/polycam/captures
router.get('/captures', async (req, res) => {
  try {
    const { provider, mode } = getActiveProvider();
    const captures = await provider.listCaptures();
    res.json({ provider: mode, captures });
  } catch (error) {
    res.status(error.status || 500).json({
      error: true,
      code: error.code || 'CAPTURE_FETCH_FAILED',
      message: error.message || 'Failed to list captures.'
    });
  }
});

// GET /api/polycam/captures/:id
router.get('/captures/:id', async (req, res) => {
  try {
    const { provider, mode } = getActiveProvider();
    const capture = await provider.getCapture(req.params.id);
    res.json({ provider: mode, capture });
  } catch (error) {
    res.status(error.status || 500).json({
      error: true,
      code: error.code || 'CAPTURE_NOT_FOUND',
      message: error.message || 'Failed to fetch capture details.'
    });
  }
});

// GET /api/polycam/captures/:id/artifacts
router.get('/captures/:id/artifacts', async (req, res) => {
  try {
    const { provider, mode } = getActiveProvider();
    const artifacts = await provider.getArtifacts(req.params.id);
    res.json({ provider: mode, artifacts });
  } catch (error) {
    res.status(error.status || 500).json({
      error: true,
      code: error.code || 'ARTIFACT_FETCH_FAILED',
      message: error.message || 'Failed to retrieve artifacts.'
    });
  }
});

// POST /api/polycam/captures/:id/export
router.post('/captures/:id/export', async (req, res) => {
  try {
    const { provider, mode } = getActiveProvider();
    const format = req.body.format || 'glb';
    const result = await provider.exportModel(req.params.id, format);
    res.json({ provider: mode, result });
  } catch (error) {
    res.status(error.status || 500).json({
      error: true,
      code: error.code || 'EXPORT_FAILED',
      message: error.message || 'Failed to export 3D format.'
    });
  }
});

export default router;
