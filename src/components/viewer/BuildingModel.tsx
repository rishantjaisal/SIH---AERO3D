import React, { useMemo, useEffect, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Project } from '../../types';

interface BuildingModelProps {
  renderMode: 'textured' | 'wireframe' | 'solid' | 'pointcloud';
  project?: Project;
}

// Simple hash generator for deterministic style variation per project
function getHashSeed(str: string = 'demo'): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const ProceduralBuilding: React.FC<BuildingModelProps> = ({ renderMode, project }) => {
  const isWireframe = renderMode === 'wireframe';
  const isPoints = renderMode === 'pointcloud';

  const meta = project?.metadata;
  const seed = getHashSeed(project?.id || project?.name || 'demo');

  // Dynamic geometry dimensions from project metadata
  const bBoxX = meta?.boundingBox?.x || 28;
  const bBoxY = meta?.boundingBox?.y || 14;
  const bBoxZ = meta?.boundingBox?.z || 18;

  const width = Math.max(16, Math.min(55, bBoxX));
  const height = Math.max(8, Math.min(30, bBoxY));
  const depth = Math.max(12, Math.min(45, bBoxZ));

  // Determine structural layout style based on seed & name
  const layoutStyle = useMemo(() => {
    const pName = (project?.name || '').toLowerCase();
    if (pName.includes('logistics') || pName.includes('industrial') || seed % 3 === 1) {
      return 'logistics';
    } else if (pName.includes('tower') || pName.includes('complex') || seed % 3 === 2) {
      return 'tower';
    }
    return 'academic'; // default style
  }, [seed, project?.name]);

  // Color palette variation based on project seed
  const colors = useMemo(() => {
    const paletteIndex = seed % 4;
    const baseBuildingColors = [0x334155, 0x1e293b, 0x475569, 0x0f172a];
    const baseWindowColors = [0x38bdf8, 0x0284c7, 0x34d399, 0x818cf8];
    const canopyColors = [0x0284c7, 0x10b981, 0x6366f1, 0xf59e0b];

    return {
      ground: renderMode === 'solid' ? 0x334155 : 0x1e293b,
      building: renderMode === 'solid' ? 0x64748b : baseBuildingColors[paletteIndex],
      window: renderMode === 'solid' ? 0x0284c7 : baseWindowColors[paletteIndex],
      roofParapet: 0x0f172a,
      hvac: 0x94a3b8,
      solar: 0x1e1b4b,
      canopy: canopyColors[paletteIndex],
      pillar: 0x64748b
    };
  }, [seed, renderMode]);

  // Materials system
  const materials = useMemo(() => ({
    ground: new THREE.MeshStandardMaterial({ color: colors.ground, roughness: 0.8, wireframe: isWireframe }),
    building: new THREE.MeshStandardMaterial({ color: colors.building, roughness: 0.4, metalness: 0.2, wireframe: isWireframe }),
    window: new THREE.MeshStandardMaterial({ color: colors.window, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.75, wireframe: isWireframe }),
    roofParapet: new THREE.MeshStandardMaterial({ color: colors.roofParapet, roughness: 0.6, wireframe: isWireframe }),
    hvac: new THREE.MeshStandardMaterial({ color: colors.hvac, roughness: 0.3, metalness: 0.6, wireframe: isWireframe }),
    solar: new THREE.MeshStandardMaterial({ color: colors.solar, roughness: 0.2, metalness: 0.9, wireframe: isWireframe }),
    canopy: new THREE.MeshStandardMaterial({ color: colors.canopy, roughness: 0.3, metalness: 0.5, wireframe: isWireframe }),
    pillar: new THREE.MeshStandardMaterial({ color: colors.pillar, metalness: 0.8, wireframe: isWireframe })
  }), [colors, isWireframe]);

  const numFloors = Math.max(2, Math.floor(height / 3.5));

  if (isPoints) {
    return (
      <group position={[0, 0, 0]}>
        {/* Synthetic Point Cloud Sized to Project Dimensions */}
        <points position={[0, height / 2, 0]}>
          <boxGeometry args={[width + 4, height + 2, depth + 4, 30, 20, 25]} />
          <pointsMaterial size={0.15} color={colors.window} sizeAttenuation />
        </points>
        <points position={[0, -0.2, 0]}>
          <boxGeometry args={[width + 30, 0.4, depth + 30, 40, 2, 40]} />
          <pointsMaterial size={0.12} color={0x64748b} sizeAttenuation />
        </points>
      </group>
    );
  }

  return (
    <group position={[0, 0, 0]}>
      
      {/* Base Courtyard Ground Terrain */}
      <mesh position={[0, -0.2, 0]} material={materials.ground} receiveShadow castShadow>
        <boxGeometry args={[width + 30, 0.4, depth + 30]} />
      </mesh>

      {/* Perimeter Curb Line */}
      <mesh position={[0, 0.05, depth / 2 + 8]} material={materials.canopy}>
        <boxGeometry args={[width + 20, 0.05, 0.4]} />
      </mesh>

      {/* STYLE A: Academic Main Building */}
      {layoutStyle === 'academic' && (
        <group>
          {/* Main Core Structure */}
          <mesh position={[0, height / 2, 0]} material={materials.building} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
          </mesh>

          {/* Facade Windows Grid */}
          {Array.from({ length: numFloors }).map((_, floorIdx) => {
            const yPos = (floorIdx + 1) * (height / (numFloors + 1));
            return Array.from({ length: 6 }).map((_, colIdx) => {
              const xPos = -width / 2 + (colIdx + 0.8) * (width / 6.5);
              return (
                <group key={`win-a-${floorIdx}-${colIdx}`}>
                  {/* Front Windows */}
                  <mesh position={[xPos, yPos, depth / 2 + 0.1]} material={materials.window}>
                    <boxGeometry args={[width / 8, height / (numFloors * 1.8), 0.2]} />
                  </mesh>
                  {/* Back Windows */}
                  <mesh position={[xPos, yPos, -depth / 2 - 0.1]} material={materials.window}>
                    <boxGeometry args={[width / 8, height / (numFloors * 1.8), 0.2]} />
                  </mesh>
                </group>
              );
            });
          })}

          {/* Roof Parapet */}
          <mesh position={[0, height + 0.4, 0]} material={materials.roofParapet} castShadow>
            <boxGeometry args={[width + 0.4, 0.8, depth + 0.4]} />
          </mesh>

          {/* HVAC Units on Roof */}
          <mesh position={[-width / 3, height + 1.4, -depth / 4]} material={materials.hvac} castShadow>
            <boxGeometry args={[width / 7, 1.8, depth / 6]} />
          </mesh>

          {/* Entrance Canopy */}
          <mesh position={[0, 3.8, depth / 2 + 2.5]} material={materials.canopy} castShadow>
            <boxGeometry args={[width / 2.5, 0.4, 5]} />
          </mesh>
          <mesh position={[-width / 6, 1.9, depth / 2 + 4.5]} material={materials.pillar} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 3.8]} />
          </mesh>
          <mesh position={[width / 6, 1.9, depth / 2 + 4.5]} material={materials.pillar} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 3.8]} />
          </mesh>

          {/* Side Annex Wing */}
          <mesh position={[width / 2 + 6, height / 3, 0]} material={materials.building} castShadow receiveShadow>
            <boxGeometry args={[12, height / 1.5, depth - 4]} />
          </mesh>
        </group>
      )}

      {/* STYLE B: Industrial Logistics Complex */}
      {layoutStyle === 'logistics' && (
        <group>
          {/* Main Warehouse Sprawl */}
          <mesh position={[0, height / 2, 0]} material={materials.building} castShadow receiveShadow>
            <boxGeometry args={[width + 10, height, depth + 10]} />
          </mesh>

          {/* High-Bay Clerestory Roof Skylights */}
          {[-width / 3, 0, width / 3].map((xOffset, i) => (
            <mesh key={`skylight-${i}`} position={[xOffset, height + 1, 0]} material={materials.window} castShadow>
              <boxGeometry args={[4, 1.6, depth + 8]} />
            </mesh>
          ))}

          {/* Loading Dock Canopy Front */}
          <mesh position={[0, 4, (depth + 10) / 2 + 4]} material={materials.canopy} castShadow>
            <boxGeometry args={[width + 6, 0.5, 8]} />
          </mesh>

          {/* Heavy Utility Rooftop Towers */}
          <mesh position={[-width / 4, height + 2, -depth / 3]} material={materials.hvac} castShadow>
            <boxGeometry args={[6, 3.5, 6]} />
          </mesh>
          <mesh position={[width / 4, height + 2, -depth / 3]} material={materials.hvac} castShadow>
            <boxGeometry args={[6, 3.5, 6]} />
          </mesh>
        </group>
      )}

      {/* STYLE C: Multi-Tiered High-Rise Tower */}
      {layoutStyle === 'tower' && (
        <group>
          {/* Lower Base Podium */}
          <mesh position={[0, height / 3, 0]} material={materials.building} castShadow receiveShadow>
            <boxGeometry args={[width + 8, height / 1.5, depth + 8]} />
          </mesh>

          {/* Mid-Tier Tower Core */}
          <mesh position={[0, height + height / 3, 0]} material={materials.building} castShadow receiveShadow>
            <boxGeometry args={[width - 4, height, depth - 4]} />
          </mesh>

          {/* Upper Crown Tier */}
          <mesh position={[0, height * 2, 0]} material={materials.canopy} castShadow>
            <boxGeometry args={[width - 10, 2.5, depth - 10]} />
          </mesh>

          {/* Curtain Wall Glass Elevation */}
          <mesh position={[0, height + height / 3, depth / 2 - 1.8]} material={materials.window}>
            <boxGeometry args={[width - 6, height - 1, 0.3]} />
          </mesh>

          {/* Spire Antenna */}
          <mesh position={[0, height * 2 + 4, 0]} material={materials.pillar}>
            <cylinderGeometry args={[0.15, 0.4, 8]} />
          </mesh>
        </group>
      )}

    </group>
  );
};

const GLBModelMesh: React.FC<{ url: string; renderMode: string }> = ({ url, renderMode }) => {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          (mesh.material as any).wireframe = renderMode === 'wireframe';
        }
      }
    });
  }, [clonedScene, renderMode]);

  return <primitive object={clonedScene} position={[0, 0, 0]} />;
};

export const BuildingModel: React.FC<BuildingModelProps> = (props) => {
  const modelUrl = props.project?.model_url || '/demo/build.glb';

  return (
    <Suspense fallback={<ProceduralBuilding {...props} />}>
      {modelUrl ? (
        <GLBModelMesh url={modelUrl} renderMode={props.renderMode} />
      ) : (
        <ProceduralBuilding {...props} />
      )}
    </Suspense>
  );
};
