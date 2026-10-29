import os
import re
import shutil
import asyncio
import time
import uuid
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
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

colmap_engine = ColmapEngine()

STORAGE_DIR = os.path.join(os.getcwd(), "storage", "projects")
os.makedirs(STORAGE_DIR, exist_ok=True)

PROJECT_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
ALLOWED_UPLOAD_EXTS = {".mp4", ".mov", ".mkv", ".jpg", ".jpeg", ".png", ".glb"}
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "500")) * 1024 * 1024
DEMO_MODELS = {
    "demo-proj-001": "build.glb",
    "demo-proj-002": "taj_mahal_3d_model.glb",
    "demo-proj-003": "ruined_city_free_5.glb",
}


def is_reserved(project_id: str) -> bool:
    return project_id in DEMO_MODELS or project_id.startswith("demo-")


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
async def upload_survey_files(project_id: str | None = None, files: list[UploadFile] = File(...)):
    # A fixed default id made every anonymous upload overwrite the previous one
    project_id = project_id or f"aero-{int(time.time())}-{uuid.uuid4().hex[:6]}"
    validate_project_id(project_id)
    if is_reserved(project_id):
        raise HTTPException(status_code=403, detail="This project id is reserved for a bundled sample project")
    for f in files:
        if os.path.splitext(f.filename or "")[1].lower() not in ALLOWED_UPLOAD_EXTS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {f.filename}")
    proj_dir = os.path.join(STORAGE_DIR, project_id)
    input_dir = os.path.join(proj_dir, "input")
    frames_dir = os.path.join(proj_dir, "frames")
    output_dir = os.path.join(proj_dir, "output")
    created = not os.path.exists(proj_dir)

    for d in [proj_dir, input_dir, frames_dir, output_dir]:
        os.makedirs(d, exist_ok=True)

    saved_files = []
    has_model = False
    try:
        for file in files:
            safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", os.path.basename(file.filename or "file")) or "file"
            file_path = os.path.join(input_dir, safe_name)
            written = 0
            with open(file_path, "wb") as buffer:
                while chunk := await file.read(1024 * 1024):
                    written += len(chunk)
                    if written > MAX_UPLOAD_BYTES:
                        raise HTTPException(status_code=413, detail=f"{safe_name} is larger than the upload limit")
                    buffer.write(chunk)
            saved_files.append(safe_name)

            ext = os.path.splitext(safe_name)[1].lower()
            if ext == ".glb":
                has_model = True
                shutil.copyfile(file_path, os.path.join(output_dir, "model.glb"))
            elif ext in [".jpg", ".jpeg", ".png"]:
                shutil.copyfile(file_path, os.path.join(frames_dir, safe_name))
    except Exception:
        if created:
            shutil.rmtree(proj_dir, ignore_errors=True)
        raise

    return {
        "success": True,
        "message": "Files uploaded to Python backend.",
        "project": {
            "id": project_id,
            "name": "Drone Survey",
            "status": "SUCCEEDED" if has_model else "QUEUED",
            "model_url": f"/api/projects/{project_id}/model"
        },
        "filesUploaded": saved_files
    }


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    validate_project_id(project_id)
    if is_reserved(project_id):
        raise HTTPException(status_code=403, detail="Bundled sample projects cannot be deleted")
    if python_job_manager.get_active_job_by_project(project_id):
        raise HTTPException(status_code=409, detail="A reconstruction job is running for this project")
    proj_dir = os.path.join(STORAGE_DIR, project_id)
    if not os.path.isdir(proj_dir):
        raise HTTPException(status_code=404, detail="Project not found")
    shutil.rmtree(proj_dir)
    python_job_manager.delete_by_project(project_id)
    return {"success": True, "deleted": project_id}


async def run_reconstruction_pipeline(job_id: str, project_id: str):
    """Honest pipeline: real FFmpeg frame extraction, then a clear failure because no engine here can reconstruct."""
    engine_mode = os.getenv("PHOTOGRAMMETRY_ENGINE", "demo").lower()
    proj_dir = os.path.join(STORAGE_DIR, project_id)
    out_glb = os.path.join(proj_dir, "output", "model.glb")

    if os.path.exists(out_glb):
        python_job_manager.update_job(job_id, {
            "status": "completed", "stage": "COMPLETED", "stageLabel": "3D Model Ready", "progress": 100,
            "message": "A 3D model is already available for this project; no reconstruction was needed."
        })
        return

    if engine_mode == "colmap" and not colmap_engine.is_available():
        python_job_manager.fail_job(job_id, "ENGINE_UNAVAILABLE",
            "COLMAP is not available on this machine (binary missing or blocked by OS security).")
        return

    input_dir = os.path.join(proj_dir, "input")
    frames_dir = os.path.join(proj_dir, "frames")
    video = next((f for f in sorted(os.listdir(input_dir)) if os.path.splitext(f)[1].lower() in (".mp4", ".mov", ".mkv")), None) if os.path.isdir(input_dir) else None

    python_job_manager.update_job(job_id, {
        "status": "processing", "stage": "FRAME_EXTRACTION", "stageLabel": "Extracting Frames", "progress": 20,
        "message": "Extracting frames with FFmpeg..." if video else "Counting uploaded photos..."
    })
    try:
        if video:
            frame_count = await asyncio.to_thread(extract_frames, os.path.join(input_dir, video), frames_dir)
        else:
            frame_count = len([f for f in os.listdir(frames_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))]) if os.path.isdir(frames_dir) else 0
    except Exception as exc:
        python_job_manager.fail_job(job_id, "FRAME_EXTRACTION", str(exc))
        return

    if frame_count == 0:
        python_job_manager.fail_job(job_id, "FRAME_EXTRACTION", "No usable frames or photos were found for this project.")
        return

    python_job_manager.update_job(job_id, {"progress": 50, "message": f"{frame_count} frames ready.", "qualityMetrics": {"inputImages": frame_count}})
    python_job_manager.fail_job(job_id, "RECONSTRUCTION_UNAVAILABLE",
        f"{frame_count} frames were extracted, but running a reconstruction engine from this service is not implemented. Upload a .glb model instead.")


@app.post("/api/projects/{project_id}/process")
async def process_project(project_id: str):
    validate_project_id(project_id)
    if is_reserved(project_id):
        raise HTTPException(status_code=400, detail="Bundled sample projects are already reconstructed")
    if not os.path.isdir(os.path.join(STORAGE_DIR, project_id)):
        raise HTTPException(status_code=404, detail="Project not found. Upload files first.")
    running = python_job_manager.get_active_job_by_project(project_id)
    if running:
        raise HTTPException(status_code=409, detail="A reconstruction job is already running for this project")
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
