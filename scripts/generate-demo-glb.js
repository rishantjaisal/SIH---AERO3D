import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

// FileReader polyfill for Node.js
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      if (blob && typeof blob.arrayBuffer === 'function') {
        blob.arrayBuffer().then(buf => {
          if (this.onload) this.onload({ target: { result: buf } });
        });
      }
    }
    readAsDataURL(blob) {
      if (blob && typeof blob.arrayBuffer === 'function') {
        blob.arrayBuffer().then(buf => {
          const b64 = Buffer.from(buf).toString('base64');
          if (this.onload) this.onload({ target: { result: `data:application/octet-stream;base64,${b64}` } });
        });
      }
    }
  };
}

async function run() {
  const scene = new THREE.Scene();
  scene.name = "Aero3D_Drone_DigitalTwin_Building";

  // Base Ground Terrain
  const groundGeo = new THREE.BoxGeometry(60, 0.4, 50);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.set(0, -0.2, 0);
  scene.add(ground);

  // Main Academic Building Structure
  const mainBuildingGeo = new THREE.BoxGeometry(28, 14, 18);
  const mainBuildingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.2 });
  const mainBuilding = new THREE.Mesh(mainBuildingGeo, mainBuildingMat);
  mainBuilding.position.set(-2, 7, -2);
  scene.add(mainBuilding);

  // Facade Glass Window Panels Layer
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 });
  for (let floor = 1; floor <= 3; floor++) {
    for (let col = -5; col <= 5; col += 2.2) {
      const winGeo = new THREE.BoxGeometry(1.4, 2.2, 0.2);
      const winMesh = new THREE.Mesh(winGeo, windowMat);
      winMesh.position.set(-2 + col, floor * 3.5 + 1, 7.1);
      scene.add(winMesh);
    }
  }

  // Rooftop Parapet
  const roofParapetGeo = new THREE.BoxGeometry(28.4, 0.8, 18.4);
  const roofParapetMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
  const roofParapet = new THREE.Mesh(roofParapetGeo, roofParapetMat);
  roofParapet.position.set(-2, 14.4, -2);
  scene.add(roofParapet);

  // HVAC Rooftop Air Handler Units
  const hvacGeo = new THREE.BoxGeometry(3, 2, 2.5);
  const hvacMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.6 });
  const hvac1 = new THREE.Mesh(hvacGeo, hvacMat);
  hvac1.position.set(-8, 15.5, -4);
  scene.add(hvac1);

  const hvac2 = new THREE.Mesh(hvacGeo, hvacMat);
  hvac2.position.set(4, 15.5, 2);
  scene.add(hvac2);

  // Solar Panel Array Grid on Roof
  const solarGeo = new THREE.BoxGeometry(4, 0.1, 2.5);
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.2, metalness: 0.9 });
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 2; col++) {
      const solar = new THREE.Mesh(solarGeo, solarMat);
      solar.rotation.x = 0.15;
      solar.position.set(-2 + col * 4.5, 14.8, -5 + row * 3.5);
      scene.add(solar);
    }
  }

  // Entrance Canopy Wing
  const canopyGeo = new THREE.BoxGeometry(10, 0.4, 5);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(-2, 3.8, 9.5);
  scene.add(canopy);

  const exporter = new GLTFExporter();
  const publicDemoDir = path.join(process.cwd(), 'public', 'demo');

  if (!fs.existsSync(publicDemoDir)) {
    fs.mkdirSync(publicDemoDir, { recursive: true });
  }

  await new Promise((resolve) => {
    exporter.parse(
      scene,
      (gltf) => {
        const outputJson = JSON.stringify(gltf, null, 2);
        const glbPath = path.join(publicDemoDir, 'build.glb');
        const gltfPath = path.join(publicDemoDir, 'build.gltf');
        fs.writeFileSync(gltfPath, outputJson);
        fs.writeFileSync(glbPath, outputJson);
        console.log(`✅ Successfully written GLTF to ${glbPath}`);
        resolve();
      },
      (err) => {
        console.error('Error:', err);
        resolve();
      },
      { binary: false }
    );
  });
}

run();
