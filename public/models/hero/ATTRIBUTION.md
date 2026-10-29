# Homepage hero model — attribution

Homepage-only visual asset. It is NOT an AERO3D reconstruction and carries no survey measurements.
The demo project's measured model (`public/demo/build.glb`) is separate and untouched.

## Selected asset (to be added as `hero-building.glb`)

- Dataset: **Drone Building Scans** — `flat-roof` textured model
- Source page: https://huggingface.co/datasets/Matt1up/drone-building-scans
- File: https://huggingface.co/datasets/Matt1up/drone-building-scans/resolve/main/flat-roof/model/flat-roof.glb (about 22 MB)
- Creator: Matthew Guertin
- Licence: **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/) — commercial use allowed, credit required
- Required credit line: "Drone Building Scans — Matthew Guertin, 2026. CC BY 4.0."
- Note from the dataset page: trademarks or signage visible in the imagery belong to their owners.

If you modify the file (resize textures, compress), say so in the credit: "optimized for web".

## Status

The file itself is not in the repository yet. It could not be downloaded from the build environment
(huggingface.co is blocked there). Until `hero-building.glb` exists, the homepage falls back to
`public/demo/build.glb`.

## How to add it

1. Download `flat-roof.glb` from the URL above.
2. Run `bash scripts/optimize-hero-model.sh path/to/flat-roof.glb` (writes `public/models/hero/hero-building.glb`).
   The script has not been run yet; check the output size (target: under about 8 MB) and look at the homepage.
3. Commit the result.
