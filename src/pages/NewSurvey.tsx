import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  File,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useProjects } from '../store/ProjectContext';
import { api } from '../services/api';

export const NewSurvey: React.FC = () => {
  const navigate = useNavigate();
  const { addProject, setActiveProject, providerStatus } = useProjects();

  const [step, setStep] = useState<number>(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Metadata form state
  const [formData, setFormData] = useState({
    projectName: '',
    location: '',
    latitude: '27.1751',
    longitude: '78.0421',
    surveyDate: new Date().toISOString().split('T')[0],
    description: '',
    droneModel: 'DJI Mavic 3 Enterprise RTK',
    cameraModel: '20MP Micro 4/3 CMOS',
    flightAltitude: '45 m',
    gsd: '1.2 cm/px',
    weather: 'Clear, 10 km/h Wind',
    operator: 'Aero3D Flight Lead'
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateUniqueMetadata = (name: string) => {
    const timestamp = Date.now();
    const seed = timestamp % 999;
    const widthVal = 24 + (seed % 20);
    const heightVal = 12 + (seed % 18);
    const depthVal = 20 + (seed % 20);
    const verticesVal = 42000 + (seed * 90);
    const facesVal = 84000 + (seed * 180);
    const areaVal = Math.round(widthVal * depthVal);

    return {
      vertices: verticesVal,
      faces: facesVal,
      boundingBox: { x: widthVal, y: heightVal, z: depthVal },
      estimatedArea: areaVal,
      estimatedHeight: heightVal,
      locationName: formData.location || 'Agra, Uttar Pradesh, India',
      gps: { latitude: Number(formData.latitude) || 27.1751, longitude: Number(formData.longitude) || 78.0421 },
      gsd: formData.gsd || '1.2 cm/px',
      surveyDate: formData.surveyDate || new Date().toISOString().split('T')[0],
      droneModel: formData.droneModel || 'DJI Mavic 3 Enterprise RTK',
      cameraModel: formData.cameraModel || '20MP Micro 4/3 CMOS',
      flightAltitude: formData.flightAltitude || '45 m',
      weather: formData.weather || 'Clear Sky',
      operator: formData.operator || 'Aero3D Inspector Pilot'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formPayload = new FormData();
      selectedFiles.forEach(file => formPayload.append('files', file));
      Object.entries(formData).forEach(([key, val]) => formPayload.append(key, val));

      const response = await api.createSurvey(formPayload);
      if (response && response.project) {
        addProject(response.project);
        setActiveProject(response.project);
        navigate(`/processing/${response.project.id}`);
      } else {
        const glbFile = selectedFiles.find(f => f.name.endsWith('.glb') || f.name.endsWith('.gltf'));
        const modelUrl = glbFile ? URL.createObjectURL(glbFile) : '/demo/build.glb';
        const newProjId = `proj-${Date.now()}`;

        const mockNewProj = {
          id: newProjId,
          name: formData.projectName || 'Taj Mahal 3D Digital Twin Survey',
          status: 'SUCCEEDED' as const,
          provider: (providerStatus?.mode || 'demo') as any,
          created_at: new Date().toISOString(),
          model_url: modelUrl,
          thumbnail_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="180" y="100" width="240" height="200" rx="8" fill="%230284c7" opacity="0.3" stroke="%2338bdf8" stroke-width="2"/><polygon points="300,40 220,100 380,100" fill="%2338bdf8" opacity="0.6"/><text x="300" y="340" text-anchor="middle" fill="%2338bdf8" font-family="monospace" font-size="16" font-weight="bold">TAJ MAHAL DIGITAL TWIN</text></svg>',
          isDemo: true,
          metadata: generateUniqueMetadata(formData.projectName)
        };

        addProject(mockNewProj);
        setActiveProject(mockNewProj);
        navigate(`/processing/${newProjId}`);
      }
    } catch (_err) {
      const glbFile = selectedFiles.find(f => f.name.endsWith('.glb') || f.name.endsWith('.gltf'));
      const modelUrl = glbFile ? URL.createObjectURL(glbFile) : '/demo/build.glb';
      const newProjId = `proj-${Date.now()}`;

      const mockNewProj = {
        id: newProjId,
        name: formData.projectName || 'Taj Mahal 3D Digital Twin Survey',
        status: 'SUCCEEDED' as const,
        provider: 'demo' as const,
        created_at: new Date().toISOString(),
        model_url: modelUrl,
        thumbnail_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23060913"/><rect x="180" y="100" width="240" height="200" rx="8" fill="%230284c7" opacity="0.3" stroke="%2338bdf8" stroke-width="2"/><polygon points="300,40 220,100 380,100" fill="%2338bdf8" opacity="0.6"/><text x="300" y="340" text-anchor="middle" fill="%2338bdf8" font-family="monospace" font-size="16" font-weight="bold">TAJ MAHAL DIGITAL TWIN</text></svg>',
        isDemo: true,
        metadata: generateUniqueMetadata(formData.projectName)
      };

      addProject(mockNewProj);
      setActiveProject(mockNewProj);
      navigate(`/processing/${newProjId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title="Create New Drone Survey" />

        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between p-4 rounded-xl glass-panel border border-slate-800 font-mono text-xs">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-sky-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'bg-sky-500/20 border-sky-400' : 'border-slate-700'}`}>01</span>
              <span>Upload Drone Data</span>
            </div>
            <div className="w-8 h-px bg-slate-800 hidden sm:block" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-sky-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'bg-sky-500/20 border-sky-400' : 'border-slate-700'}`}>02</span>
              <span>Metadata & Location</span>
            </div>
            <div className="w-8 h-px bg-slate-800 hidden sm:block" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-sky-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'bg-sky-500/20 border-sky-400' : 'border-slate-700'}`}>03</span>
              <span>Drone Equipment</span>
            </div>
            <div className="w-8 h-px bg-slate-800 hidden sm:block" />
            <div className={`flex items-center gap-2 ${step >= 4 ? 'text-sky-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 4 ? 'bg-sky-500/20 border-sky-400' : 'border-slate-700'}`}>04</span>
              <span>Reconstruction Review</span>
            </div>
          </div>

          {/* Step Form Container */}
          <form onSubmit={handleSubmit} className="p-6 rounded-2xl glass-panel-elevated border border-slate-700/80 shadow-2xl space-y-6">
            
            {/* Step 1: Upload Drone Data */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Upload Drone Footage or 3D Assets</h3>
                  <p className="text-xs text-slate-400">
                    Drop flight videos (MP4, MOV), overlapping image zip archives, or existing 3D models (GLB, GLTF, OBJ, PLY).
                  </p>
                </div>

                {/* Drag and Drop Box */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`p-8 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
                    isDragging ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700 bg-aerospace-950/60 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept=".mp4,.mov,.jpg,.jpeg,.png,.zip,.glb,.gltf,.obj,.ply"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="drone-file-upload"
                  />
                  <label htmlFor="drone-file-upload" className="cursor-pointer space-y-2 block">
                    <UploadCloud className="w-10 h-10 text-sky-400 mx-auto animate-bounce" />
                    <p className="font-semibold text-sm text-slate-200">
                      Drop drone footage or images here, or <span className="text-sky-400 underline">browse files</span>
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      Supported: MP4, MOV, JPG, PNG, ZIP archives, GLB, GLTF, OBJ (Max 250MB)
                    </p>
                  </label>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono text-slate-400 uppercase">Selected Files ({selectedFiles.length})</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-aerospace-950 border border-slate-800 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <File className="w-4 h-4 text-sky-400 shrink-0" />
                            <span className="truncate text-slate-200 font-mono">{file.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                          </div>
                          <button type="button" onClick={() => removeFile(idx)} className="text-slate-400 hover:text-rose-400 p-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Metadata */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Survey Metadata & Location</h3>
                  <p className="text-xs text-slate-400">Define target survey location and site coordinates.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Project Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.projectName}
                      onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                      placeholder="e.g. Taj Mahal 3D Digital Twin Survey"
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Location Name</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Agra, Uttar Pradesh, India"
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">GPS Latitude (°N)</label>
                    <input
                      type="text"
                      value={formData.latitude}
                      onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">GPS Longitude (°E)</label>
                    <input
                      type="text"
                      value={formData.longitude}
                      onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Equipment */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Equipment & Flight Specifications</h3>
                  <p className="text-xs text-slate-400">Drone sensor parameters for photogrammetry calibration.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Drone Model</label>
                    <input
                      type="text"
                      value={formData.droneModel}
                      onChange={e => setFormData({ ...formData, droneModel: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Camera Sensor</label>
                    <input
                      type="text"
                      value={formData.cameraModel}
                      onChange={e => setFormData({ ...formData, cameraModel: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Flight Altitude</label>
                    <input
                      type="text"
                      value={formData.flightAltitude}
                      onChange={e => setFormData({ ...formData, flightAltitude: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Target GSD</label>
                    <input
                      type="text"
                      value={formData.gsd}
                      onChange={e => setFormData({ ...formData, gsd: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Reconstruction Review */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Review & Initiate Reconstruction</h3>
                  <p className="text-xs text-slate-400">Confirm parameters before executing photogrammetry pipeline.</p>
                </div>

                <div className="p-4 rounded-xl bg-aerospace-950/80 border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Reconstruction Engine:</span>
                    <span className="font-mono font-bold text-sky-300">{(providerStatus?.mode || 'demo').toUpperCase()} PROVIDER</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Project Title:</span>
                    <span className="font-semibold text-slate-200">{formData.projectName || 'Taj Mahal 3D Digital Twin Survey'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Drone Hardware:</span>
                    <span className="text-slate-200">{formData.droneModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uploaded Assets:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{selectedFiles.length || 1} File(s)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Nav Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-aerospace-850 hover:bg-aerospace-800 text-slate-300 text-xs font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-xs shadow-md"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-aerospace-950 font-bold text-xs shadow-lg transition-all"
                >
                  {loading ? (
                    <span>Processing Ingestion...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Execute 3D Reconstruction</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </form>

        </main>
      </div>
    </div>
  );
};
