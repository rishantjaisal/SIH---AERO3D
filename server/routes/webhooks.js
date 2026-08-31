import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// POST /api/webhooks/polycam
router.post('/polycam', express.raw({ type: 'application/json' }), (req, res) => {
  const webhookSecret = process.env.POLYCAM_WEBHOOK_SECRET;
  const signature = req.headers['x-polycam-signature'] || req.headers['x-signature'];

  // If secret is set, verify signature
  if (webhookSecret) {
    if (!signature) {
      return res.status(401).json({ error: true, message: 'Missing Webhook Signature header.' });
    }

    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(req.body).digest('hex');

    if (signature !== digest) {
      return res.status(401).json({ error: true, message: 'Invalid Webhook Signature.' });
    }
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch (err) {
    return res.status(400).json({ error: true, message: 'Invalid JSON payload.' });
  }

  console.log(`[Aero3D Webhook Receiver] Received Polycam event: ${event.type || 'capture.update'}`);

  // Process capture state transition
  const captureId = event.data?.id || event.capture_id;
  const status = event.data?.status || event.status;

  res.json({
    received: true,
    processedAt: new Date().toISOString(),
    captureId,
    status
  });
});

export default router;
