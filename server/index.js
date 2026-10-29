import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import polycamRoutes from './routes/polycam.js';
import projectRoutes from './routes/projects.js';
import jobRoutes from './routes/jobs.js';
import aiRoutes from './routes/ai.js';
import healthRoutes from './routes/health.js';
import webhookRoutes from './routes/webhooks.js';
import { getEngine, getAllowedOrigins } from './config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers. CORP is relaxed so WebGL loaders can fetch GLB assets cross-origin.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // the SPA loads Leaflet tiles and inline styles; tune CSP per deployment
}));

// CORS limited to the configured origins (CORS_ORIGIN). Same-origin requests need no CORS headers.
const allowedOrigins = getAllowedOrigins();
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS']
}));

// Basic abuse protection on all API routes; uploads and processing get a tighter limit
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false });
const heavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, code: 'RATE_LIMITED', message: 'Too many uploads or processing requests. Try again later.' }
});
app.use('/api', apiLimiter);
app.post('/api/projects/upload', heavyLimiter);
app.post('/api/projects/:id/upload', heavyLimiter);
app.post('/api/projects/:id/process', heavyLimiter);

// Webhooks raw parser comes before json parser for signature check
app.use('/api/webhooks', webhookRoutes);

// JSON body parser for normal endpoints
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static options: MIME type for GLB assets (CORP header comes from helmet above)
const staticOptions = {
  setHeaders: (res, filepath) => {
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
  console.log(`⚡ Engine Mode: ${getEngine()}`);
  console.log(`==================================================`);
});
