import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, InspectionMarker, Measurement3D, SystemHealth } from '../types';
import { api } from '../services/api';

const SVG_THUMBNAILS = {
  academic: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="150" y="120" width="300" height="180" rx="6" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><rect x="180" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><rect x="240" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><rect x="300" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><rect x="360" y="150" width="40" height="50" fill="%2338bdf8" opacity="0.8"/><polygon points="250,120 300,70 350,120" fill="%230284c7"/><text x="300" y="340" text-anchor="middle" fill="%2338bdf8" font-family="monospace" font-size="16" font-weight="bold">KIET CAMPUS DIGITAL TWIN</text></svg>`,
  taj: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="180" y="100" width="240" height="200" rx="8" fill="%230284c7" opacity="0.3" stroke="%2338bdf8" stroke-width="2"/><polygon points="300,40 220,100 380,100" fill="%2338bdf8" opacity="0.6"/><text x="300" y="340" text-anchor="middle" fill="%2338bdf8" font-family="monospace" font-size="16" font-weight="bold">TAJ MAHAL DIGITAL TWIN</text></svg>`,
  city: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="80" y="140" width="440" height="160" rx="6" fill="%230f172a" stroke="%2334d399" stroke-width="2"/><text x="300" y="340" text-anchor="middle" fill="%2334d399" font-family="monospace" font-size="16" font-weight="bold">RUINED CITY DIGITAL TWIN</text></svg>`
};

const DEFAULT_PROJECTS: Project[] = [
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

const INITIAL_MARKERS: InspectionMarker[] = [
  {
    id: 'mark-101',
    projectId: 'demo-proj-001',
    category: 'Structural',
    severity: 'High',
    label: 'North Wall Structural Crack',
    note: 'Visible 2.4mm surface hairline crack near top beam column junction.',
    position: [-3.8, 8.5, -9.9],
    createdAt: '2026-08-29 10:30 AM',
    author: 'AI Inspector'
  }
];

interface ProjectContextType {
  projects: Project[];
  activeProject: Project;
  setActiveProject: (project: Project) => void;
  markers: InspectionMarker[];
  addMarker: (marker: Omit<InspectionMarker, 'id' | 'createdAt'>) => void;
  deleteMarker: (id: string) => void;
  measurements: Measurement3D[];
  addMeasurement: (meas: Omit<Measurement3D, 'id' | 'timestamp'>) => void;
  clearMeasurements: () => void;
  scaleFactor: number;
  setScaleFactor: (factor: number) => void;
  isCalibrated: boolean;
  providerStatus: { mode: string; name: string; configured: boolean; message: string };
  health: SystemHealth | null;
  refreshData: () => Promise<void>;
  addProject: (newProject: Project) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project>(DEFAULT_PROJECTS[0]);
  const [markers, setMarkers] = useState<InspectionMarker[]>(INITIAL_MARKERS);
  const [measurements, setMeasurements] = useState<Measurement3D[]>([]);
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [providerStatus, setProviderStatus] = useState({
    mode: 'demo',
    name: 'Demo/Local Engine',
    configured: false,
    message: 'Running in Demo Mode.'
  });
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const refreshData = async () => {
    try {
      const pStatus = await api.getProviderStatus();
      setProviderStatus(pStatus);

      const sysHealth = await api.getHealth();
      setHealth(sysHealth);

      const backendProjects = await api.getProjects();
      if (backendProjects && backendProjects.length > 0) {
        setProjects(backendProjects);
        setActiveProject(prev => {
          const match = backendProjects.find(p => p.id === prev?.id);
          return match || backendProjects[0];
        });
      }
    } catch (err) {
      console.warn('Backend API refresh notice: Using local state');
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addMarker = (markerData: Omit<InspectionMarker, 'id' | 'createdAt'>) => {
    const newMarker: InspectionMarker = {
      ...markerData,
      id: `mark-${Date.now()}`,
      createdAt: new Date().toLocaleString()
    };
    setMarkers(prev => [newMarker, ...prev]);
  };

  const deleteMarker = (id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  const addMeasurement = (measData: Omit<Measurement3D, 'id' | 'timestamp'>) => {
    const newMeas: Measurement3D = {
      ...measData,
      id: `meas-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setMeasurements(prev => [...prev, newMeas]);
  };

  const clearMeasurements = () => {
    setMeasurements([]);
  };

  const handleSetScaleFactor = (factor: number) => {
    setScaleFactor(factor);
    setIsCalibrated(true);
  };

  const addProject = (newProject: Project) => {
    setProjects(prev => {
      const exists = prev.some(p => p.id === newProject.id);
      return exists ? prev.map(p => p.id === newProject.id ? newProject : p) : [newProject, ...prev];
    });
    setActiveProject(newProject);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        markers,
        addMarker,
        deleteMarker,
        measurements,
        addMeasurement,
        clearMeasurements,
        scaleFactor,
        setScaleFactor: handleSetScaleFactor,
        isCalibrated,
        providerStatus,
        health,
        refreshData,
        addProject
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjects must be used within a ProjectProvider');
  return context;
};
