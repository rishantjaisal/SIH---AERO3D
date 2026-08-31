import React from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { GISMap } from '../components/map/GISMap';
import { ThreeCanvas } from '../components/viewer/ThreeCanvas';
import { useProjects } from '../store/ProjectContext';

export const MapPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, activeProject, markers, measurements, scaleFactor, isCalibrated } = useProjects();
  const currentProj = (projects || []).find(p => p && p.id === projectId) || activeProject || projects[0];

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title="GIS Spatial Mapping & 3D Twin Sync" />

        {/* Split Screen Container */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
          
          {/* Left Pane: Interactive GIS Leaflet Map */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-800 relative">
            <GISMap
              gps={currentProj?.metadata?.gps || null}
              locationName={currentProj?.metadata?.locationName || 'Delhi NCR, India'}
              projectName={currentProj?.name || 'KIET Campus Survey'}
            />
          </div>

          {/* Right Pane: 3D WebGL Canvas */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
            <ThreeCanvas
              activeTool="orbit"
              renderMode="textured"
              showGrid={true}
              cameraPreset="default"
              markers={markers}
              onAddMarkerAtPoint={() => {}}
              measurements={measurements}
              onAddMeasurement={() => {}}
              scaleFactor={scaleFactor}
              isCalibrated={isCalibrated}
              projectId={currentProj?.id || 'demo-proj-001'}
              project={currentProj}
            />
          </div>

        </div>
      </div>
    </div>
  );
};
