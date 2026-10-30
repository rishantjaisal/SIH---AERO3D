import React, { useMemo } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { LasCloud } from '../../lidar/las';
import { Point3D } from '../../lidar/measure';

export type ColorMode = 'elevation' | 'rgb' | 'classification' | 'change';
export type LidarTool = 'orbit' | 'distance' | 'polygon';

const ASPRS: Record<number, [number, number, number]> = {
  0: [0.5, 0.5, 0.5], 1: [0.7, 0.7, 0.7], 2: [0.58, 0.29, 0.0], 3: [0.13, 0.55, 0.13], 4: [0.2, 0.8, 0.2],
  5: [0.0, 0.4, 0.0], 6: [0.85, 0.2, 0.2], 7: [0.9, 0.1, 0.1], 9: [0.1, 0.3, 0.9], 17: [0.3, 0.3, 0.3],
};
export const CLASS_NAMES: Record<number, string> = {
  0: 'Never classified', 1: 'Unclassified', 2: 'Ground', 3: 'Low vegetation', 4: 'Medium vegetation',
  5: 'High vegetation', 6: 'Building', 7: 'Noise', 9: 'Water', 17: 'Bridge deck',
};
export const classColor = (c: number) => ASPRS[c] || [0.6, 0.6, 0.6];

/** Blue → cyan → green → yellow → red. */
export function elevationColor(z: number, lo: number, hi: number): [number, number, number] {
  if (hi <= lo) return [0.2, 0.6, 1.0];
  const t = Math.max(0, Math.min(1, (z - lo) / (hi - lo)));
  if (t < 0.25) { const s = t / 0.25; return [0, 0.2 + 0.6 * s, 1]; }
  if (t < 0.5) { const s = (t - 0.25) / 0.25; return [0, 0.8 + 0.2 * s, 1 - 0.8 * s]; }
  if (t < 0.75) { const s = (t - 0.5) / 0.25; return [s, 1, 0.2 - 0.2 * s]; }
  const s = (t - 0.75) / 0.25; return [1, 1 - 0.7 * s, 0];
}

/** Diverging ramp for elevation change: red = surface lowered, blue = raised, grey = unchanged / not compared. */
export function changeColor(dz: number, range: number): [number, number, number] {
  if (!isFinite(dz) || Math.abs(dz) < 0.05) return [0.35, 0.38, 0.45];
  const t = Math.min(1, Math.abs(dz) / range);
  return dz < 0 ? [0.5 + 0.5 * t, 0.25 * (1 - t), 0.2 * (1 - t)] : [0.2 * (1 - t), 0.45 * (1 - t) + 0.2, 0.6 + 0.4 * t];
}

interface Props {
  cloud: LasCloud;
  colorMode: ColorMode;
  pointSize: number;
  tool: LidarTool;
  picks: Point3D[];
  closePolygon: boolean;
  showGrid: boolean;
  showBox: boolean;
  change?: Float32Array | null;
  changeRange: number;
  onPick: (world: Point3D, index: number) => void;
}

export const LidarScene: React.FC<Props> = ({ cloud, colorMode, pointSize, tool, picks, closePolygon, showGrid, showBox, change, changeRange, onPick }) => {
  const center = useMemo<Point3D>(() => [
    (cloud.min[0] + cloud.max[0]) / 2, (cloud.min[1] + cloud.max[1]) / 2, (cloud.min[2] + cloud.max[2]) / 2,
  ], [cloud]);
  const size = useMemo<Point3D>(() => [cloud.max[0] - cloud.min[0], cloud.max[1] - cloud.min[1], cloud.max[2] - cloud.min[2]], [cloud]);

  // World (x east, y north, z up) -> three (x, z, -y), centred so float32 stays precise
  const toLocal = (p: Point3D): [number, number, number] => [p[0] - center[0], p[2] - center[2], -(p[1] - center[1])];

  const positions = useMemo(() => {
    const out = new Float32Array(cloud.count * 3);
    for (let i = 0; i < cloud.count; i++) {
      out[i * 3] = cloud.xyz[i * 3] - center[0];
      out[i * 3 + 1] = cloud.xyz[i * 3 + 2] - center[2];
      out[i * 3 + 2] = -(cloud.xyz[i * 3 + 1] - center[1]);
    }
    return out;
  }, [cloud, center]);

  const colors = useMemo(() => {
    const out = new Float32Array(cloud.count * 3);
    for (let i = 0; i < cloud.count; i++) {
      let c: [number, number, number];
      if (colorMode === 'rgb' && cloud.rgb) c = [cloud.rgb[i * 3] / 255, cloud.rgb[i * 3 + 1] / 255, cloud.rgb[i * 3 + 2] / 255];
      else if (colorMode === 'classification') c = classColor(cloud.classification[i]);
      else if (colorMode === 'change' && change) c = changeColor(change[i], changeRange);
      else c = elevationColor(cloud.xyz[i * 3 + 2], cloud.min[2], cloud.max[2]);
      out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2];
    }
    return out;
  }, [cloud, colorMode, change, changeRange]);

  const extent = Math.max(size[0], size[1], size[2], 1);
  const markerR = extent * 0.012;
  const linePts = picks.map(toLocal);
  const loop = closePolygon && linePts.length > 2 ? [...linePts, linePts[0]] : linePts;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (tool === 'orbit' || e.delta > 4 || e.index === undefined) return;
    e.stopPropagation();
    const i = e.index;
    onPick([cloud.xyz[i * 3], cloud.xyz[i * 3 + 1], cloud.xyz[i * 3 + 2]], i);
  };

  return (
    <Canvas
      camera={{ position: [extent * 0.9, extent * 0.8, extent * 1.1], fov: 45, near: 0.1, far: extent * 20 }}
      raycaster={{ params: { Points: { threshold: Math.max(0.15, extent * 0.004) } } as THREE.RaycasterParameters }}
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ cursor: tool === 'orbit' ? 'grab' : 'crosshair' }}
    >
      <color attach="background" args={['#060913']} />
      <points onClick={handleClick}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={pointSize} sizeAttenuation vertexColors />
      </points>

      {showGrid && <Grid position={[0, -size[2] / 2 - 0.01, 0]} args={[extent * 1.4, extent * 1.4]} cellSize={extent / 20} sectionSize={extent / 4} cellColor="#1e293b" sectionColor="#334155" fadeDistance={extent * 4} infiniteGrid={false} />}
      {showBox && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(size[0], size[2], size[1])]} />
          <lineBasicMaterial color="#38bdf8" />
        </lineSegments>
      )}
      {picks.map((p, i) => (
        <mesh key={i} position={toLocal(p)}>
          <sphereGeometry args={[markerR, 12, 12]} />
          <meshBasicMaterial color="#fbbf24" depthTest={false} />
        </mesh>
      ))}
      {loop.length > 1 && <Line points={loop} color="#fbbf24" lineWidth={2} depthTest={false} />}

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} target={[0, 0, 0]} maxDistance={extent * 6} />
    </Canvas>
  );
};
