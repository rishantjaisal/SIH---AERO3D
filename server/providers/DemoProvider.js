import { ReconstructionProvider } from './ReconstructionProvider.js';
import path from 'path';
import fs from 'fs';

const SVG_THUMBNAILS = {
  academic: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="150" y="120" width="300" height="180" rx="6" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><rect x="180" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><rect x="240" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><rect x="300" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><rect x="360" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><polygon points="250,120 300,70 350,120" fill="%230284c7"/><text x="300" y="340" text-anchor="middle" fill="%2338bdf8" font-family="monospace" font-size="16" font-weight="bold">KIET CAMPUS DIGITAL TWIN</text></svg>`,
  taj: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="180" y="100" width="240" height="200" rx="8" fill="%230284c7" opacity="0.3" stroke="%2338bdf8" stroke-width="2"/><polygon points="300,40 220,100 380,100" fill="%2338bdf8" opacity="0.6"/><text x="300" y="340" text-anchor="middle" fill="%2338bdf8" font-family="monospace" font-size="16" font-weight="bold">TAJ MAHAL DIGITAL TWIN</text></svg>`,
  city: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="80" y="140" width="440" height="160" rx="6" fill="%230f172a" stroke="%2334d399" stroke-width="2"/><text x="300" y="340" text-anchor="middle" fill="%2334d399" font-family="monospace" font-size="16" font-weight="bold">RUINED CITY DIGITAL TWIN</text></svg>`
};

export class DemoProvider extends ReconstructionProvider {
  constructor() {
    super('Demo/Local Engine');
    this.demoCaptures = [
      {
        id: 'demo-proj-001',
        name: 'KIET Campus Building Survey',
        status: 'SUCCEEDED',
        provider: 'demo',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        model_url: '/demo/build.glb',
        thumbnail_url: SVG_THUMBNAILS.academic,
        isDemo: true,
        reconstructionEngine: 'demo',
        metadata: {
          locationName: 'Delhi NCR, India',
          gps: { latitude: 28.7523, longitude: 77.4988 },
          gsd: '1.2 cm/px',
          surveyDate: '2026-08-28',
          droneModel: 'DJI Mavic 3 Enterprise RTK',
          cameraModel: '20MP Micro 4/3 CMOS',
          flightAltitude: '45 m',
          weather: 'Clear',
          operator: 'Aero3D Flight Lead',
          accuracyNote: 'DEMO SAMPLE — Real photogrammetry model (public/demo/build.glb).'
        }
      },
      {
        id: 'demo-proj-002',
        name: 'Taj Mahal 3D Digital Twin Survey',
        status: 'SUCCEEDED',
        provider: 'demo',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        model_url: '/demo/taj_mahal_3d_model.glb',
        thumbnail_url: SVG_THUMBNAILS.taj,
        isDemo: true,
        reconstructionEngine: 'demo',
        metadata: {
          locationName: 'Agra, Uttar Pradesh, India',
          gps: { latitude: 27.1751, longitude: 78.0421 },
          gsd: '0.8 cm/px',
          surveyDate: '2026-08-25',
          droneModel: 'DJI Matrice 300 RTK',
          cameraModel: '45MP Full Frame Photogrammetry',
          flightAltitude: '50 m',
          weather: 'Clear Sky',
          operator: 'Senior GIS Lead',
          accuracyNote: 'DEMO SAMPLE — Real photogrammetry model (public/demo/taj_mahal_3d_model.glb).'
        }
      },
      {
        id: 'demo-proj-003',
        name: 'Smart Ruined City Urban Survey',
        status: 'SUCCEEDED',
        provider: 'demo',
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        model_url: '/demo/ruined_city_free_5.glb',
        thumbnail_url: SVG_THUMBNAILS.city,
        isDemo: true,
        reconstructionEngine: 'demo',
        metadata: {
          locationName: 'Urban Heritage Site',
          gps: null,
          gsd: '1.0 cm/px',
          surveyDate: '2026-08-20',
          droneModel: 'DJI Inspire 3 RTK',
          cameraModel: '8K Aerial Camera Sensor',
          flightAltitude: '60 m',
          weather: 'Overcast',
          operator: 'Chief Drone Surveyor',
          accuracyNote: 'DEMO SAMPLE — Real photogrammetry model (public/demo/ruined_city_free_5.glb).'
        }
      }
    ];
  }

  isConfigured() {
    return true;
  }

  async listCaptures() {
    return this.demoCaptures;
  }

  async getCapture(id) {
    const capture = this.demoCaptures.find(c => c.id === id);
    if (capture) {
      return { ...capture, isDemo: true };
    }

    const projectStorageDir = path.join(process.cwd(), 'storage', 'projects', id);
    const customModelPath = path.join(projectStorageDir, 'output', 'model.glb');
    const hasCustomModel = fs.existsSync(customModelPath);

    return {
      id,
      name: `Drone Survey Digital Twin ${id}`,
      status: hasCustomModel ? 'SUCCEEDED' : 'QUEUED',
      provider: 'demo',
      created_at: new Date().toISOString(),
      model_url: `/api/projects/${id}/model`,
      thumbnail_url: SVG_THUMBNAILS.academic,
      isDemo: true,
      reconstructionEngine: 'demo',
      metadata: {
        locationName: '',
        gps: null,
        gsd: '',
        surveyDate: new Date().toISOString().split('T')[0],
        droneModel: '',
        cameraModel: '',
        flightAltitude: '',
        weather: '',
        operator: ''
      }
    };
  }

  async getArtifacts(id) {
    const capture = await this.getCapture(id);
    const mUrl = capture?.model_url || `/api/projects/${id}/model`;
    return [
      { type: 'glb', url: mUrl, label: '3D GLB Digital Twin Mesh' }
    ];
  }

  async exportModel(id, format = 'glb') {
    const capture = await this.getCapture(id);
    const mUrl = capture?.model_url || `/api/projects/${id}/model`;
    return {
      status: 'COMPLETED',
      format,
      download_url: mUrl,
      isDemo: true
    };
  }

  async createCapture(options) {
    const newId = options.projectId || options.id || `proj-${Date.now()}`;
    const existingIdx = this.demoCaptures.findIndex(c => c.id === newId);

    const hasGps = typeof options.latitude === 'number' && typeof options.longitude === 'number';

    const newCapture = {
      id: newId,
      name: options.name || 'Uploaded Drone Survey',
      status: options.status || 'QUEUED',
      provider: 'demo',
      created_at: new Date().toISOString(),
      model_url: options.model_url || `/api/projects/${newId}/model`,
      thumbnail_url: SVG_THUMBNAILS.academic,
      isDemo: true,
      reconstructionEngine: 'demo',
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
    };

    if (existingIdx >= 0) {
      this.demoCaptures[existingIdx] = newCapture;
    } else {
      this.demoCaptures.unshift(newCapture);
    }

    return newCapture;
  }
}
