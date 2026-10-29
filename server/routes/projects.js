import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ReconstructionFactory } from '../providers/ReconstructionFactory.js';
import { jobManager } from '../services/JobManager.js';
import { validateMediaFile, extractFramesFromVideo, isFFmpegAvailable } from '../utils/ffmpegExtractor.js';
import { ColmapProvider } from '../providers/ColmapProvider.js';
import { PolycamProvider } from '../providers/PolycamProvider.js';
import { getEngine, getFrameRate, isValidProjectId } from '../config.js';
import { ProjectStore, isReservedProjectId } from '../services/ProjectStore.js';

const router = express.Router();

// Reject any :id / :projectId that is not a plain path segment (blocks ../ traversal)
router.param('id', (req, res, next, id) => {
  if (!isValidProjectId(id)) {
    return res.status(400).json({ error: true, message: 'Invalid project id.' });
  }
  next();
});
router.param('projectId', (req, res, next, id) => {
  if (!isValidProjectId(id)) {
    return res.status(400).json({ error: true, message: 'Invalid project id.' });
  }
  next();
});

/** Strip any directory part and unsafe characters from a client-supplied file name. */
function safeFileName(name) {
  const base = path.basename(String(name || 'file')).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base || 'file';
}

// File upload configuration
const uploadDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
  }
});

// Only formats the pipeline can really consume. (.zip/.obj/.ply/.gltf are not processed, so they are rejected up front
// instead of being accepted and silently ignored.)
const SUPPORTED_EXTS = ['.mp4', '.mov', '.mkv', '.jpg', '.jpeg', '.png', '.glb'];

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024, files: 50 }, // 250MB per file, 50 files
  fileFilter: (req, file, cb) => {
    try {
      // Size is enforced by multer's `limits`; here we check the extension.
      validateMediaFile(file.path, file.originalname, 0);
      const ext = path.extname(file.originalname).toLowerCase();
      if (!SUPPORTED_EXTS.includes(ext)) {
        throw new Error(`${ext || 'This'} files are not supported yet. Supported: ${SUPPORTED_EXTS.join(', ')}`);
      }
      cb(null, true);
    } catch (err) {
      const rejection = new Error(err.message);
      rejection.status = 400;
      rejection.code = 'UNSUPPORTED_FILE';
      cb(rejection);
    }
  }
});

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const provider = ReconstructionFactory.getProvider();
    const projects = await provider.listCaptures();
    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const provider = ReconstructionFactory.getProvider();
    const project = await provider.getCapture(req.params.id);
    const job = jobManager.getJobByProject(req.params.id);

    res.json({
      success: true,
      project: {
        ...project,
        processingJobId: job ? job.id : null,
        jobStatus: job ? job.status : project.status
      }
    });
  } catch (error) {
    const status = error.status === 404 || !error.status ? 404 : error.status;
    res.status(status).json({ error: true, message: status === 404 ? 'Project not found' : error.message });
  }
});

