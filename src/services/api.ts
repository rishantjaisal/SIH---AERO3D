import axios from 'axios';
import { Project, AIObjectDetection, SystemHealth } from '../types';

const API_BASE = '/api';

export const api = {
  // Provider Status
  async getProviderStatus() {
    try {
      const res = await axios.get(`${API_BASE}/polycam/status`);
      return res.data;
    } catch (err: any) {
      return {
        mode: 'demo',
        name: 'Demo/Local Engine',
        configured: false,
        message: err.response?.data?.message || 'Reconstruction engine running in Demo Mode.'
      };
    }
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const res = await axios.get(`${API_BASE}/projects`);
      return res.data.projects || [];
    } catch (err) {
      console.warn('Backend unavailable, returning local projects list');
      return [];
    }
  },

  async getProject(id: string): Promise<Project | null> {
    try {
      const res = await axios.get(`${API_BASE}/projects/${id}`);
      return res.data.project;
    } catch (err) {
      return null;
    }
  },

  async createSurvey(formData: FormData) {
    try {
      const res = await axios.post(`${API_BASE}/projects/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to upload survey files');
    }
  },

  // Asynchronous Photogrammetry Jobs
  async processProject(projectId: string) {
    try {
      const res = await axios.post(`${API_BASE}/projects/${projectId}/process`);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to queue reconstruction job');
    }
  },

  async getJob(jobId: string) {
    try {
      const res = await axios.get(`${API_BASE}/jobs/${jobId}`);
      return res.data.job;
    } catch (err: any) {
      return null;
    }
  },

  // AI Detections
  async getAIAnalysis(projectId: string): Promise<{ isDemo: boolean; summary: any; detections: AIObjectDetection[] }> {
    try {
      const res = await axios.get(`${API_BASE}/ai/analysis/${projectId}`);
      return res.data;
    } catch (err) {
      return {
        isDemo: true,
        summary: { totalObjects: 6 },
        detections: []
      };
    }
  },

  // System Health
  async getHealth(): Promise<SystemHealth> {
    try {
      const res = await axios.get(`${API_BASE}/health`);
      return res.data;
    } catch (err) {
      return {
        status: 'DEGRADED',
        timestamp: new Date().toISOString(),
        uptime: 0,
        services: {
          frontend: { status: 'ONLINE', details: 'Vite Client App' },
          backend: { status: 'OFFLINE', details: 'Express Server Not Responding' },
          database: { status: 'DEMO_MODE', details: 'Local State' },
          storage: { status: 'ONLINE', details: 'Browser Cache' },
          polycam: { status: 'NOT_CONFIGURED', provider: 'demo', details: 'Demo Provider Active' },
          aiEngine: { status: 'DEMO_MODE', details: 'Mock AI Engine' },
          threeJsEngine: { status: 'ONLINE', details: 'WebGL R3F Canvas' }
        }
      };
    }
  }
};
