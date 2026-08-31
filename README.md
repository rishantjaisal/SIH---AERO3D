# Aero3D Intelligence

> **Smart India Hackathon 2026 Project**  
> *"Turn a Single Drone Flight into an Intelligent 3D Digital Twin."*

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg)](https://threejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-sky.svg)](https://tailwindcss.com/)

Aero3D Intelligence is a production-grade full-stack web application designed for Smart India Hackathon 2026. It ingests drone photogrammetry video/images, converts raw aerial surveys into interactive 3D digital twins via high-fidelity WebGL rendering, and provides AI-powered computer vision object classification, 3D Euclidean distance/height telemetry, GIS Leaflet spatial mapping, and executive inspection audit reports.

---

## 🚀 Key Features

### 1. 🚁 3D WebGL Digital Twin Viewer
- **Interactive Orbit Controls**: Smooth 360° rotation, pan, zoom, and camera view presets (Top, Front, Side, Reset).
- **Procedural 3D Building Models**: Dynamic architectural structures tailored to project dimensions ($X \times Y \times Z$ bounding box, height, floors, and facade colors).
- **Multi-Render Modes**: Seamless switching between **Textured**, **Wireframe**, **Solid Clay**, and **Point Cloud** modes.
- **Model Information Drawer**: Live vertex count, polygon face count, footprint area ($m^2$), elevation delta, and GIS coordinates.

### 2. 📏 3D Telemetry & Raycasted Inspection Markers
- **Euclidean & Height Distance Tool**: Interactive point-to-point 3D distance and vertical height measurements with scale factor calibration.
- **Surface Defect Pinning**: Click anywhere on 3D building surfaces to place categorized severity markers (Structural Crack, Roof Anomaly, Facade Discoloration) with inspector notes.

### 3. 🧠 AI Scene Intelligence & Computer Vision
- **Automated Object Segmentation**: Categorizes 3D scene elements into semantic labels (*Building*, *Roof*, *Road*, *Vegetation*, *Vehicle*, *Structural Anomaly*) with confidence scores.
- **Bounding Box Metrics**: Highlights 3D spatial extents and footprint areas.

### 4. 🗺️ GIS Spatial Sync & Mapping
- **Synchronized Map Interface**: Leaflet-powered GIS mapping supporting CartoDB Dark, Esri World Imagery Satellite, and OpenStreetMap tiles.
- **GPS Coordinates**: Displays precise latitude, longitude, and Ground Sample Distance (GSD) accuracy metrics.

### 5. 📑 Executive Audit Reports & Judge Presentation
- **Printable Audit Report**: PDF-ready formal inspection document containing model snapshots, mesh geometry tables, defect finding logs, and signoff blocks.
- **SIH 2026 Presentation Mode**: Built-in 8-slide interactive pitch deck tailored for hackathon evaluation.

### 6. 🔌 Polycam Photogrammetry Provider Layer
- Abstracted `ReconstructionProvider` architecture allowing live processing via the Polycam API (`/api/polycam/*`) or offline local fallback (`DemoProvider`).

---

## 🏗️ Architecture & Tech Stack

```text
Aero3D Intelligence Full-Stack Platform
├── Client (React 18 + TypeScript + Vite + HashRouter)
│   ├── Three.js / React Three Fiber / Drei (3D WebGL Engine)
│   ├── Leaflet (GIS Map Renderer)
│   ├── Tailwind CSS + Lucide Icons (Aerospace Dark UI System)
│   └── Context State API (ProjectContext)
│
└── Server (Node.js + Express REST API)
    ├── ReconstructionProvider (Provider Abstraction)
    │   ├── PolycamProvider (Live Polycam REST Proxy)
    │   └── DemoProvider (Offline Fallback Engine)
    ├── Webhook Handler (HMAC SHA-256 Verification)
    └── Static SPA Asset Server
```

---

## 🛠️ Installation & Setup Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/rishantjaisal/SIH---AERO3D.git
cd SIH---AERO3D
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment (Optional)
Create a `.env` file in the root directory:
```env
PORT=5000
RECONSTRUCTION_PROVIDER=demo
POLYCAM_API_TOKEN=your_polycam_api_token_here
```

### 4. Running Locally
Start both backend Express API and Vite frontend dev server concurrently:
```bash
npm run dev:all
```
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api/health`

### 5. Production Build
```bash
npm run build
npm run server
```

---

## 📸 Screenshots & Application Flow

1. **Command Dashboard**: `/#/dashboard`
2. **Survey Directory**: `/#/projects`
3. **3D WebGL Digital Twin Viewer**: `/#/viewer/demo-proj-001`
4. **AI Scene Intelligence**: `/#/analysis/demo-proj-001`
5. **GIS Spatial Mapping**: `/#/map/demo-proj-001`
6. **Digital Twin Mission Control**: `/#/digital-twin/demo-proj-001`
7. **Executive Audit Report**: `/#/reports/demo-proj-001`
8. **SIH Pitch Presentation Deck**: `/#/presentation`

---

## 🏆 Smart India Hackathon 2026

Developed for Smart India Hackathon 2026. Designed for rapid evaluation, realistic drone photogrammetry digital twin workflows, offline demonstration reliability, and commercial grade UI/UX.
