import React, { Suspense, useEffect, useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type EnvironmentId = 'default' | 'mountain';
export type EnvironmentStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Local, bundled asset (CC0). See public/assets/environments/README.md */
export const MOUNTAIN_URL = '/assets/environments/mountain-range.glb';

export const ENVIRONMENT_LABEL: Record<EnvironmentId, string> = {
  default: 'Default environment',
  mountain: 'Mountain environment'
};

/** CSS backdrop behind the transparent canvas, one per environment */
export const ENVIRONMENT_BACKDROP: Record<EnvironmentId, string | undefined> = {
  default: undefined, // the viewer's existing dark background (bg-aerospace-950)
  mountain: 'linear-gradient(to bottom, #5f93c4 0%, #9fc3e2 45%, #d6e4ef 72%, #c3cfbe 100%)'
};

const HORIZON = '#c9d9e8';

class MountainBoundary extends React.Component<
  { children: React.ReactNode; onError: (e: Error) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[Aero3D] Mountain environment failed to load:', error.message);
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Reports "loading" while its Suspense boundary is waiting for the asset. */
const LoadingPing: React.FC<{ onStatus: (s: EnvironmentStatus) => void }> = ({ onStatus }) => {
  useEffect(() => {
    onStatus('loading');
  }, [onStatus]);
  return null;
};

const MountainModel: React.FC<{ focusSize: number; onStatus: (s: EnvironmentStatus) => void }> = ({ focusSize, onStatus }) => {
  const { scene } = useGLTF(MOUNTAIN_URL);
  const { camera } = useThree();

  // Fit the range once from its real bounding box: wide enough to read as a backdrop, behind the project model.
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const footprint = Math.max(size.x, size.z) || 1;
    const target = Math.max(focusSize * 40, 120);
    const s = target / footprint;
    return {
      scale: s,
      // centre in x, push the range behind the model (-z) with its base just under the ground plane
      position: new THREE.Vector3(-center.x * s, -box.min.y * s - 0.05, -center.z * s - target * 0.6),
      extent: target
    };
  }, [scene, focusSize]);

  // Keep the whole range inside the camera frustum
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const prevFar = cam.far;
    cam.far = Math.max(prevFar, fit.extent * 8);
    cam.updateProjectionMatrix();
    return () => {
      cam.far = prevFar;
      cam.updateProjectionMatrix();
    };
  }, [camera, fit.extent]);

  useEffect(() => {
    onStatus('ready');
  }, [onStatus]);

  return (
    <>
      <fog attach="fog" args={[HORIZON, fit.extent * 0.9, fit.extent * 3.2]} />
      <hemisphereLight args={['#dbe9f7', '#6b6a55', 0.7]} />
      <directionalLight position={[fit.extent * 0.6, fit.extent * 0.8, fit.extent * 0.3]} intensity={1.1} color="#fff3e0" />
      {/* Ground apron so the range sits on terrain rather than floating in the sky */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, -fit.extent * 0.3]} receiveShadow>
        <circleGeometry args={[fit.extent * 3, 64]} />
        <meshStandardMaterial color="#6f7a62" roughness={1} metalness={0} />
      </mesh>
      {/* Original materials and textures are kept as authored */}
      <primitive object={scene} scale={fit.scale} position={fit.position} />
    </>
  );
};

interface EnvironmentLayerProps {
  environment: EnvironmentId;
  /** largest dimension of the project model (scene units); drives the mountain scale */
  focusSize: number;
  onStatus: (s: EnvironmentStatus) => void;
}

/**
 * Environment-specific scenery only. The project model, measurements, dimension lines, controls and the
 * base lighting rig live outside this component and are never touched when the environment changes.
 * "default" renders nothing, so the original viewer is unchanged.
 */
export const EnvironmentLayer: React.FC<EnvironmentLayerProps> = ({ environment, focusSize, onStatus }) => {
  useEffect(() => {
    if (environment === 'default') onStatus('idle');
  }, [environment, onStatus]);

  if (environment !== 'mountain') return null;
  return (
    <MountainBoundary onError={() => onStatus('error')}>
      <Suspense fallback={<LoadingPing onStatus={onStatus} />}>
        <MountainModel focusSize={focusSize} onStatus={onStatus} />
      </Suspense>
    </MountainBoundary>
  );
};

/**
 * Eases the camera to a lower, wider angle when entering the mountain environment so the horizon and peaks are
 * in frame, and back to where the user was when leaving. Only position is animated (the orbit target is kept),
 * and any user interaction cancels the move immediately.
 */
export const EnvironmentCamera: React.FC<{
  environment: EnvironmentId;
  controlsRef: React.MutableRefObject<any>;
  maxDimension: number;
  height: number;
}> = ({ environment, controlsRef, maxDimension, height }) => {
  const prev = React.useRef<EnvironmentId>(environment);
  const saved = React.useRef<THREE.Vector3 | null>(null);
  const anim = React.useRef<{ t: number; from: THREE.Vector3; to: THREE.Vector3 } | null>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || prev.current === environment) return;
    prev.current = environment;
    const cam: THREE.Camera = controls.object;
    const dist = (maxDimension || 20) * 1.55;
    let to: THREE.Vector3;
    if (environment === 'mountain') {
      saved.current = cam.position.clone();
      const dir = new THREE.Vector3(0.62, 0, 0.78); // keep the current side of the model, look toward the range
      to = new THREE.Vector3(dir.x * dist * 1.5, height / 2 + dist * 0.14, dir.z * dist * 1.5);
    } else {
      to = saved.current ? saved.current.clone() : cam.position.clone();
    }
    anim.current = { t: 0, from: cam.position.clone(), to };
    const stop = () => { anim.current = null; };
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [environment, controlsRef, maxDimension, height]);

  useFrame((_, dt) => {
    const a = anim.current;
    const controls = controlsRef.current;
    if (!a || !controls) return;
    a.t = Math.min(1, a.t + dt / 0.9);
    const e = a.t * a.t * (3 - 2 * a.t);
    controls.object.position.lerpVectors(a.from, a.to, e);
    controls.update();
    if (a.t >= 1) anim.current = null;
  });

  return null;
};
