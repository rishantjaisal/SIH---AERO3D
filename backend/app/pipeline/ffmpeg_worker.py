import os
import subprocess
import shutil


def is_ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


def extract_frames(video_path: str, output_dir: str, fps: int = 3, timeout: int = 600) -> int:
    """Extract real frames with FFmpeg. Raises if FFmpeg is missing or fails; never fabricates frames."""
    if not is_ffmpeg_available():
        raise RuntimeError("FFmpeg is not installed on the server, so video frames cannot be extracted.")
    os.makedirs(output_dir, exist_ok=True)
    out_pattern = os.path.join(output_dir, "frame_%06d.jpg")
    cmd = ["ffmpeg", "-y", "-i", video_path, "-r", str(fps), "-q:v", "2", out_pattern]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise RuntimeError("FFmpeg timed out while extracting frames.")
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"FFmpeg failed: {(exc.stderr or b'').decode(errors='ignore')[-200:]}")
    return len([f for f in os.listdir(output_dir) if f.endswith(".jpg")])
