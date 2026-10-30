# Showcase project assets

External sample datasets with preprocessed outputs, used by the INNOTECH 2026 demo projects. AERO3D did not capture
this imagery and did not run these reconstructions. No accuracy is claimed.

## industrial-building/ (demo-proj-004, "Industrial Building Digital Twin")
- Source: Drone Building Scans, "flat-roof" scan — https://huggingface.co/datasets/Matt1up/drone-building-scans
- Author/credit: Matthew Guertin, 2026. Licence CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- `model.glb`: web-optimized derivative of flat-roof.glb (~22 MB original): ~99K triangles, 2048 px texture, meshopt-compressed. Same content as `../hero/hero-building.glb`, kept as a separate file so each feature can change independently.
- `preview.jpg`: dataset preview image `preview/flat-roof.jpg` from https://github.com/Matt1Up/drone-building-scans-dataset, resized to 1000 px wide.
- `inputs/` (optional): add optimized thumbnails such as `DJI_20260822183442_0005_D.jpg` (downscaled from the original JPG linked in the dataset). Missing files show a placeholder.
- Facts shown on the page come from the dataset's `manifest/flat-roof/summary.json`, `images.csv` and `poses/flat-roof/colmap/`.

## archaeological-heritage/ (demo-proj-005, "Archaeological Heritage Reconstruction")
- Source: https://data.mendeley.com/datasets/ydpn8xnx24/1 (CC BY 4.0)
- Not yet added. Put the converted point cloud at `archaeological-heritage/model.glb` (geometry and colours preserved) and update
  `src/data/demoProjects.ts` (`outputShipped`, facts, gallery) and the thumbnail after inspecting the real files.
