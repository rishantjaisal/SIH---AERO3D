import React from 'react';
import { Html, Line } from '@react-three/drei';
import { Measurement3D } from '../../types';
import { formatLength, LengthUnit } from '../../utils/units';

interface MeasurementToolProps {
  activePoints: Array<[number, number, number]>;
  measurements: Measurement3D[];
  scaleFactor: number;
  isCalibrated: boolean;
  unit?: LengthUnit;
  showLabels?: boolean;
  pointRadius?: number;
}

export const MeasurementTool: React.FC<MeasurementToolProps> = ({
  activePoints,
  measurements,
  scaleFactor,
  isCalibrated,
  unit = 'm',
  showLabels = true,
  pointRadius = 0.25
}) => {
  return (
    <group>
      {/* Pending Active Measurement Line */}
      {activePoints.length > 0 && (
        <group>
          {activePoints.map((pt, idx) => (
            <mesh key={`active-pt-${idx}`} position={pt}>
              <sphereGeometry args={[pointRadius, 16, 16]} />
              <meshBasicMaterial color={0x38bdf8} />
            </mesh>
          ))}
          {activePoints.length === 2 && (
            <Line
              points={activePoints}
              color="#38bdf8"
              lineWidth={3}
              dashed={false}
            />
          )}
        </group>
      )}

      {/* Existing Saved Measurements */}
      {measurements.map((meas) => {
        if (meas.points.length < 2) return null;
        const [p1, p2] = meas.points;
        const midPoint: [number, number, number] = [
          (p1[0] + p2[0]) / 2,
          (p1[1] + p2[1]) / 2 + 0.5,
          (p1[2] + p2[2]) / 2
        ];

        return (
          <group key={meas.id}>
            {/* End Point Spheres */}
            <mesh position={p1}>
              <sphereGeometry args={[pointRadius * 0.8, 16, 16]} />
              <meshBasicMaterial color={0x10b981} />
            </mesh>
            <mesh position={p2}>
              <sphereGeometry args={[pointRadius * 0.8, 16, 16]} />
              <meshBasicMaterial color={0x10b981} />
            </mesh>

            {/* Connecting Measurement Line */}
            <Line
              points={[p1, p2]}
              color="#10b981"
              lineWidth={3}
            />

            {/* Value Overlay Label */}
            {showLabels && (
              <Html position={midPoint} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
                <div className="px-2.5 py-1 rounded bg-aerospace-900/90 border border-emerald-500/50 text-emerald-400 font-mono text-xs font-bold shadow-lg flex flex-col items-center whitespace-nowrap pointer-events-none">
                  <span>{formatLength(meas.value, { calibrated: isCalibrated, scaleFactor, unit }) ?? '—'}</span>
                  {!isCalibrated && (
                    <span className="text-[8px] text-amber-400 uppercase font-sans">Model units (uncalibrated)</span>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
