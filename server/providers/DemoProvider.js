import { ReconstructionProvider } from './ReconstructionProvider.js';

const SVG_THUMBNAILS = {
  academic: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="150" y="120" width="300" height="180" rx="6" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><rect x="180" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><rect x="240" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><rect x="300" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><rect x="360" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><polygon points="250,120 300,70 350,120" fill="%230284c7"/><text x="300" y="340" text-anchor="middle" fill="%2338bdf8" font-family="monospace" font-size="16" font-weight="bold">KIET CAMPUS DIGITAL TWIN</text></svg>`,
  logistics: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="80" y="160" width="440" height="140" rx="6" fill="%230f172a" stroke="%2334d399" stroke-width="2"/><rect x="110" y="180" width="60" height="120" fill="%231e293b" stroke="%2334d399" stroke-width="1"/><rect x="190" y="180" width="60" height="120" fill="%231e293b" stroke="%2334d399" stroke-width="1"/><rect x="270" y="180" width="60" height="120" fill="%231e293b" stroke="%2334d399" stroke-width="1"/><rect x="350" y="180" width="60" height="120" fill="%231e293b" stroke="%2334d399" stroke-width="1"/><text x="300" y="340" text-anchor="middle" fill="%2334d399" font-family="monospace" font-size="16" font-weight="bold">LOGISTICS COMPLEX TWIN</text></svg>`,
  tower: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="220" y="80" width="160" height="220" rx="8" fill="%230284c7" opacity="0.3" stroke="%2338bdf8" stroke-width="2"/><rect x="250" y="50" width="100" height="250" rx="4" fill="%2338bdf8" opacity="0.5"/><line x1="300" y1="10" x2="300" y2="50" stroke="%2338bdf8" stroke-width="4"/><text x="300" y="340" text-anchor="middle" fill="%23818cf8" font-family="monospace" font-size="16" font-weight="bold">SMART CITY SKY TOWER</text></svg>`
};

export class DemoProvider extends ReconstructionProvider {
  constructor() {
    super('Demo/Local');
    this.demoCaptures = [
      {
        id: 'demo-proj-001',
        name: 'KIET Campus Building Survey',
        status: 'SUCCEEDED',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        model_url: '/demo/build.glb',
        thumbnail_url: SVG_THUMBNAILS.academic,
        metadata: {
          vertices: 48520,
          faces: 92400,
          boundingBox: { x: 28.0, y: 14.0, z: 18.0 },
          estimatedArea: 855.6,
          estimatedHeight: 18.2,
          locationName: 'Delhi NCR, India',
          gps: { latitude: 28.7523, longitude: 77.4988 },
          gsd: '1.2 cm/px',
          surveyDate: '2026-08-28',
          droneModel: 'DJI Mavic 3 Enterprise RTK',
          cameraModel: '20MP Micro 4/3 CMOS',
          flightAltitude: '45 m',
          weather: 'Clear, 12 km/h Wind',
          operator: 'Aero3D Mission Flight Lead'
        }
      },
      {
        id: 'demo-proj-002',
        name: 'Aero3D Industrial Logistics Complex',
        status: 'SUCCEEDED',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        model_url: '/demo/build.glb',
        thumbnail_url: SVG_THUMBNAILS.logistics,
        metadata: {
          vertices: 64200,
          faces: 118900,
          boundingBox: { x: 44.0, y: 12.0, z: 32.0 },
          estimatedArea: 1976.0,
          estimatedHeight: 12.5,
          locationName: 'Noida Tech Sector, India',
          gps: { latitude: 28.5355, longitude: 77.3910 },
          gsd: '0.9 cm/px',
          surveyDate: '2026-08-25',
          droneModel: 'Matrice 300 RTK + Zenmuse P1',
          cameraModel: '45MP Full Frame',
          flightAltitude: '60 m',
          weather: 'Overcast, 8 km/h Wind',
          operator: 'Senior GIS Surveyor'
        }
      },
      {
        id: 'demo-proj-003',
        name: 'Smart City Innovation Sky Tower',
        status: 'SUCCEEDED',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        model_url: '/demo/build.glb',
        thumbnail_url: SVG_THUMBNAILS.tower,
        metadata: {
          vertices: 89400,
          faces: 162100,
          boundingBox: { x: 22.0, y: 28.0, z: 22.0 },
          estimatedArea: 680.0,
          estimatedHeight: 28.0,
          locationName: 'Gurugram Cyber City, India',
          gps: { latitude: 28.4595, longitude: 77.0266 },
          gsd: '0.7 cm/px',
          surveyDate: '2026-08-20',
          droneModel: 'DJI Inspire 3 RTK',
          cameraModel: 'Zenmuse X9-8K Air',
          flightAltitude: '75 m',
          weather: 'Clear, 15 km/h Wind',
          operator: 'Chief Aerospace Inspector'
        }
      }
    ];
  }

  isConfigured() {
    return true; // Demo mode is always ready
  }

  async listCaptures() {
    return this.demoCaptures;
  }

  async getCapture(id) {
    const capture = this.demoCaptures.find(c => c.id === id) || this.demoCaptures[0];
    return { ...capture, isDemo: true };
  }

  async getArtifacts(id) {
    return [
      { type: 'glb', url: '/demo/build.glb', label: '3D GLB Digital Twin Mesh' },
      { type: 'orthomosaic', url: SVG_THUMBNAILS.academic, label: '2D Orthomosaic Map' },
      { type: 'pointcloud', url: null, label: 'LAS/PLY Point Cloud (On Request)' }
    ];
  }

  async exportModel(id, format = 'glb') {
    return {
      status: 'COMPLETED',
      format,
      download_url: '/demo/build.glb',
      isDemo: true,
      message: 'DEMO MODE: Returning sample 3D building asset.'
    };
  }

  async createCapture(options) {
    const newId = `demo-proj-${Date.now()}`;
    const newCapture = {
      id: newId,
      name: options.name || 'New Drone Survey Digital Twin',
      status: 'PROCESSING',
      created_at: new Date().toISOString(),
      model_url: '/demo/build.glb',
      thumbnail_url: SVG_THUMBNAILS.academic,
      metadata: {
        vertices: 48520,
        faces: 92400,
        boundingBox: { x: 30.0, y: 15.0, z: 20.0 },
        estimatedArea: 600.0,
        estimatedHeight: 15.0,
        locationName: options.location || 'Location Unspecified',
        gps: options.latitude ? { latitude: Number(options.latitude), longitude: Number(options.longitude) } : null,
        gsd: options.gsd || '1.5 cm/px',
        surveyDate: options.surveyDate || new Date().toISOString().split('T')[0],
        droneModel: options.droneModel || 'Generic Quadcopter Drone',
        cameraModel: options.cameraModel || '4K Survey Camera',
        flightAltitude: options.flightAltitude || '50 m',
        weather: options.weather || 'Normal',
        operator: options.operator || 'Drone Pilot'
      }
    };

    this.demoCaptures.unshift(newCapture);

    // Auto-transition status from PROCESSING to SUCCEEDED after 4 seconds
    setTimeout(() => {
      const cap = this.demoCaptures.find(c => c.id === newId);
      if (cap) {
        cap.status = 'SUCCEEDED';
      }
    }, 4000);

    return newCapture;
  }
}
