import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Checks system FFmpeg binary availability in PATH
 */
export function isFFmpegAvailable() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Validates file extension, mime type, and file size
 */
export function validateMediaFile(filePath, originalName, fileSize) {
  const allowedExts = ['.mp4', '.mov', '.mkv', '.jpg', '.jpeg', '.png', '.zip', '.glb', '.gltf', '.obj', '.ply'];
  const ext = path.extname(originalName).toLowerCase();
  
  if (!allowedExts.includes(ext)) {
    throw new Error(`Unsupported file extension ${ext}. Allowed: ${allowedExts.join(', ')}`);
  }

  const MAX_SIZE = 250 * 1024 * 1024; // 250MB limit
  if (fileSize > MAX_SIZE) {
    throw new Error(`File size ${(fileSize / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed limit of 250MB.`);
  }

  return { ext, isVideo: ['.mp4', '.mov', '.mkv'].includes(ext), isImage: ['.jpg', '.jpeg', '.png'].includes(ext) };
}

/**
 * Extract frames from a video file into targetFramesDir at specified FPS using FFmpeg
 */
export async function extractFramesFromVideo(videoPath, targetFramesDir, fps = 3, onProgress = () => {}) {
  if (!fs.existsSync(targetFramesDir)) {
    fs.mkdirSync(targetFramesDir, { recursive: true });
  }

  if (!isFFmpegAvailable()) {
    throw new Error('FFmpeg executable is not installed or configured in system PATH.');
  }

  return new Promise((resolve, reject) => {
    const outputPattern = path.join(targetFramesDir, 'frame_%06d.jpg');
    const args = [
      '-y',
      '-i', videoPath,
      '-vf', `fps=${fps}`,
      '-vsync', 'vfr',
      '-q:v', '2',
      outputPattern
    ];

    const ffmpegProc = spawn('ffmpeg', args);

    ffmpegProc.stderr.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('frame=')) {
        onProgress(msg);
      }
    });

    ffmpegProc.on('close', (code) => {
      if (code === 0) {
        const files = fs.readdirSync(targetFramesDir).filter(f => f.endsWith('.jpg'));
        resolve({ frameCount: files.length, fps });
      } else {
        reject(new Error(`FFmpeg frame extraction exited with error code ${code}`));
      }
    });

    ffmpegProc.on('error', (err) => {
      reject(new Error(`FFmpeg execution error: ${err.message}`));
    });
  });
}
