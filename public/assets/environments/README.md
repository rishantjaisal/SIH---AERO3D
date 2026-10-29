# Viewer environments

## Mountain terrain (`mountain-range.glb`) — NOT YET ADDED

The viewer's **Mountain Terrain** environment loads this local file:

    public/assets/environments/mountain-range.glb

Until the file is present, selecting Mountain Terrain shows a notice and returns to the Default environment.

### How to add it
1. Open https://www.innerscene.com/tools/library/3d-parts/mountain-range-ac633cbe
2. Download the GLB (the page links https://www.innerscene.com/api/library/mountain-range-ac633cbe/download).
3. Save it as `public/assets/environments/mountain-range.glb`.
4. Check it is a real GLB: the first four bytes must be `glTF` (`head -c 4 mountain-range.glb`). An HTML page saved with a `.glb` extension will be rejected by the viewer.
5. Commit it and deploy. Vite copies `public/` into `dist/`, so Netlify serves it at `/assets/environments/mountain-range.glb`.

### Licence and attribution
- Model: "Mountain Range", Innerscene (original Innerscene model).
- Licence: CC0 1.0 (public domain). Credit is not required; it is given here for provenance.
- Source: https://www.innerscene.com/tools/library/3d-parts/mountain-range-ac633cbe
- The model is a visual backdrop only. It is not a drone reconstruction and carries no survey measurements.

### Tuning
Scale and placement are computed from the file's bounding box in `src/components/viewer/EnvironmentLayer.tsx`
(`target = max(focusSize * 40, 120)`, range pushed back to `-z * 0.6`). Adjust those two numbers if the real model looks too large or small.
