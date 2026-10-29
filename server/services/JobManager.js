import crypto from 'crypto';
import { getEngine } from '../config.js';

/**
 * In-Memory & File-backed Asynchronous Processing Job Queue Manager
 */
class JobManager {
  constructor() {
    this.jobs = new Map();
  }

  createJob(projectId, options = {}) {
    const jobId = `job-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const job = {
      id: jobId,
      projectId,
      status: 'queued',
      progress: 0,
      stage: 'QUEUED',
      stageLabel: 'Queued for Photogrammetry Processing',
      message: 'Job queued in Aero3D reconstruction pipeline.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inputType: options.inputType || 'video',
      inputFile: options.inputFile || null,
      reconstructionEngine: options.reconstructionEngine || getEngine(),
      qualityMetrics: null,
      error: null
    };

    this.jobs.set(jobId, job);
    return job;
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /** Latest job for a project (Map preserves insertion order, so keep the last match). */
  getJobByProject(projectId) {
    let latest = null;
    for (const job of this.jobs.values()) {
      if (job.projectId === projectId) latest = job;
    }
    return latest;
  }

  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    Object.assign(job, updates, { updatedAt: new Date().toISOString() });
    this.jobs.set(jobId, job);
    return job;
  }

  failJob(jobId, stage, message, details = {}) {
    return this.updateJob(jobId, {
      status: 'failed',
      stage,
      stageLabel: `Failed during ${stage}`,
      message,
      error: {
        stage,
        message,
        details: details.message || 'Check captured frame overlap, texture contrast, and lighting conditions.'
      }
    });
  }
}

export { JobManager };
export const jobManager = new JobManager();
