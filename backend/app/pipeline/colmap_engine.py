import os
import shutil
import subprocess

class ColmapEngine:
    def __init__(self):
        self.colmap_bin = os.getenv("COLMAP_PATH", "C:/COLMAP/bin/colmap.exe" if os.name == "nt" else "/usr/bin/colmap")

    def is_available(self) -> bool:
        if os.path.exists(self.colmap_bin):
            return True
        return shutil.which("colmap") is not None

    def get_status(self) -> dict:
        available = self.is_available()
        return {
            "mode": "colmap",
            "available": available,
            "executable": self.colmap_bin,
            "message": "COLMAP Engine Ready" if available else "Local reconstruction engine is unavailable on this computer. (COLMAP binary missing or blocked by OS Security/Device Guard)"
        }
