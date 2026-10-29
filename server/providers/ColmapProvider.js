import { ReconstructionProvider } from './ReconstructionProvider.js';
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ProjectStore } from '../services/ProjectStore.js';

export class ColmapProvider extends ReconstructionProvider {
  constructor() {
    super('COLMAP Local Engine');
    this.colmapExecutable = process.env.COLMAP_PATH || (process.platform === 'win32' ? 'C:/COLMAP/bin/colmap.exe' : '/usr/bin/colmap');
  }

  /**
   * Device Guard / Security check for COLMAP availability
   */
  isConfigured() {
    try {
      if (fs.existsSync(this.colmapExecutable)) {
        return true;
      }
      // Check if colmap is in system PATH
      execSync('colmap help', { stdio: 'ignore' });
      return true;
    } catch (err) {
      return false;
    }
  }

  getStatus() {
    const configured = this.isConfigured();
    return {
      mode: 'colmap',
      name: this.name,
      configured,
      message: configured
        ? `COLMAP Engine Active (${this.colmapExecutable})`
        : 'Local reconstruction engine is unavailable on this computer. (COLMAP binary missing or blocked by OS Security/Device Guard)'
    };
  }

  async listCaptures() {
    return ProjectStore.list().filter(p => p.provider === 'colmap');
  }

  async getCapture(id) {
    const stored = ProjectStore.get(id);
    if (!stored) {
      const err = new Error(`Project ${id} not found.`);
      err.status = 404;
      throw err;
    }
    const exists = fs.existsSync(path.join(process.cwd(), 'storage', 'projects', id, 'output', 'model.glb'));
    return { ...stored, status: exists ? 'SUCCEEDED' : stored.status };
  }

  async getArtifacts(id) {
    return [
      { type: 'glb', url: `/api/projects/${id}/model`, label: 'COLMAP 3D GLB Mesh' }
    ];
  }

  async exportModel(id, format = 'glb') {
    return {
      status: 'COMPLETED',
      format,
      download_url: `/api/projects/${id}/model`
    };
  }

  async createCapture(options) {
    const projectId = options.projectId || `proj-colmap-${Date.now()}`;
    const projectDir = path.join(process.cwd(), 'storage', 'projects', projectId);
    const framesDir = path.join(projectDir, 'frames');
    const dbPath = path.join(projectDir, 'reconstruction', 'database.db');
    const sparseDir = path.join(projectDir, 'reconstruction', 'sparse');
    const denseDir = path.join(projectDir, 'reconstruction', 'dense');
    const outputDir = path.join(projectDir, 'output');

    [projectDir, framesDir, path.dirname(dbPath), sparseDir, denseDir, outputDir].forEach(d => {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    });

    if (!this.isConfigured()) {
      throw new Error('Local photogrammetry engine is unavailable on this computer. (COLMAP binary missing or blocked by OS Security/Device Guard)');
    }

    const hasGps = typeof options.latitude === 'number' && typeof options.longitude === 'number';
    return ProjectStore.save({
      id: projectId,
      name: options.name || 'COLMAP Drone Survey',
      status: options.status || 'QUEUED',
      provider: 'colmap',
      created_at: new Date().toISOString(),
      model_url: options.model_url || `/api/projects/${projectId}/model`,
      thumbnail_url: '',
      isDemo: false,
      reconstructionEngine: 'colmap',
      metadata: {
        locationName: options.location || '',
        gps: hasGps ? { latitude: options.latitude, longitude: options.longitude } : null,
        gsd: options.gsd || '',
        surveyDate: options.surveyDate || new Date().toISOString().split('T')[0],
        droneModel: options.droneModel || '',
        cameraModel: options.cameraModel || '',
        flightAltitude: options.flightAltitude || '',
        weather: options.weather || '',
        operator: options.operator || ''
      }
    });
  }
}
