import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';
import { ModelMetrics } from './BuildingModel';
import { dimensionsFromExtents } from '../../utils/dimensions';
import { formatLength, LengthUnit } from '../../utils/units';

interface DimensionLinesProps {
  metrics: ModelMetrics | null;
  showDimensions: boolean;
  showBoundingBox: boolean;
  showLabels: boolean;
  isCalibrated: boolean;
  scaleFactor: number;
  unit: LengthUnit;
}

type V3 = [number, number, number];
const noRaycast = () => null;

const COLORS = { length: '#38bdf8', width: '#fbbf24', height: '#34d399' };

/** One dimension: extension lines from the model to the offset dimension line, end ticks, and a label. */
const Dimension: React.FC<{
  a: V3; // dimension-line start
  b: V3; // dimension-line end
  extA: [V3, V3]; // extension line from model to a
  extB: [V3, V3]; // extension line from model to b
  tick: V3; // tick direction (unit * size)
  color: string;
  text: string | null;
  tag: string;
  showLabel: boolean;
}> = ({ a, b, extA, extB, tick, color, text, tag, showLabel }) => {
  const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const tk = (p: V3): [V3, V3] => [
    [p[0] - tick[0], p[1] - tick[1], p[2] - tick[2]],
    [p[0] + tick[0], p[1] + tick[1], p[2] + tick[2]]
  ];
  const mat = { depthTest: false, transparent: true } as const;
  return (
    <group renderOrder={999}>
      <Line points={[a, b]} color={color} lineWidth={2.5} raycast={noRaycast} {...mat} renderOrder={999} />
      <Line points={extA} color={color} lineWidth={1} dashed dashSize={0.5} gapSize={0.35} opacity={0.7} raycast={noRaycast} {...mat} renderOrder={999} />
      <Line points={extB} color={color} lineWidth={1} dashed dashSize={0.5} gapSize={0.35} opacity={0.7} raycast={noRaycast} {...mat} renderOrder={999} />
      <Line points={tk(a)} color={color} lineWidth={3} raycast={noRaycast} {...mat} renderOrder={999} />
      <Line points={tk(b)} color={color} lineWidth={3} raycast={noRaycast} {...mat} renderOrder={999} />
      {showLabel && text && (
        <Html position={mid} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className="px-2 py-0.5 rounded font-mono text-xs font-bold whitespace-nowrap select-none pointer-events-none shadow-lg"
            style={{ background: 'rgba(6,9,19,0.88)', border: `1px solid ${color}`, color }}
          >
            {tag}: {text}
          </div>
        </Html>
      )}
    </group>
  );
};

export const DimensionLines: React.FC<DimensionLinesProps> = ({
  metrics,
  showDimensions,
  showBoundingBox,
  showLabels,
  isCalibrated,
  scaleFactor,
  unit
}) => {
  const geo = useMemo(() => {
    if (!metrics?.worldMin || !metrics?.worldMax) return null;
    const { worldMin: mn, worldMax: mx } = metrics;
    const dims = dimensionsFromExtents({ x: mx.x - mn.x, y: mx.y - mn.y, z: mx.z - mn.z });
    if (!dims) return null;
    const ext = Math.max(mx.x - mn.x, mx.y - mn.y, mx.z - mn.z);
    const off = ext * 0.08;
    const tk = ext * 0.015;
    const boxGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(mx.x - mn.x, mx.y - mn.y, mx.z - mn.z));
    const center: V3 = [(mn.x + mx.x) / 2, (mn.y + mx.y) / 2, (mn.z + mx.z) / 2];
    return { mn, mx, dims, off, tk, boxGeo, center };
  }, [metrics]);

  React.useEffect(() => () => geo?.boxGeo.dispose(), [geo]);

  if (!geo) return null;
  const { mn, mx, dims, off, tk, boxGeo, center } = geo;
  const fmt = (v: number) => formatLength(v, { calibrated: isCalibrated, scaleFactor, unit });

  // Length runs along the longer horizontal axis, width along the other. Dimension lines sit just outside the box
  // at floor level on the +Z / +X sides; height rises from the floor at the +X/+Z corner.
  const lx = dims.lengthAxis === 'x';
  const floorY = mn.y;
  const zOut = mx.z + off;
  const xOut = mx.x + off;

  const lenA: V3 = lx ? [mn.x, floorY, zOut] : [xOut, floorY, mn.z];
  const lenB: V3 = lx ? [mx.x, floorY, zOut] : [xOut, floorY, mx.z];
  const lenExtA: [V3, V3] = lx ? [[mn.x, floorY, mx.z], lenA] : [[mx.x, floorY, mn.z], lenA];
  const lenExtB: [V3, V3] = lx ? [[mx.x, floorY, mx.z], lenB] : [[mx.x, floorY, mx.z], lenB];
  const lenTick: V3 = lx ? [0, 0, tk] : [tk, 0, 0];

  // Width: the other horizontal axis, on the opposite outer side so labels never overlap the length line
  const widA: V3 = lx ? [xOut, floorY, mn.z] : [mn.x, floorY, zOut];
  const widB: V3 = lx ? [xOut, floorY, mx.z] : [mx.x, floorY, zOut];
  const widExtA: [V3, V3] = lx ? [[mx.x, floorY, mn.z], widA] : [[mn.x, floorY, mx.z], widA];
  const widExtB: [V3, V3] = lx ? [[mx.x, floorY, mx.z], widB] : [[mx.x, floorY, mx.z], widB];
  const widTick: V3 = lx ? [tk, 0, 0] : [0, 0, tk];

  // Height: vertical line past the +X/+Z corner (offset on both horizontal axes)
  const hx = xOut + off * 0.2;
  const hz = zOut + off * 0.2;
  const hgtA: V3 = [hx, mn.y, hz];
  const hgtB: V3 = [hx, mx.y, hz];
  const hgtExtA: [V3, V3] = [[mx.x, mn.y, mx.z], hgtA];
  const hgtExtB: [V3, V3] = [[mx.x, mx.y, mx.z], hgtB];

  return (
    <group>
      {showBoundingBox && (
        <lineSegments geometry={boxGeo} position={center} raycast={noRaycast} renderOrder={998}>
          <lineBasicMaterial color="#f472b6" transparent opacity={0.85} depthTest={false} />
        </lineSegments>
      )}
      {showDimensions && (
        <>
          <Dimension a={lenA} b={lenB} extA={lenExtA} extB={lenExtB} tick={lenTick} color={COLORS.length} text={fmt(dims.length)} tag="L" showLabel={showLabels} />
          <Dimension a={widA} b={widB} extA={widExtA} extB={widExtB} tick={widTick} color={COLORS.width} text={fmt(dims.width)} tag="W" showLabel={showLabels} />
          <Dimension a={hgtA} b={hgtB} extA={hgtExtA} extB={hgtExtB} tick={[tk, 0, 0]} color={COLORS.height} text={fmt(dims.height)} tag="H" showLabel={showLabels} />
        </>
      )}
    </group>
  );
};
