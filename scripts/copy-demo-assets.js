import fs from 'fs';
import path from 'path';

const publicDemo = path.join(process.cwd(), 'public', 'demo');
const distDemo = path.join(process.cwd(), 'dist', 'demo');
const publicModels = path.join(process.cwd(), 'public', 'models');
const distModels = path.join(process.cwd(), 'dist', 'models');
const publicRedirects = path.join(process.cwd(), 'public', '_redirects');
const distRedirects = path.join(process.cwd(), 'dist', '_redirects');
const publicHeaders = path.join(process.cwd(), 'public', '_headers');
const distHeaders = path.join(process.cwd(), 'dist', '_headers');

if (fs.existsSync(publicDemo)) {
  if (!fs.existsSync(distDemo)) {
    fs.mkdirSync(distDemo, { recursive: true });
  }
  fs.cpSync(publicDemo, distDemo, { recursive: true });
  console.log('✅ Successfully copied demo GLB assets to dist/demo for Netlify production build.');
}

if (fs.existsSync(publicModels)) {
  fs.cpSync(publicModels, distModels, { recursive: true });
  console.log('✅ Copied homepage models to dist/models for Netlify production build.');
}

if (fs.existsSync(publicRedirects)) {
  fs.copyFileSync(publicRedirects, distRedirects);
  console.log('✅ Copied public/_redirects to dist/_redirects.');
}

if (fs.existsSync(publicHeaders)) {
  fs.copyFileSync(publicHeaders, distHeaders);
  console.log('✅ Copied public/_headers to dist/_headers.');
}
