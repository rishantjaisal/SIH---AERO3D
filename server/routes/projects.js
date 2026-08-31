import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DemoProvider } from '../providers/DemoProvider.js';

const router = express.Router();
const demoProvider = new DemoProvider();

// File upload configuration
const uploadDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.mp4', '.mov', '.jpg', '.jpeg', '.png', '.zip', '.glb', '.gltf', '.obj', '.ply'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type ${ext}. Allowed: ${allowedExts.join(', ')}`));
    }
  }
});

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await demoProvider.listCaptures();
    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await demoProvider.getCapture(req.params.id);
    res.json({ success: true, project });
  } catch (error) {
    res.status(404).json({ error: true, message: 'Project not found' });
  }
});

// POST /api/projects/upload
router.post('/upload', upload.array('files', 50), async (req, res) => {
  try {
    const metadata = req.body;
    const files = req.files || [];

    // Check if user uploaded a 3D GLB/GLTF model asset
    const glbFile = files.find(f => {
      const ext = path.extname(f.originalname).toLowerCase();
      return ext === '.glb' || ext === '.gltf';
    });

    const modelUrl = glbFile ? `/uploads/${glbFile.filename}` : '/demo/build.glb';
    
    // Pass metadata and modelUrl to provider createCapture
    const newProject = await demoProvider.createCapture({
      name: metadata.projectName || 'Uploaded Drone Survey',
      location: metadata.location || 'Location Unspecified',
      latitude: metadata.latitude,
      longitude: metadata.longitude,
      gsd: metadata.gsd,
      surveyDate: metadata.surveyDate,
      droneModel: metadata.droneModel,
      cameraModel: metadata.cameraModel,
      flightAltitude: metadata.flightAltitude,
      weather: metadata.weather,
      operator: metadata.operator,
      model_url: modelUrl,
      fileCount: files.length
    });

    res.status(201).json({
      success: true,
      message: 'Drone files ingested successfully. Reconstruction initiated.',
      project: newProject,
      filesUploaded: files.map(f => f.filename)
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

export default router;
