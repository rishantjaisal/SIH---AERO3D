import fs from 'fs';
import path from 'path';

async function run() {
  const publicDemoDir = path.join(process.cwd(), 'public', 'demo');
  const glbPath = path.join(publicDemoDir, 'build.glb');

  if (!fs.existsSync(publicDemoDir)) {
    fs.mkdirSync(publicDemoDir, { recursive: true });
  }

  // CRITICAL REQUIREMENT: Do NOT overwrite real photogrammetry model if it exists!
  if (fs.existsSync(glbPath)) {
    const stats = fs.statSync(glbPath);
    if (stats.size > 0) {
      console.log(`[Aero3D GLB Pipeline] Real photogrammetry model detected at ${glbPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB). Preserving asset.`);
      return;
    }
  }

  console.log('[Aero3D GLB Pipeline] No existing build.glb found. Generating fallback binary GLB asset...');

  // Valid minimal GLB binary container buffer
  const jsonText = JSON.stringify({
    asset: { version: "2.0", generator: "Aero3D Pipeline" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "BuildingCore" }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0 },
        indices: 1,
        mode: 4
      }]
    }],
    buffers: [{ byteLength: 108 }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 96, target: 34962 },
      { buffer: 0, byteOffset: 96, byteLength: 12, target: 34963 }
    ],
    accessors: [
      { bufferView: 0, byteOffset: 0, componentType: 5126, count: 8, type: "VEC3", max: [14, 14, 9], min: [-14, 0, -9] },
      { bufferView: 1, byteOffset: 0, componentType: 5123, count: 6, type: "SCALAR" }
    ]
  });

  // Pad JSON string to 4-byte alignment with spaces
  let jsonChunk = Buffer.from(jsonText, 'utf8');
  const jsonPadding = (4 - (jsonChunk.length % 4)) % 4;
  if (jsonPadding > 0) {
    jsonChunk = Buffer.concat([jsonChunk, Buffer.from(' '.repeat(jsonPadding), 'utf8')]);
  }

  // Binary data buffer (8 vertices + 6 indices for box face)
  const floatData = new Float32Array([
    -14, 0, -9,   14, 0, -9,   14, 14, -9,   -14, 14, -9,
    -14, 0,  9,   14, 0,  9,   14, 14,  9,   -14, 14,  9
  ]);
  const indexData = new Uint16Array([0, 1, 2, 0, 2, 3]);

  const binBuffer = Buffer.concat([
    Buffer.from(floatData.buffer),
    Buffer.from(indexData.buffer)
  ]);

  const binPadding = (4 - (binBuffer.length % 4)) % 4;
  const paddedBinBuffer = binPadding > 0 ? Buffer.concat([binBuffer, Buffer.alloc(binPadding)]) : binBuffer;

  const totalLength = 12 + 8 + jsonChunk.length + 8 + paddedBinBuffer.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46544C67, 0); // "gTFg"
  header.writeUInt32LE(2, 4);          // version 2
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4E4F534A, 4); // "JSON"

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(paddedBinBuffer.length, 0);
  binHeader.writeUInt32LE(0x00415444, 4); // "BIN\0"

  const fullGlb = Buffer.concat([
    header,
    jsonHeader,
    jsonChunk,
    binHeader,
    paddedBinBuffer
  ]);

  fs.writeFileSync(glbPath, fullGlb);
  console.log(`✅ Successfully generated fallback binary GLB to ${glbPath} (${fullGlb.length} bytes)`);
}

run().catch(err => {
  console.error('[Aero3D GLB Pipeline] Error:', err);
});
