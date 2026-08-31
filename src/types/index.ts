export type ProjectStatus = 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'QUEUED';
export type ProviderType = 'polycam' | 'demo' | 'local';

export interface BoundingBox3D {
  x: number;
  y: number;
  z: number;
}

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface ProjectMetadata {
  vertices?: number;
  faces?: number;
  boundingBox?: BoundingBox3D;
  estimatedArea?: number; // in sq meters
  estimatedHeight?: number; // in meters
  locationName: string;
  gps: GPSCoordinate | null;
  gsd: string; // e.g. "1.2 cm/px"
  surveyDate: string;
  droneModel: string;
  cameraModel: string;
  flightAltitude: string;
  weather: string;
  operator: string;
  accuracyNote?: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  provider: ProviderType;
  created_at: string;
  model_url: string;
  thumbnail_url: string;
  metadata: ProjectMetadata;
  isDemo?: boolean;
}

export interface AIObjectDetection {
  id: string;
  category: 'Building' | 'Roof' | 'Road' | 'Vegetation' | 'Vehicle' | 'Utility Pole' | 'Construction' | 'Water' | 'Structural Anomaly';
  label: string;
  confidence: number; // 0.0 - 1.0
  areaM2: number;
  status: string;
  severity?: 'High' | 'Medium' | 'Low';
  boundingBox?: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

export interface InspectionMarker {
  id: string;
  projectId: string;
  category: 'Structural' | 'Roof' | 'Facade' | 'Road' | 'Vegetation' | 'Anomaly' | 'Other';
  severity: 'High' | 'Medium' | 'Low';
  label: string;
  note: string;
  position: [number, number, number];
  createdAt: string;
  author: string;
  imageUrl?: string;
}

export interface Measurement3D {
  id: string;
  projectId: string;
  type: 'distance' | 'height' | 'area';
  value: number; // calculated raw value in model units
  realValueMeter: number; // calibrated value in meters
  unit: string;
  points: Array<[number, number, number]>;
  timestamp: string;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  services: {
    frontend: { status: string; details: string };
    backend: { status: string; details: string };
    database: { status: string; details: string };
    storage: { status: string; details: string };
    polycam: { status: string; provider: string; details: string };
    aiEngine: { status: string; details: string };
    threeJsEngine: { status: string; details: string };
  };
}
