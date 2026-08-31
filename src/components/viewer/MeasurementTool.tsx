import React from 'react';
import { Html, Line } from '@react-three/drei';
import { Measurement3D } from '../../types';

interface MeasurementToolProps {
  activePoints: Array<[number, number, number]>;
  measurements: Measurement3D[];
  scaleFactor: number;
  isCalibrated: boolean;
}

export const MeasurementTool: React.FC<MeasurementToolProps> = ({
  activePoints,
  measurements,
  scaleFactor,
  isCalibrated
}) => {
  return (
    <group>
      {/* Pending Active Measurement Line */}
      {activePoints.length > 0 && (
        <group>
          {activePoints.map((pt, idx) => (
            <mesh key={`active-pt-${idx}`} position={pt}>
              <sphereGeometry args={[0.25, 16, 16]} />
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
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial color={0x10b981} />
            </mesh>
            <mesh position={p2}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial color={0x10b981} />
            </mesh>

            {/* Connecting Measurement Line */}
            <Line
              points={[p1, p2]}
              color="#10b981"
              lineWidth={3}
            />

            {/* Value Overlay Label */}
            <Html position={midPoint} center distanceFactor={25} zIndexRange={[100, 0]}>
              <div className="px-2.5 py-1 rounded bg-aerospace-900/90 border border-emerald-500/50 text-emerald-400 font-mono text-xs font-bold shadow-lg flex flex-col items-center whitespace-nowrap">
                <span>{meas.realValueMeter.toFixed(2)} m</span>
                {!isCalibrated && (
                  <span className="text-[8px] text-amber-400 uppercase font-sans">Relative Scale</span>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
