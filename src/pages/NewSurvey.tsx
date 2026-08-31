import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  File,
  CheckCircle2,
  AlertCircle,
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
  const [validationError, setValidationError] = useState<string>('');

  // Metadata form state without fake defaults
  const [formData, setFormData] = useState({
    projectName: '',
    location: '',
    latitude: '',
    longitude: '',
    surveyDate: new Date().toISOString().split('T')[0],
    description: '',
    droneModel: '',
    cameraModel: '',
    flightAltitude: '',
    gsd: '',
    weather: '',
    operator: ''
  });

  const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.jpg', '.jpeg', '.png', '.zip', '.glb', '.gltf', '.obj', '.ply'];
  const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB

  const validateAndAddFiles = (files: File[]) => {
    setValidationError('');
    const valid: File[] = [];

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setValidationError(`File "${file.name}" has an unsupported format. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setValidationError(`File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed 250 MB size.`);
        return;
      }
      valid.push(file);
    }

    setSelectedFiles(prev => [...prev, ...valid]);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    if (step === 1 && selectedFiles.length === 0) {
      setValidationError('Please upload at least one drone video, image, image archive, or 3D model.');
      return;
    }
    setValidationError('');
    setStep(s => Math.min(4, s + 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setValidationError('Please upload at least one drone video, image, image archive, or 3D model.');
      setStep(1);
      return;
    }

    setLoading(true);
    setValidationError('');

    try {
      const formPayload = new FormData();
      selectedFiles.forEach(file => formPayload.append('files', file));
      Object.entries(formData).forEach(([key, val]) => formPayload.append(key, val));

      const response = await api.createSurvey(formPayload);
      if (response && response.project) {
        const proj = response.project;
        addProject(proj);
        setActiveProject(proj);

        // If GLB 3D model uploaded directly, navigate directly to viewer
        if (proj.inputType === 'model' || selectedFiles.some(f => f.name.endsWith('.glb') || f.name.endsWith('.gltf'))) {
          navigate(`/viewer/${proj.id}`);
        } else {
          // Trigger asynchronous photogrammetry pipeline job
          api.processProject(proj.id).catch(() => {});
          navigate(`/processing/${proj.id}`);
        }
      } else {
        throw new Error('Project creation failed on backend server.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to upload and create survey project.');
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

          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Step Form Container */}
          <form onSubmit={handleSubmit} className="p-6 rounded-2xl glass-panel-elevated border border-slate-700/80 shadow-2xl space-y-6">
            
            {/* Step 1: Upload Drone Data */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Upload Drone Footage or 3D Assets *</h3>
                  <p className="text-xs text-slate-400">
                    Drop flight videos (MP4, MOV, MKV), overlapping image archives (JPG, PNG, ZIP), or existing 3D models (GLB, GLTF, OBJ, PLY).
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
                    accept=".mp4,.mov,.mkv,.jpg,.jpeg,.png,.zip,.glb,.gltf,.obj,.ply"
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
                      Supported: MP4, MOV, MKV, JPG, PNG, ZIP, GLB, GLTF, OBJ (Max 250 MB per file)
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
                  <p className="text-xs text-slate-400">Define survey location name and optional site coordinates.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Project Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.projectName}
                      onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                      placeholder="e.g. Industrial Complex Drone Survey"
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Location Name</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Survey Site Location"
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">GPS Latitude (°N) (Optional)</label>
                    <input
                      type="text"
                      value={formData.latitude}
                      onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="Leave empty if GPS unavailable"
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">GPS Longitude (°E) (Optional)</label>
                    <input
                      type="text"
                      value={formData.longitude}
                      onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="Leave empty if GPS unavailable"
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
                  <h3 className="text-lg font-bold text-slate-100">Equipment & Flight Specifications (Optional)</h3>
                  <p className="text-xs text-slate-400">Specify hardware sensors or leave blank.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Drone Hardware Model</label>
                    <input
                      type="text"
                      value={formData.droneModel}
                      onChange={e => setFormData({ ...formData, droneModel: e.target.value })}
                      placeholder="e.g. DJI Quadcopter / Unspecified"
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Camera Sensor Specs</label>
                    <input
                      type="text"
                      value={formData.cameraModel}
                      onChange={e => setFormData({ ...formData, cameraModel: e.target.value })}
                      placeholder="e.g. 20MP / 4K RGB Camera"
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Flight Altitude</label>
                    <input
                      type="text"
                      value={formData.flightAltitude}
                      onChange={e => setFormData({ ...formData, flightAltitude: e.target.value })}
                      placeholder="e.g. 50 m"
                      className="w-full p-2.5 rounded-lg bg-aerospace-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Target Ground Sample Distance (GSD)</label>
                    <input
                      type="text"
                      value={formData.gsd}
                      onChange={e => setFormData({ ...formData, gsd: e.target.value })}
                      placeholder="e.g. 1.0 cm/px"
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
                    <span className="font-semibold text-slate-200">{formData.projectName || 'Uploaded Drone Survey'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Drone Hardware:</span>
                    <span className="text-slate-200">{formData.droneModel || 'Not Specified'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">GPS Coordinates:</span>
                    <span className="font-mono text-slate-300">
                      {formData.latitude && formData.longitude ? `${formData.latitude}°N, ${formData.longitude}°E` : 'GPS Unavailable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uploaded Files:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{selectedFiles.length} File(s)</span>
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
                  onClick={handleNextStep}
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
                    <span>Uploading Drone Data...</span>
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
