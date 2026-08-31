import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, InspectionMarker, Measurement3D, SystemHealth } from '../types';
import { api } from '../services/api';

// Initial realistic sample survey datasets for SIH 2026 demonstration
const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'demo-proj-001',
    name: 'KIET Campus Building Survey',
    status: 'SUCCEEDED',
    provider: 'demo',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    model_url: '/demo/build.glb',
    thumbnail_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
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
      operator: 'Aero3D Flight Lead',
      accuracyNote: 'DEMO MODEL — Uncalibrated photogrammetry scale.'
    }
  },
  {
    id: 'demo-proj-002',
    name: 'Aero3D Industrial Logistics Complex',
    status: 'SUCCEEDED',
    provider: 'demo',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    model_url: '/demo/build.glb',
    thumbnail_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
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
      operator: 'Senior GIS Surveyor',
      accuracyNote: 'DEMO MODEL — Uncalibrated photogrammetry scale.'
    }
  },
  {
    id: 'demo-proj-003',
    name: 'Smart City Innovation Sky Tower',
    status: 'SUCCEEDED',
    provider: 'demo',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    model_url: '/demo/build.glb',
    thumbnail_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
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
      operator: 'Chief Aerospace Inspector',
      accuracyNote: 'DEMO MODEL — Uncalibrated photogrammetry scale.'
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
    note: 'Visible 2.4mm surface hairline crack near top beam column junction. Thermal imaging recommended.',
    position: [-3.8, 8.5, -9.9],
    createdAt: '2026-08-29 10:30 AM',
    author: 'AI Auto-Detector'
  },
  {
    id: 'mark-102',
    projectId: 'demo-proj-001',
    category: 'Roof',
    severity: 'Medium',
    label: 'Rooftop Waterproof Seam Anomaly',
    note: 'Possible membrane degradation near HVAC Unit #1 discharge duct.',
    position: [-7.5, 14.5, -4.2],
    createdAt: '2026-08-29 11:15 AM',
    author: 'Drone Inspector'
  },
  {
    id: 'mark-103',
    projectId: 'demo-proj-001',
    category: 'Facade',
    severity: 'Low',
    label: 'Window Trim Paint Discoloration',
    note: 'Minor exterior weathering on 2nd floor east elevation.',
    position: [6.8, 7.2, 7.1],
    createdAt: '2026-08-30 02:45 PM',
    author: 'Maintenance Lead'
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
  const [scaleFactor, setScaleFactor] = useState<number>(1.0); // 1 model unit = 1 meter default
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [providerStatus, setProviderStatus] = useState({
    mode: 'demo',
    name: 'Demo/Local Provider',
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
        setActiveProject(backendProjects[0]);
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
    setProjects(prev => [newProject, ...prev]);
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
