import { ReconstructionProvider } from './ReconstructionProvider.js';

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
        thumbnail_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=600&q=80',
        metadata: {
          vertices: 48520,
          faces: 92400,
          boundingBox: { x: 34.5, y: 18.2, z: 24.8 },
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
        thumbnail_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80',
        metadata: {
          vertices: 64200,
          faces: 118900,
          boundingBox: { x: 52.0, y: 22.5, z: 38.0 },
          estimatedArea: 1976.0,
          estimatedHeight: 22.5,
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
      { type: 'orthomosaic', url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80', label: '2D Orthomosaic Map' },
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
      thumbnail_url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80',
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
    return newCapture;
  }
}
