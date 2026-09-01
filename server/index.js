import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import polycamRoutes from './routes/polycam.js';
import projectRoutes from './routes/projects.js';
import jobRoutes from './routes/jobs.js';
import aiRoutes from './routes/ai.js';
import healthRoutes from './routes/health.js';
import webhookRoutes from './routes/webhooks.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Permissive CORS middleware
app.use(cors({ origin: '*', credentials: true }));

// Global CORS & Cross-Origin Resource Sharing headers for WebGL asset streaming across all browsers & devices
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Webhooks raw parser comes before json parser for signature check
app.use('/api/webhooks', webhookRoutes);

// JSON body parser for normal endpoints
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static options with explicit CORS and MIME headers
const staticOptions = {
  setHeaders: (res, filepath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (filepath.endsWith('.glb')) {
      res.setHeader('Content-Type', 'model/gltf-binary');
    }
  }
};

// Serve static uploads, project storage, demo assets, and frontend client build
const uploadsPath = path.join(process.cwd(), 'server', 'uploads');
const storagePath = path.join(process.cwd(), 'storage');

app.use('/uploads', express.static(uploadsPath, staticOptions));
app.use('/api/uploads', express.static(uploadsPath, staticOptions));
app.use('/storage', express.static(storagePath, staticOptions));
app.use('/demo', express.static(path.join(process.cwd(), 'public', 'demo'), staticOptions));

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, staticOptions));
}

// API Routes
app.use('/api/polycam', polycamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/health', healthRoutes);

// Catch-all route to serve SPA frontend for any non-API request
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/storage') || req.path.startsWith('/demo')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('Aero3D App is running. Build frontend using "npm run build".');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Aero3D Backend Error]', err);
  res.status(err.status || 500).json({
    error: true,
    code: err.code || 'SERVER_ERROR',
    message: err.message || 'An internal server error occurred.'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 Aero3D Intelligence Backend Running on Port ${PORT}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Engine Mode: ${process.env.PHOTOGRAMMETRY_ENGINE || process.env.RECONSTRUCTION_ENGINE || 'demo'}`);
  console.log(`==================================================`);
});
