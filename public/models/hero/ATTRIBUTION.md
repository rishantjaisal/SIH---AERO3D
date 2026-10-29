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

`hero-building.glb` is included. It is the original `flat-roof.glb` (21.8 MB, ~2.3M triangles) optimized for web:
mesh simplified to about 99K triangles, texture resized to 2048 px WebP, geometry compressed with meshopt (1.5 MB).
Credit line for the site: "Drone Building Scans — Matthew Guertin, 2026. CC BY 4.0. Optimized for web."

The model is Z-up; the homepage rotates it at load time. If the file is ever missing, the homepage falls back to
`public/demo/build.glb`.

## Regenerating

```
bash scripts/optimize-hero-model.sh path/to/flat-roof.glb
```
That script runs gltf-transform's default optimize pass (about 550K triangles). The shipped file was additionally
simplified with `gltf-transform weld` then `simplify --ratio 0.1 --error 0.02`, then `simplify --ratio 0.18 --error 0.05`.
