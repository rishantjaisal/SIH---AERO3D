import React, { useMemo, useEffect, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Project } from '../../types';

export interface ModelMetrics {
  vertices: number;
  faces: number;
  meshes: number;
  boundingBox: { x: number; y: number; z: number };
  maxDimension: number;
  center: THREE.Vector3;
  size: THREE.Vector3;
  hasNativePointCloud: boolean;
}

interface BuildingModelProps {
  renderMode: 'textured' | 'wireframe' | 'solid' | 'pointcloud';
  project?: Project;
  onModelLoaded?: (metrics: ModelMetrics) => void;
  onHasPointcloudChange?: (hasPointCloud: boolean) => void;
}

const GLBModelMesh: React.FC<{
  url: string;
  renderMode: 'textured' | 'wireframe' | 'solid' | 'pointcloud';
  onModelLoaded?: (metrics: ModelMetrics) => void;
  onHasPointcloudChange?: (hasPointCloud: boolean) => void;
}> = ({ url, renderMode, onModelLoaded, onHasPointcloudChange }) => {
  const { scene } = useGLTF(url);

  // Compute metrics and bounding box once loaded
  const { clonedScene, metrics } = useMemo(() => {
    const cloned = scene.clone(true);
    let vertices = 0;
    let faces = 0;
    let meshes = 0;
    let hasNativePoints = false;

    cloned.traverse((child) => {
      if ((child as THREE.Points).isPoints) {
        hasNativePoints = true;
      }
      if ((child as THREE.Mesh).isMesh) {
        meshes++;
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry;
        if (geometry) {
          const posAttr = geometry.attributes.position;
          if (posAttr) {
            vertices += posAttr.count;
          }
          if (geometry.index) {
            faces += Math.floor(geometry.index.count / 3);
          } else if (posAttr) {
            faces += Math.floor(posAttr.count / 3);
          }
        }
      }
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z) || 10;

    // Center model at origin with bottom resting at y=0
    cloned.position.set(-center.x, -box.min.y, -center.z);

    const modelMetrics: ModelMetrics = {
      vertices,
      faces,
      meshes,
      boundingBox: {
        x: Number(size.x.toFixed(2)),
        y: Number(size.y.toFixed(2)),
        z: Number(size.z.toFixed(2))
      },
      maxDimension: maxDim,
      center,
      size,
      hasNativePointCloud: hasNativePoints
    };

    return { clonedScene: cloned, metrics: modelMetrics };
  }, [scene]);

  // Report metrics back to parent
  useEffect(() => {
    if (onModelLoaded) {
      onModelLoaded(metrics);
    }
    if (onHasPointcloudChange) {
      onHasPointcloudChange(metrics.hasNativePointCloud);
    }
  }, [metrics, onModelLoaded, onHasPointcloudChange]);

  // Apply render mode material overrides dynamically without mutating original textures permanently
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (renderMode === 'solid') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.5,
            metalness: 0.2,
            wireframe: false
          });
        } else if (renderMode === 'wireframe') {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              (mat as THREE.MeshStandardMaterial).wireframe = true;
            });
          } else if (mesh.material) {
            (mesh.material as THREE.MeshStandardMaterial).wireframe = true;
          }
        } else if (renderMode === 'textured') {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              (mat as THREE.MeshStandardMaterial).wireframe = false;
            });
          } else if (mesh.material) {
            (mesh.material as THREE.MeshStandardMaterial).wireframe = false;
          }
        }
      }
    });
  }, [clonedScene, renderMode]);

  return <primitive object={clonedScene} />;
};

class LocalGLTFBoundary extends React.Component<
  { children: React.ReactNode; fallbackUrl?: string; renderMode: 'textured' | 'wireframe' | 'solid' | 'pointcloud'; onModelLoaded?: (metrics: ModelMetrics) => void; onHasPointcloudChange?: (hasPointCloud: boolean) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('[Aero3D] Secondary GLB load notice:', error);
  }

  render() {
    if (this.state.hasError && this.props.fallbackUrl) {
      return (
        <Suspense fallback={null}>
          <GLBModelMesh
            url={this.props.fallbackUrl}
            renderMode={this.props.renderMode}
            onModelLoaded={this.props.onModelLoaded}
            onHasPointcloudChange={this.props.onHasPointcloudChange}
          />
        </Suspense>
      );
    }
    return this.props.children;
  }
}

export const BuildingModel: React.FC<BuildingModelProps> = ({
  renderMode,
  project,
  onModelLoaded,
  onHasPointcloudChange
}) => {
  const pName = (project?.name || '').toLowerCase();
  
  // Resolve best candidate model URL
  let targetUrl = project?.model_url || '/demo/build.glb';
  if (pName.includes('taj') || pName.includes('mahal') || pName.includes('tj')) {
    targetUrl = '/demo/taj_mahal_3d_model.glb';
  }

  return (
    <LocalGLTFBoundary
      fallbackUrl="/demo/build.glb"
      renderMode={renderMode}
      onModelLoaded={onModelLoaded}
      onHasPointcloudChange={onHasPointcloudChange}
    >
      <GLBModelMesh
        url={targetUrl}
        renderMode={renderMode}
        onModelLoaded={onModelLoaded}
        onHasPointcloudChange={onHasPointcloudChange}
      />
    </LocalGLTFBoundary>
  );
};
