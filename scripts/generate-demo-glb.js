import fs from 'fs';
import path from 'path';

async function run() {
  const publicDemoDir = path.join(process.cwd(), 'public', 'demo');
  const glbPath = path.join(process.cwd(), 'public', 'demo', 'build.glb');

  if (!fs.existsSync(publicDemoDir)) {
    fs.mkdirSync(publicDemoDir, { recursive: true });
  }

  // Preserve real photogrammetry model (> 100 KB) if present
  if (fs.existsSync(glbPath)) {
    const stats = fs.statSync(glbPath);
    if (stats.size > 100000) {
      console.log(`[Aero3D GLB Pipeline] Real photogrammetry model detected at ${glbPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB). Preserving asset.`);
      return;
    }
  }

  console.log('[Aero3D GLB Pipeline] Generating valid fallback GLTF model file...');

  // Valid 3D Box Geometry glTF representation with embedded Base64 buffer
  const positions = new Float32Array([
    // Front face
    -14, 0, 9,   14, 0, 9,   14, 14, 9,   -14, 14, 9,
    // Back face
    -14, 0, -9,  -14, 14, -9, 14, 14, -9,  14, 0, -9,
    // Top face
    -14, 14, -9, -14, 14, 9,  14, 14, 9,   14, 14, -9,
    // Bottom face
    -14, 0, -9,  14, 0, -9,   14, 0, 9,    -14, 0, 9,
    // Right face
    14, 0, -9,   14, 14, -9,  14, 14, 9,   14, 0, 9,
    // Left face
    -14, 0, -9,  -14, 0, 9,   -14, 14, 9,  -14, 14, -9
  ]);

  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3,       // Front
    4, 5, 6, 4, 6, 7,       // Back
    8, 9, 10, 8, 10, 11,    // Top
    12, 13, 14, 12, 14, 15, // Bottom
    16, 17, 18, 16, 18, 19, // Right
    20, 21, 22, 20, 22, 23  // Left
  ]);

  const posBuffer = Buffer.from(positions.buffer);
  const idxBuffer = Buffer.from(indices.buffer);
  const combinedBuffer = Buffer.concat([posBuffer, idxBuffer]);

  const b64Data = combinedBuffer.toString('base64');
  const dataUri = `data:application/octet-stream;base64,${b64Data}`;

  const gltfContent = {
    asset: { version: "2.0", generator: "Aero3D Photogrammetry Fallback" },
    scenes: [{ name: "Scene", nodes: [0] }],
    nodes: [{ name: "BuildingCore", mesh: 0 }],
    meshes: [{
      name: "BuildingMesh",
      primitives: [{
        attributes: { POSITION: 0 },
        indices: 1,
        material: 0
      }]
    }],
    materials: [{
      name: "BuildingMaterial",
      pbrMetallicRoughness: {
        baseColorFactor: [0.2, 0.35, 0.5, 1.0],
        metallicFactor: 0.2,
        roughnessFactor: 0.4
      }
    }],
    buffers: [{
      byteLength: combinedBuffer.length,
      uri: dataUri
    }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBuffer.length, target: 34962 },
      { buffer: 0, byteOffset: posBuffer.length, byteLength: idxBuffer.length, target: 34963 }
    ],
    accessors: [
      { bufferView: 0, byteOffset: 0, componentType: 5126, count: 24, type: "VEC3", max: [14, 14, 9], min: [-14, 0, -9] },
      { bufferView: 1, byteOffset: 0, componentType: 5123, count: 36, type: "SCALAR", max: [23], min: [0] }
    ]
  };

  const jsonStr = JSON.stringify(gltfContent, null, 2);
  fs.writeFileSync(glbPath, jsonStr);
  console.log(`✅ Successfully written valid fallback GLTF model to ${glbPath} (${(jsonStr.length / 1024).toFixed(1)} KB)`);
}

run().catch(console.error);
