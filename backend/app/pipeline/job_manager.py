import time
import uuid
from typing import Dict, Any, Optional

class JobManager:
    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}

    def create_job(self, project_id: str, input_type: str = "video", engine: str = "demo") -> Dict[str, Any]:
        job_id = f"job-{int(time.time())}-{uuid.uuid4().hex[:6]}"
        job = {
            "id": job_id,
            "projectId": project_id,
            "status": "queued",
            "progress": 0,
            "stage": "QUEUED",
            "stageLabel": "Queued for Reconstruction",
            "message": "Job queued in Aero3D Python FastAPI photogrammetry pipeline.",
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "inputType": input_type,
            "reconstructionEngine": engine,
            "qualityMetrics": None,
            "error": None
        }
        self.jobs[job_id] = job
        # keep memory bounded: drop the oldest finished jobs beyond 500
        if len(self.jobs) > 500:
            for jid in [j for j, x in self.jobs.items() if x["status"] in ("completed", "failed")][: len(self.jobs) - 500]:
                del self.jobs[jid]
        return job

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self.jobs.get(job_id)

    def get_job_by_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Latest job for the project (dicts keep insertion order)."""
        found = None
        for job in self.jobs.values():
            if job["projectId"] == project_id:
                found = job
        return found

    def get_active_job_by_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        for job in self.jobs.values():
            if job["projectId"] == project_id and job["status"] in ("queued", "processing"):
                return job
        return None

    def delete_by_project(self, project_id: str) -> None:
        for jid in [j for j, job in self.jobs.items() if job["projectId"] == project_id]:
            del self.jobs[jid]

    def update_job(self, job_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if job_id not in self.jobs:
            return None
        self.jobs[job_id].update(updates)
        self.jobs[job_id]["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        return self.jobs[job_id]

    def fail_job(self, job_id: str, stage: str, message: str) -> Optional[Dict[str, Any]]:
        return self.update_job(job_id, {
            "status": "failed",
            "stage": stage,
            "stageLabel": f"Failed during {stage}",
            "message": message,
            "error": {"stage": stage, "message": message}
        })

python_job_manager = JobManager()
