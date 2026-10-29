#!/usr/bin/env bash
# Optimise a GLB for the homepage: dedupe/prune, resize textures to 2048px, WebP textures, meshopt geometry.
# Usage: bash scripts/optimize-hero-model.sh input.glb [output.glb]
set -euo pipefail
IN="${1:?usage: optimize-hero-model.sh input.glb [output.glb]}"
OUT="${2:-public/models/hero/hero-building.glb}"
mkdir -p "$(dirname "$OUT")"
npx --yes @gltf-transform/cli@4 optimize "$IN" "$OUT" \
  --compress meshopt --texture-compress webp --texture-size 2048
ls -lh "$OUT"