// DELETE /api/projects/:id - remove only this project's own storage folder (never shared demo assets)
router.delete('/:id', (req, res) => {
  try {
    const projectId = req.params.id;
    const projectsRoot = path.resolve(process.cwd(), 'storage', 'projects');
    const projectDir = path.resolve(projectsRoot, projectId);

    if (path.dirname(projectDir) !== projectsRoot) {
      return res.status(400).json({ error: true, message: 'Invalid project id.' });
    }

    if (jobManager.getActiveJobByProject(projectId)) {
      return res.status(409).json({ error: true, message: 'A reconstruction job is still running for this project. Wait for it to finish.' });
    }

    const removedFiles = ProjectStore.remove(projectId);
    const removedJobs = jobManager.deleteByProject(projectId);
    res.json({ success: true, id: projectId, removedFiles, removedJobs });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// GET /api/projects/:id/model - Binary GLB stream endpoint
router.get('/:id/model', (req, res) => {
  const projectId = req.params.id;

  // Cross-origin policy for WebGL loaders; CORS itself follows CORS_ORIGIN (no wildcard for user uploads)
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  const sendModel = file => {
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.sendFile(file);
  };

  const projectStorageDir = path.join(process.cwd(), 'storage', 'projects', projectId);
  const customModelPath = path.join(projectStorageDir, 'output', 'model.glb');
  const demoBuildingPath = path.join(process.cwd(), 'public', 'demo', 'build.glb');
  const tajMahalPath = path.join(process.cwd(), 'public', 'demo', 'taj_mahal_3d_model.glb');
  const ruinedCityPath = path.join(process.cwd(), 'public', 'demo', 'ruined_city_free_5.glb');

  // 1. If project has explicit generated/uploaded model.glb in output folder, serve it
  if (fs.existsSync(customModelPath)) {
    return sendModel(customModelPath);
  }

  // 2. Specific demo project ID routes
  if (projectId === 'demo-proj-001' && fs.existsSync(demoBuildingPath)) {
    return sendModel(demoBuildingPath);
  }
  if (projectId === 'demo-proj-002' && fs.existsSync(tajMahalPath)) {
    return sendModel(tajMahalPath);
  }
  if (projectId === 'demo-proj-003' && fs.existsSync(ruinedCityPath)) {
    return sendModel(ruinedCityPath);
  }

  // 3. For any other real project with no output model.glb, return 404. DO NOT copy/serve fake fallback build.glb!
  res.status(404).json({ error: true, message: `3D model binary output asset not found for project ${projectId}.` });
});

// POST /api/projects/upload & /api/projects/:projectId/upload
const handleUploadRoute = async (req, res) => {
  const files = req.files || [];
  const dropTempFiles = () => files.forEach(f => fs.rmSync(f.path, { force: true }));
  let createdDir = null;

  try {
    const projectId = req.params.projectId || req.body.projectId || `aero-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const metadata = req.body || {};

    if (!isValidProjectId(projectId)) {
      dropTempFiles();
      return res.status(400).json({ error: true, message: 'Invalid project id.' });
    }

    // The bundled samples are shared by everyone; uploads must never write into them (the model route prefers
    // an uploaded output/model.glb over the sample, so this would replace the sample for all users).
    if (isReservedProjectId(projectId)) {
      dropTempFiles();
      return res.status(403).json({ error: true, message: 'This project id is reserved for a bundled sample project.' });
    }

    if (files.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Please upload at least one drone video, image, or .glb 3D model.'
      });
    }

    const projectStorageDir = path.join(process.cwd(), 'storage', 'projects', projectId);
    const inputDir = path.join(projectStorageDir, 'input');
    const framesDir = path.join(projectStorageDir, 'frames');
    const outputDir = path.join(projectStorageDir, 'output');

    if (!fs.existsSync(projectStorageDir)) createdDir = projectStorageDir;
    [projectStorageDir, inputDir, framesDir, outputDir].forEach(d => {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    });

    let uploadedGlbName = null;
    let primaryVideoFile = null;

    files.forEach(file => {
      const ext = path.extname(file.originalname).toLowerCase();
      const cleanName = safeFileName(file.originalname);
      const destPath = path.join(inputDir, cleanName);
      fs.copyFileSync(file.path, destPath);

      if (ext === '.glb') {
        uploadedGlbName = file.originalname;
        fs.copyFileSync(file.path, path.join(outputDir, 'model.glb'));
      } else if (['.mp4', '.mov', '.mkv'].includes(ext)) {
        primaryVideoFile = destPath;
      } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        fs.copyFileSync(file.path, path.join(framesDir, cleanName));
      }
    });
    dropTempFiles(); // the temp copies now live in the project folder

    const isGlbModel = !!uploadedGlbName;
    const isVideo = !!primaryVideoFile;

    const gpsLat = parseFloat(metadata.latitude);
    const gpsLng = parseFloat(metadata.longitude);
    const hasGps = Number.isFinite(gpsLat) && Number.isFinite(gpsLng) && Math.abs(gpsLat) <= 90 && Math.abs(gpsLng) <= 180;
    const clip = v => String(v ?? '').slice(0, 200);

    const provider = ReconstructionFactory.getProvider();
    const newProject = await provider.createCapture({
      projectId,
      name: clip(metadata.projectName) || (isGlbModel ? 'Uploaded 3D Model' : isVideo ? 'Drone Flight Video Survey' : 'Drone Photogrammetry Survey'),
      location: clip(metadata.location),
      latitude: hasGps ? gpsLat : null,
      longitude: hasGps ? gpsLng : null,
      gsd: clip(metadata.gsd),
      surveyDate: clip(metadata.surveyDate) || new Date().toISOString().split('T')[0],
      droneModel: clip(metadata.droneModel),
      cameraModel: clip(metadata.cameraModel),
      flightAltitude: clip(metadata.flightAltitude),
      weather: clip(metadata.weather),
      operator: clip(metadata.operator),
      model_url: `/api/projects/${projectId}/model`,
      fileCount: files.length,
      status: isGlbModel ? 'SUCCEEDED' : 'QUEUED'
    });

    // Persist the input description with the record so it survives restarts
    const saved = ProjectStore.update(projectId, {
      status: isGlbModel ? 'SUCCEEDED' : 'QUEUED',
      inputType: isGlbModel ? 'model' : isVideo ? 'video' : 'photos',
      inputFile: uploadedGlbName || (primaryVideoFile ? path.basename(primaryVideoFile) : files[0]?.originalname)
    }) || newProject;

    res.status(201).json({
      success: true,
      message: isGlbModel ? '3D GLB model uploaded successfully.' : 'Drone survey files ingested. Project created successfully.',
      project: saved,
      filesUploaded: files.map(f => f.filename)
    });
  } catch (error) {
    dropTempFiles();
    if (createdDir) fs.rmSync(createdDir, { recursive: true, force: true });
    res.status(error.status || 500).json({ error: true, message: error.message });
  }
};

router.post('/upload', upload.array('files', 50), handleUploadRoute);
router.post('/:projectId/upload', upload.array('files', 50), handleUploadRoute);

/**
 * Background reconstruction run. Nothing here is simulated: frame extraction really runs FFmpeg, and an engine
 * that cannot produce a model fails the job with a clear reason instead of reporting a fake success.
 */
async function runReconstruction(job, projectId, activeEngine, fps) {
  const projectDir = path.join(process.cwd(), 'storage', 'projects', projectId);
  const inputDir = path.join(projectDir, 'input');
  const framesDir = path.join(projectDir, 'frames');
  const targetGlb = path.join(projectDir, 'output', 'model.glb');

  const fail = (stage, message, details) => {
    jobManager.failJob(job.id, stage, message, { message: details });
    ProjectStore.update(projectId, { status: 'FAILED' });
  };

  try {
    ProjectStore.update(projectId, { status: 'PROCESSING' });

    // A model that is already present (e.g. an uploaded .glb) needs no reconstruction
    if (fs.existsSync(targetGlb)) {
      jobManager.updateJob(job.id, {
        status: 'completed', stage: 'COMPLETED', stageLabel: '3D Model Ready', progress: 100,
        message: 'A 3D model is already available for this project; no reconstruction was needed.'
      });
      ProjectStore.update(projectId, { status: 'SUCCEEDED' });
      return;
    }

    if (activeEngine === 'colmap' && !new ColmapProvider().isConfigured()) {
      return fail('ENGINE_UNAVAILABLE',
        'COLMAP is not available on this machine. Install/configure COLMAP or set PHOTOGRAMMETRY_ENGINE=demo.',
        'Executable not found at COLMAP_PATH or blocked by OS Device Guard.');
    }
    if (activeEngine === 'polycam' && !new PolycamProvider().isConfigured()) {
      return fail('ENGINE_UNAVAILABLE', 'POLYCAM_API_TOKEN is not configured on the server.', 'Set POLYCAM_API_TOKEN in the server environment.');
    }

    // Stage 1: real frame extraction (video) or frame counting (photos)
    let videoPath = null;
    if (fs.existsSync(inputDir)) {
      const vid = fs.readdirSync(inputDir).find(f => ['.mp4', '.mov', '.mkv'].includes(path.extname(f).toLowerCase()));
      if (vid) videoPath = path.join(inputDir, vid);
    }
    if (videoPath && !isFFmpegAvailable()) {
      return fail('FRAME_EXTRACTION', 'FFmpeg is not installed on the server, so video frames cannot be extracted.', 'Install FFmpeg and add it to PATH.');
    }

    jobManager.updateJob(job.id, {
      status: 'processing', stage: 'FRAME_EXTRACTION', stageLabel: 'Extracting Video Frames', progress: 20,
      message: videoPath ? `Extracting frames at ${fps} FPS with FFmpeg...` : 'Counting uploaded photos...'
    });

    let frameCount = 0;
    if (videoPath) {
      frameCount = (await extractFramesFromVideo(videoPath, framesDir, fps)).frameCount;
    } else if (fs.existsSync(framesDir)) {
      frameCount = fs.readdirSync(framesDir).filter(f => ['.jpg', '.jpeg', '.png'].includes(path.extname(f).toLowerCase())).length;
    }

    if (frameCount === 0) {
      return fail('FRAME_EXTRACTION', 'No usable frames or photos were found for this project.', 'Upload a video or overlapping photos.');
    }

    jobManager.updateJob(job.id, {
      stage: 'FRAME_EXTRACTION', progress: 50, message: `${frameCount} frames ready for photogrammetry.`,
      qualityMetrics: { inputImages: frameCount }
    });

    // Stage 2: reconstruction. No engine in this build can run it, so say so instead of faking progress.
    const reason = {
      colmap: 'COLMAP is installed, but running its reconstruction pipeline from this server is not implemented yet. Frames were extracted successfully.',
      polycam: 'Submitting frames to Polycam from this server is not implemented yet. Reconstruct in Polycam and upload the resulting .glb.',
      demo: 'The demo engine does not reconstruct uploaded footage. Upload a .glb model, or configure a real engine (COLMAP / Polycam).'
    }[activeEngine] || 'This reconstruction engine is not supported.';
    return fail('RECONSTRUCTION_UNAVAILABLE', reason, `${frameCount} frames were extracted and kept in the project folder.`);
  } catch (err) {
    fail('FAILED', err.message || 'Reconstruction pipeline error', 'See server logs for details.');
  }
}

// POST /api/projects/:id/process - Asynchronous reconstruction job trigger
router.post('/:id/process', async (req, res) => {
  const projectId = req.params.id;

  if (isReservedProjectId(projectId)) {
    return res.status(400).json({ error: true, message: 'Bundled sample projects are already reconstructed.' });
  }
  if (!ProjectStore.get(projectId)) {
    return res.status(404).json({ error: true, message: 'Project not found. Upload files first.' });
  }
  const running = jobManager.getActiveJobByProject(projectId);
  if (running) {
    return res.status(409).json({ error: true, message: 'A reconstruction job is already running for this project.', jobId: running.id });
  }

  const activeEngine = getEngine();
  const job = jobManager.createJob(projectId, { reconstructionEngine: activeEngine });

  setImmediate(() => runReconstruction(job, projectId, activeEngine, getFrameRate()));

  res.status(202).json({
    success: true,
    jobId: job.id,
    status: job.status,
    message: 'Reconstruction job successfully queued.'
  });
});

export default router;
