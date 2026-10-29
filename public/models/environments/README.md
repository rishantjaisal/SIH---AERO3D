# Homepage 3D backgrounds

## Mountain terrain (`mountain-range.glb`)

The homepage background switch (**Flat roof** / **Mountain terrain**) loads this local file for the mountain option:

    public/models/environments/mountain-range.glb

The file is bundled (11 MB, 4 JPEG textures, about 80K vertices, extents 6000 x 1200 x 6000 model units).
If it is missing or not a valid GLB, selecting Mountain terrain shows a notice and the flat-roof background stays.

Why `models/` and not `assets/`: Vite writes its own build output to `dist/assets`, so a `public/assets` folder is not copied reliably.

### Replacing it
Save a new GLB at the same path. Check that the first four bytes are `glTF` (`head -c 4 mountain-range.glb`); an HTML page saved with a `.glb` extension is rejected by the viewer.

### Licence and attribution
- Model: "Mountain Range", Innerscene Corp (innerscene.com), original Innerscene model.
- Licence: CC0 1.0 (public domain). Credit is not required; it is given here for provenance.
- Source: https://www.innerscene.com/tools/library/3d-parts/mountain-range-ac633cbe
- The model is a visual backdrop only. It is not a drone reconstruction and carries no survey measurements.

### How it is used
`src/components/landing/LandingScene.tsx` loads the chosen model with the same scroll effects (scan sweep, wireframe build, point cloud, camera path, labels). The model is auto-scaled to the scene width from its bounding box. The flat roof (`public/models/hero/`) is unchanged and is the default. It is a homepage visual only; the project viewer does not use it.
