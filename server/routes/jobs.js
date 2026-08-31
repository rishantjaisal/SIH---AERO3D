import express from 'express';
import { jobManager } from '../services/JobManager.js';

const router = express.Router();

// GET /api/jobs/:jobId - Poll job status, stage, progress, quality metrics, and message
router.get('/:jobId', (req, res) => {
  const job = jobManager.getJob(req.params.jobId);
  
  if (!job) {
    // Check if queried by projectId
    const projJob = jobManager.getJobByProject(req.params.jobId);
    if (projJob) {
      return res.json({ success: true, job: projJob });
    }
    return res.status(404).json({ error: true, message: 'Processing job not found' });
  }

  res.json({ success: true, job });
});

export default router;
