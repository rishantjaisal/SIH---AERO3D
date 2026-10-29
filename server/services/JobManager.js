import crypto from 'crypto';
import { getEngine } from '../config.js';

/**
 * In-Memory & File-backed Asynchronous Processing Job Queue Manager
 */
const MAX_JOBS = 500;
const FINISHED_TTL_MS = 60 * 60 * 1000; // keep finished jobs for 1 hour

class JobManager {
  constructor() {
    this.jobs = new Map();
  }

  /** Drop old finished jobs so the in-memory map cannot grow without bound. */
  prune() {
    const now = Date.now();
    for (const [id, job] of this.jobs) {
      const finished = job.status === 'completed' || job.status === 'failed';
      if (finished && now - Date.parse(job.updatedAt) > FINISHED_TTL_MS) this.jobs.delete(id);
    }
    // Hard cap: evict oldest finished jobs first
    if (this.jobs.size > MAX_JOBS) {
      for (const [id, job] of this.jobs) {
        if (this.jobs.size <= MAX_JOBS) break;
        if (job.status === 'completed' || job.status === 'failed') this.jobs.delete(id);
      }
    }
  }

  /** The queued/processing job for a project, if any. */
  getActiveJobByProject(projectId) {
    for (const job of this.jobs.values()) {
      if (job.projectId === projectId && (job.status === 'queued' || job.status === 'processing')) return job;
    }
    return null;
  }

  deleteByProject(projectId) {
    let removed = 0;
    for (const [id, job] of this.jobs) {
      if (job.projectId === projectId) {
        this.jobs.delete(id);
        removed++;
      }
    }
    return removed;
  }

  createJob(projectId, options = {}) {
    this.prune();
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
      simulated: Boolean(options.simulated),
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
