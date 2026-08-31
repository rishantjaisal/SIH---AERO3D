# 🛸 Aero3D Intelligence

> **Autonomous Drone Photogrammetry & 3D Digital Twin Intelligence Platform**

Aero3D Intelligence automatically converts uploaded drone flight videos (`.mp4`, `.mov`, `.mkv`) and overlapping aerial photos (`.jpg`, `.png`, `.zip`) into high-density 3D digital twins (`.glb`), providing interactive WebGL inspection, spatial measurements, GIS mapping, and AI object classification.

---

## 🏗️ System Architecture

```text
Drone Video / Photos Upload
           ↓
Aero3D Backend Ingestion (/api/projects/upload)
           ↓
FFmpeg Frame Extraction (3 FPS Sampling)
           ↓
Photogrammetry Engine Abstraction Layer
├── ColmapProvider (COLMAP Local Engine)
├── PolycamProvider (Polycam Cloud API)
└── DemoProvider (Fast Local Presentation Mode)
           ↓
Sparse & Dense 3D Point Cloud Reconstruction
           ↓
Poisson 3D Mesh & 4K UV Texture Map Baking
           ↓
GLB Output Stream (/api/projects/:id/model)
           ↓
Aero3D WebGL Viewer (Three.js + R3F + Drei)
           ↓
Spatial Measurement, GIS Mapping & AI Analysis
```

---

## ⚡ Quick Start & Local Development

### 1. Frontend & Node.js Express Backend

```bash
# Install dependencies
npm install

# Run frontend (Port 3000) and backend server (Port 5000) concurrently
npm run dev:all
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### 2. Python FastAPI Backend Service (Optional)

Aero3D also includes a standalone Python FastAPI backend service:

```bash
# Navigate to project root
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Launch FastAPI server
uvicorn app.main:app --reload --port 8000
```

---

## 🎥 FFmpeg Video Processing Setup

Aero3D uses **FFmpeg** to extract high-resolution, un-blurred frames from drone flight footage (`.mp4`, `.mov`, `.mkv`) at a configurable sampling rate (default `3 FPS`).

- **Windows**: Download FFmpeg executable from [ffmpeg.org](https://ffmpeg.org/download.html) and add `bin` folder to your System `PATH`.
- **Linux**: `sudo apt install ffmpeg`
- **macOS**: `brew install ffmpeg`

---

## 🧩 Photogrammetry Engine Configuration

Set the `PHOTOGRAMMETRY_ENGINE` environment variable in `.env`:

```env
# Options: demo | colmap | polycam
PHOTOGRAMMETRY_ENGINE=demo
FRAME_RATE=3
COLMAP_PATH=C:/COLMAP/bin/colmap.exe
```

### 1. COLMAP Local Engine Setup (`PHOTOGRAMMETRY_ENGINE=colmap`)
- Download COLMAP CLI binaries from [colmap.github.io](https://colmap.github.io/).
- Set `COLMAP_PATH` in `.env` to point to the `colmap` executable (e.g. `COLMAP_PATH=C:/COLMAP/bin/colmap.exe`).
- **Device Guard / Windows Security Note**: If Windows Device Guard or local OS policies restrict running `colmap.exe`, Aero3D gracefully detects `"Local photogrammetry engine (COLMAP) is unavailable"` without crashing and offers Demo Mode fallback.

### 2. Demo Mode (`PHOTOGRAMMETRY_ENGINE=demo`)
- Demo Mode runs 100% offline without requiring COLMAP, Polycam API keys, or GPU hardware.
- Processes incoming drone uploads and loads the photogrammetry asset `/demo/build.glb`.

---

## 🐳 Docker Deployment

```bash
# Build and run containerized application
docker-compose up --build
```

Access the application at `http://localhost:3000`.

---

## 📜 API Endpoints Summary

- `GET /api/health` - Backend system health and engine status.
- `GET /api/projects` - List all drone survey projects.
- `GET /api/projects/:id` - Fetch project details and metadata.
- `POST /api/projects/upload` - Ingest drone flight video or photo archives.
- `POST /api/projects/:id/process` - Queue asynchronous photogrammetry job.
- `GET /api/jobs/:jobId` - Poll real-time reconstruction progress and stages.
- `GET /api/projects/:id/model` - Secure binary stream for output GLB digital twin.
