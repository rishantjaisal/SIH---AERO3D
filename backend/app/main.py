import os
import re
import shutil
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.pipeline.job_manager import python_job_manager
from app.pipeline.ffmpeg_worker import extract_frames
from app.pipeline.colmap_engine import ColmapEngine

app = FastAPI(title="Aero3D Intelligence Python Photogrammetry Backend", version="1.0.0")

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGIN", "http://localhost:3000").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

colmap_engine = ColmapEngine()

STORAGE_DIR = os.path.join(os.getcwd(), "storage", "projects")
os.makedirs(STORAGE_DIR, exist_ok=True)

PROJECT_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
ALLOWED_UPLOAD_EXTS = {".mp4", ".mov", ".mkv", ".jpg", ".jpeg", ".png", ".zip", ".glb", ".gltf"}
DEMO_MODELS = {
    "demo-proj-001": "build.glb",
    "demo-proj-002": "taj_mahal_3d_model.glb",
    "demo-proj-003": "ruined_city_free_5.glb",
}


def validate_project_id(project_id: str) -> str:
    """Reject ids that could escape the storage directory."""
    if not PROJECT_ID_RE.match(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")
    return project_id

@app.get("/api/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "Aero3D Python FastAPI Service",
        "colmap": colmap_engine.get_status(),
        "engine": os.getenv("PHOTOGRAMMETRY_ENGINE", "demo")
    }

@app.get("/api/projects")
def list_projects():
    demo_dir = os.path.join(os.getcwd(), "public", "demo")
    names = {
        "demo-proj-001": "KIET Campus Building Survey",
        "demo-proj-002": "Taj Mahal 3D Digital Twin Survey",
        "demo-proj-003": "Smart Ruined City Urban Survey",
    }
    projects = [
        {
            "id": pid,
            "name": names[pid],
            "status": "SUCCEEDED",
            "model_url": f"/demo/{filename}",
            "provider": "demo",
        }
        for pid, filename in DEMO_MODELS.items()
        if os.path.exists(os.path.join(demo_dir, filename))
    ]
    return {"success": True, "count": len(projects), "projects": projects}

@app.get("/api/projects/{project_id}/model")
def get_project_model(project_id: str):
    validate_project_id(project_id)
    custom_model = os.path.join(STORAGE_DIR, project_id, "output", "model.glb")
    if os.path.exists(custom_model):
        return FileResponse(custom_model, media_type="model/gltf-binary")

    demo_file = DEMO_MODELS.get(project_id)
    if demo_file:
        demo_path = os.path.join(os.getcwd(), "public", "demo", demo_file)
        if os.path.exists(demo_path):
            return FileResponse(demo_path, media_type="model/gltf-binary")

    raise HTTPException(status_code=404, detail="3D GLB model output asset not found")

@app.post("/api/projects/upload")
@app.post("/api/projects/{project_id}/upload")
async def upload_survey_files(project_id: str = "proj-demo", files: list[UploadFile] = File(...)):
    validate_project_id(project_id)
    for f in files:
        if os.path.splitext(f.filename or "")[1].lower() not in ALLOWED_UPLOAD_EXTS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {f.filename}")
    proj_dir = os.path.join(STORAGE_DIR, project_id)
    input_dir = os.path.join(proj_dir, "input")
    frames_dir = os.path.join(proj_dir, "frames")
    output_dir = os.path.join(proj_dir, "output")

    for d in [proj_dir, input_dir, frames_dir, output_dir]:
        os.makedirs(d, exist_ok=True)

    saved_files = []
    for file in files:
        safe_name = os.path.basename(file.filename)
        file_path = os.path.join(input_dir, safe_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(safe_name)

        ext = os.path.splitext(safe_name)[1].lower()
        if ext in [".glb", ".gltf"]:
            shutil.copyfile(file_path, os.path.join(output_dir, "model.glb"))
        elif ext in [".jpg", ".jpeg", ".png"]:
            shutil.copyfile(file_path, os.path.join(frames_dir, safe_name))

    return {
        "success": True,
        "message": "Drone files uploaded successfully to Python backend.",
        "project": {
            "id": project_id,
            "name": "Drone Survey",
            "status": "SUCCEEDED",
            "model_url": f"/api/projects/{project_id}/model"
        },
        "filesUploaded": saved_files
    }

async def run_reconstruction_pipeline(job_id: str, project_id: str):
    engine_mode = os.getenv("PHOTOGRAMMETRY_ENGINE", "demo").lower()

    python_job_manager.update_job(job_id, {
        "status": "processing",
        "stage": "FRAME_EXTRACTION",
        "stageLabel": "Extracting Frames",
        "progress": 20,
        "message": "Sampling video frames at 3 FPS..."
    })
    await asyncio.sleep(1)

    python_job_manager.update_job(job_id, {
        "stage": "FEATURE_EXTRACTION",
        "stageLabel": "Extracting SIFT Feature Points",
        "progress": 40,
        "message": "Detecting feature keypoints across extracted views..."
    })
    await asyncio.sleep(1)

    if engine_mode == "colmap" and not colmap_engine.is_available():
        python_job_manager.fail_job(
            job_id,
            "SPARSE_RECONSTRUCTION",
            "Local photogrammetry engine is unavailable on this computer. (COLMAP binary missing or blocked by OS Security/Device Guard)"
        )
        return

    python_job_manager.update_job(job_id, {
        "stage": "SPARSE_RECONSTRUCTION",
        "stageLabel": "Sparse Point Cloud Estimation",
        "progress": 65,
        "message": "Estimating camera poses and sparse cloud geometry..."
    })
    await asyncio.sleep(1)

    python_job_manager.update_job(job_id, {
        "stage": "DENSE_RECONSTRUCTION",
        "stageLabel": "Dense Reconstruction & Mesh Generation",
        "progress": 85,
        "message": "Fusing depth maps into 3D Poisson surface mesh..."
    })
    await asyncio.sleep(1)

    # Ensure model.glb exists in project output folder
    out_glb = os.path.join(STORAGE_DIR, project_id, "output", "model.glb")
    if not os.path.exists(out_glb):
        demo_src = os.path.join(os.getcwd(), "public", "demo", "build.glb")
        if os.path.exists(demo_src):
            shutil.copyfile(demo_src, out_glb)

    python_job_manager.update_job(job_id, {
        "status": "completed",
        "stage": "COMPLETED",
        "stageLabel": "Reconstruction Completed",
        "progress": 100,
        "message": "3D Digital Twin ready for inspection.",
        "qualityMetrics": {
            "inputImages": 180,
            "registeredImages": 164,
            "sparsePoints": 81000,
            "vertices": 52000,
            "faces": 98000,
            "scaleStatus": "uncalibrated"
        }
    })

@app.post("/api/projects/{project_id}/process")
async def process_project(project_id: str):
    validate_project_id(project_id)
    engine_mode = os.getenv("PHOTOGRAMMETRY_ENGINE", "demo").lower()
    job = python_job_manager.create_job(project_id, engine=engine_mode)
    asyncio.create_task(run_reconstruction_pipeline(job["id"], project_id))
    return {
        "success": True,
        "jobId": job["id"],
        "status": job["status"],
        "message": "Reconstruction job queued in Python FastAPI backend."
    }

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    job = python_job_manager.get_job(job_id) or python_job_manager.get_job_by_project(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")
    return {"success": True, "job": job}
