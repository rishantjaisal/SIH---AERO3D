import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { story, sm, clamp, prefersReducedMotion } from './story';
import { resolveHeroModelUrl, FALLBACK_MODEL_URL } from './heroModel';

/**
 * Scroll-driven hero scene: the project's real photogrammetry model (public/models/hero/hero-building.glb, falling back to public/demo/build.glb) sits on a
 * "digital twin" base plate. As the page scrolls a survey drone flies a lawnmower pattern, the point
 * cloud accumulates, the mesh wireframe is built, and finally AI-style detections + measurements appear.
 */

const SITE_WIDTH = 72; // world units the model is scaled to (longest horizontal side)

const CYAN = 0x38bdf8;
const AMBER = 0xfbbf24;

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Soft radial sprite texture used for glows. */
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.4)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Dusk sky gradient as scene background. */
function makeSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#04060f');
  g.addColorStop(0.45, '#0a1630');
  g.addColorStop(0.78, '#173152');
  g.addColorStop(0.93, '#2c4a6e');
  g.addColorStop(1, '#4b5d78');
  x.fillStyle = g;
  x.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/* Shared scene refs (mutated each frame, not React state)             */
/* ------------------------------------------------------------------ */
interface Shared {
  solidPlane: THREE.Plane; // keeps x <= constant
  wirePlane: THREE.Plane; // keeps x >= -constant
  cloudPlane: THREE.Plane; // keeps x <= constant (accumulating point cloud)
  meshPlane: THREE.Plane; // keeps x <= constant (wireframe build-up)
  solidMats: THREE.MeshBasicMaterial[];
  wireMat: THREE.MeshBasicMaterial | null;
  cloudMat: THREE.PointsMaterial | null;
  slab: THREE.Mesh | null;
  slabMat: THREE.ShaderMaterial | null;
  tag: Array<THREE.Vector3>;
  site: { w: number; d: number; h: number; towerTop: THREE.Vector3 };
  ready: boolean;
  introAt: number;
}

function makeShared(): Shared {
  return {
    solidPlane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 999),
    wirePlane: new THREE.Plane(new THREE.Vector3(1, 0, 0), -999),
    cloudPlane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), -60),
    meshPlane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), -60),
    solidMats: [],
    wireMat: null,
    cloudMat: null,
    slab: null,
    slabMat: null,
    tag: [],
    site: { w: SITE_WIDTH, d: 33, h: 30, towerTop: v3(17, 30, 6) },
    ready: false,
    introAt: 0
  };
}

/* ------------------------------------------------------------------ */
/* Photogrammetry model + point cloud + wireframe                      */
/* ------------------------------------------------------------------ */
const SiteModel: React.FC<{ shared: Shared; url: string }> = ({ shared, url }) => {
  const gltf = useGLTF(url);
  const { gl } = useThree();

  const built = useMemo(() => {
    const root = gltf.scene.clone(true);
    const holder = new THREE.Group();
    holder.add(root);

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = SITE_WIDTH / Math.max(size.x, size.z);
    holder.scale.setScalar(s);
    holder.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    holder.updateMatrixWorld(true);

    // Unlit, texture-faithful material: the photogrammetry texture already contains baked lighting.
    const meshes: THREE.Mesh[] = [];
    root.traverse(o => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });

    const solidMats: THREE.MeshBasicMaterial[] = [];
    const wireMat = new THREE.MeshBasicMaterial({
      color: CYAN,
      wireframe: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      clippingPlanes: [shared.wirePlane, shared.meshPlane]
    });

    // Read texture pixels once so the sampled point cloud carries the real colours.
    const readPixels = (tex: THREE.Texture | null) => {
      if (!tex || !tex.image) return null;
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 1024;
        const x = c.getContext('2d', { willReadFrequently: true })!;
        x.drawImage(tex.image as CanvasImageSource, 0, 0, 1024, 1024);
        return x.getImageData(0, 0, 1024, 1024).data;
      } catch {
        return null;
      }
    };

    const P: number[] = [];
    const C: number[] = [];
    const tmp = new THREE.Vector3();
    let vertexCount = 0;
    let triCount = 0;

    meshes.forEach(m => {
      const old = m.material as THREE.MeshStandardMaterial;
      const map = old.map || null;
      if (map) {
        map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        map.needsUpdate = true;
      }
      const mat = new THREE.MeshBasicMaterial({
        map,
        color: 0xffffff,
        toneMapped: false,
        clippingPlanes: [shared.solidPlane]
      });
      m.material = mat;
      solidMats.push(mat);

      const pos = m.geometry.attributes.position;
      const uv = m.geometry.attributes.uv;
      vertexCount += pos.count;
      triCount += m.geometry.index ? m.geometry.index.count / 3 : pos.count / 3;
      const px = readPixels(map);
      for (let i = 0; i < pos.count; i += 2) {
        tmp.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(m.matrixWorld);
        P.push(tmp.x, tmp.y, tmp.z);
        if (px && uv) {
          const u = ((uv.getX(i) % 1) + 1) % 1;
          const w = ((uv.getY(i) % 1) + 1) % 1;
          const k = (Math.min(1023, (w * 1024) | 0) * 1024 + Math.min(1023, (u * 1024) | 0)) * 4;
          C.push(Math.pow(px[k] / 255, 2.2) * 1.6, Math.pow(px[k + 1] / 255, 2.2) * 1.6, Math.pow(px[k + 2] / 255, 2.2) * 1.6);
        } else {
          C.push(0.3, 0.7, 1);
        }
      }
      const wire = new THREE.Mesh(m.geometry, wireMat);
      m.add(wire);
    });

    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    pg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    const cloudMat = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      clippingPlanes: [shared.cloudPlane]
    });
    const cloud = new THREE.Points(pg, cloudMat);

    // Highest vertex = tower top (used to anchor the measurement lines and tags)
    let top = v3(0, 0, 0);
    let maxY = -Infinity;
    for (let i = 0; i < P.length; i += 3) {
      if (P[i + 1] > maxY) {
        maxY = P[i + 1];
        top = v3(P[i], P[i + 1], P[i + 2]);
      }
    }

    // Ground height helper for tag anchors
    const rc = new THREE.Raycaster();
    const heightAt = (x: number, z: number) => {
      rc.set(v3(x, 120, z), v3(0, -1, 0));
      const hit = rc.intersectObjects(meshes, false)[0];
      return hit ? hit.point.y : 0;
    };

    shared.solidMats = solidMats;
    shared.wireMat = wireMat;
    shared.cloudMat = cloudMat;
    shared.site = {
      w: size.x * s,
      d: size.z * s,
      h: size.y * s,
      towerTop: top
    };
    story.stats = { vertices: vertexCount, triangles: Math.round(triCount), points: P.length / 3 };

    return { holder, cloud, heightAt, top };
  }, [gltf, gl, shared]);

  // Tag anchors on notable parts of the site (positions are in world units, relative to the model centre)
  useEffect(() => {
    const { heightAt, top } = built;
    const w = shared.site.w;
    const d = shared.site.d;
    const spots: Array<[number, number]> = [
      [top.x, top.z], // high-rise
      [w * 0.33, -d * 0.45], // dome
      [-w * 0.06, d * 0.02], // road corridor
      [-w * 0.4, -d * 0.05] // residential blocks
    ];
    shared.tag = spots.map(([x, z], i) => v3(x, heightAt(x, z) + (i === 0 ? 0 : 1.5), z));
    shared.ready = true;
    story.ready = true;
  }, [built, shared]);

  return (
    <group>
      <primitive object={built.holder} />
      <primitive object={built.cloud} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Base plate, ground, stars, dust                                     */
/* ------------------------------------------------------------------ */
const Stage: React.FC<{ shared: Shared }> = ({ shared }) => {
  const dust = useRef<THREE.Points>(null);
  const edge = useRef<THREE.LineSegments>(null);

  const stars = useMemo(() => {
    const a: number[] = [];
    let seed = 7;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 1400; i++) {
      const u = r() * 6.283;
      const v = Math.acos(2 * r() - 1);
      a.push(520 * Math.sin(v) * Math.cos(u), Math.abs(520 * Math.cos(v)) * 0.8 + 20, 520 * Math.sin(v) * Math.sin(u));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    return g;
  }, []);

  const dustGeo = useMemo(() => {
    const a: number[] = [];
    let seed = 11;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 380; i++) a.push((r() - 0.5) * 220, r() * 70 + 2, (r() - 0.5) * 160);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    return g;
  }, []);

  const plate = useMemo(() => {
    const w = SITE_WIDTH + 8;
    const d = 33 + 8;
    return { w, d, edges: new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 1.4, d)) };
  }, []);

  const polar = useMemo(() => new THREE.PolarGridHelper(190, 32, 16, 96, CYAN, CYAN), []);
  useEffect(() => {
    const m = polar.material as THREE.Material;
    m.transparent = true;
    m.opacity = 0.09;
  }, [polar]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (dust.current) {
      dust.current.rotation.y = t * 0.01;
      dust.current.position.y = Math.sin(t * 0.2) * 1.2;
    }
    const p = story.current;
    const wRec = sm(0.34, 0.42, p) * (1 - sm(0.6, 0.68, p));
    (polar.material as THREE.Material).opacity = 0.08 + 0.2 * wRec;
    if (edge.current) (edge.current.material as THREE.LineBasicMaterial).opacity = 0.35 + 0.35 * Math.sin(t * 1.4) * 0.5 + 0.2 * wRec;
  });

  return (
    <group>
      <points geometry={stars}>
        <pointsMaterial size={1.5} sizeAttenuation={false} color={0xcfe3ff} transparent opacity={0.6} fog={false} />
      </points>
      <points ref={dust} geometry={dustGeo}>
        <pointsMaterial size={0.35} color={0x9fd8ff} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* ground */}
      <mesh rotation-x={-Math.PI / 2} position-y={-1.45}>
        <circleGeometry args={[520, 72]} />
        <meshStandardMaterial color={0x0a1322} roughness={0.95} metalness={0.05} />
      </mesh>
      <primitive object={polar} position-y={-1.4} />

      {/* digital-twin base plate */}
      <mesh position-y={-0.72} receiveShadow>
        <boxGeometry args={[plate.w, 1.4, plate.d]} />
        <meshStandardMaterial color={0x16294a} emissive={0x0b1d38} emissiveIntensity={0.9} roughness={0.5} metalness={0.4} />
      </mesh>
      <lineSegments ref={edge} geometry={plate.edges} position-y={-0.72}>
        <lineBasicMaterial color={CYAN} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Survey drone: flight path, photo footprints, scan cone              */
/* ------------------------------------------------------------------ */
const FLIGHT_Y = 42;
const ROWS = [-13, -4.5, 4.5, 13];

const Drone: React.FC<{ shared: Shared }> = ({ shared }) => {
  const drone = useRef<THREE.Group>(null);
  const rig = useRef<THREE.Group>(null);
  const rotors = useRef<Array<{ g: THREE.Group; d: number }>>([]);
  const leds = useRef<Array<{ s: THREE.Sprite; front: boolean }>>([]);
  const gimGlow = useRef<THREE.Sprite>(null);
  const beamMat = useRef<THREE.ShaderMaterial>(null);
  const beamWire = useRef<THREE.Mesh>(null);
  const beamRing = useRef<THREE.Mesh>(null);
  const footprints = useRef<THREE.LineLoop[]>([]);
  const pathLine = useRef<THREE.Line>(null);
  const trailRef = useRef<THREE.Line>(null);
  const state = useRef({ yaw: 0, bank: 0, pitch: 0, lastU: 0, nextFp: 0, fpi: 0, trail: [] as THREE.Vector3[] });

  const glowTex = useMemo(() => makeGlowTexture(), []);

  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    ROWS.forEach((z, i) => {
      const a = i % 2 ? [40, -40] : [-40, 40];
      pts.push(v3(a[0], FLIGHT_Y, z), v3(a[1], FLIGHT_Y, z));
    });
    const cp = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < pts.length - 1; i++) cp.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    return { cp, pts };
  }, []);

  const pathGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(curve.pts), [curve]);
  useEffect(() => {
    pathLine.current?.computeLineDistances();
  }, []);

  const TN = 90;
  const trail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TN * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TN * 3), 3));
    return g;
  }, []);

  const pathObj = useMemo(
    () => new THREE.Line(pathGeo, new THREE.LineDashedMaterial({ color: AMBER, dashSize: 3, gapSize: 2, transparent: true, opacity: 0 })),
    [pathGeo]
  );
  const trailObj = useMemo(() => {
    const l = new THREE.Line(
      trail,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    l.frustumCulled = false;
    return l;
  }, [trail]);

  const fpGeo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([v3(-7, 0, -5), v3(7, 0, -5), v3(7, 0, 5), v3(-7, 0, 5)]),
    []
  );

  // Materials
  const mats = useMemo(
    () => ({
      white: new THREE.MeshStandardMaterial({ color: 0xe8eef3, roughness: 0.32, metalness: 0.25 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x1c2630, roughness: 0.5, metalness: 0.6 }),
      accent: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.4, emissive: 0x0b4f73, emissiveIntensity: 0.8 }),
      lens: new THREE.MeshStandardMaterial({ color: 0x050a10, roughness: 0.1, metalness: 0.9 }),
      disc: new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
      ring: new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    }),
    []
  );

  const beamShader = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { o: { value: 0 }, t: { value: 0 } },
        vertexShader: 'varying float vY;void main(){vY=position.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'uniform float o;uniform float t;varying float vY;void main(){float k=clamp((vY+20.)/40.,0.,1.);float scan=.65+.35*sin(vY*1.8-t*5.);gl_FragColor=vec4(mix(vec3(.22,.74,.97),vec3(.98,.75,.14),1.-k),pow(k,1.7)*.32*scan*o);}'
      }),
    []
  );

  const armData = useMemo(() => {
    const R = 2.15;
    return ([[1, 1], [-1, 1], [1, -1], [-1, -1]] as Array<[number, number]>).map(([sx, sz]) => {
      const dir = new THREE.Vector3(sx, 0, sz).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), dir);
      return { sx, sz, R, q, front: sz > 0 };
    });
  }, []);

  useFrame(({ clock }, dtRaw) => {
    const d = drone.current;
    const rg = rig.current;
    if (!d || !rg) return;
    const t = clock.getElapsedTime();
    const dt = Math.min(0.1, dtRaw);
    const p = story.current;
    const st = state.current;

    const wCap = sm(0.1, 0.2, p) * (1 - sm(0.36, 0.44, p));
    const dv = 1 - sm(0.4, 0.48, p);
    const visible = dv > 0.01 && shared.ready;
    d.visible = visible;
    d.scale.setScalar(Math.max(0.0001, dv) * 1.9);

    const u = (t * 0.03) % 1;
    const pos = curve.cp.getPointAt(u);
    if (u < st.lastU) st.trail.length = 0;
    st.lastU = u;
    d.position.copy(pos);

    const k = 1 - Math.pow(0.001, dt);
    const tan = curve.cp.getTangentAt(u);
    const yawT = Math.atan2(tan.x, tan.z);
    let dy = yawT - st.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    st.yaw += dy * Math.min(1, k * 1.4);
    st.bank += (clamp(-dy * 1.1, -0.55, 0.55) - st.bank) * Math.min(1, k * 1.2);
    st.pitch += (0.13 - st.pitch) * Math.min(1, k);
    rg.rotation.set(st.pitch, st.yaw, st.bank, 'YXZ');
    rg.position.y = Math.sin(t * 2.1) * 0.14;

    rotors.current.forEach(r => (r.g.rotation.y = t * 38 * r.d));
    const blink = Math.sin(t * 7) > 0.2 ? 1 : 0.2;
    leds.current.forEach(l => ((l.s.material as THREE.SpriteMaterial).opacity = l.front ? 0.95 : blink));
    if (gimGlow.current) {
      const g = 2.4 + Math.sin(t * 5) * 0.35;
      gimGlow.current.scale.set(g, g, 1);
    }

    beamShader.uniforms.o.value = wCap;
    beamShader.uniforms.t.value = t;
    if (beamWire.current) (beamWire.current.material as THREE.MeshBasicMaterial).opacity = 0.12 * wCap;
    if (beamRing.current) (beamRing.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * wCap;
    if (pathLine.current) (pathLine.current.material as THREE.LineDashedMaterial).opacity = 0.65 * wCap;

    // motion trail
    const tr = trailRef.current;
    if (tr) {
      const last = st.trail[st.trail.length - 1];
      if (!last || last.distanceToSquared(pos) > 0.5) {
        st.trail.push(pos.clone());
        if (st.trail.length > TN) st.trail.shift();
      }
      const n = st.trail.length;
      tr.visible = visible && wCap > 0.02 && n > 1;
      if (tr.visible) {
        const pa = trail.attributes.position as THREE.BufferAttribute;
        const ca = trail.attributes.color as THREE.BufferAttribute;
        for (let i = 0; i < TN; i++) {
          const j = i - (TN - n);
          const pt = st.trail[Math.max(0, j)];
          const f = j < 0 ? 0 : Math.pow((j + 1) / n, 2) * 0.85 * wCap;
          pa.setXYZ(i, pt.x, pt.y - 0.5, pt.z);
          ca.setXYZ(i, 0.98 * f, 0.75 * f, 0.14 * f);
        }
        pa.needsUpdate = true;
        ca.needsUpdate = true;
      }
    }

    // photo footprints projected onto the site
    if (t > st.nextFp && wCap > 0.1 && shared.ready) {
      st.nextFp = t + 0.42;
      const f = footprints.current[st.fpi++ % footprints.current.length];
      if (f) {
        f.position.set(pos.x, 1.4, pos.z);
        f.userData.age = 0;
      }
    }
    footprints.current.forEach(f => {
      f.userData.age += dt;
      const a = f.userData.age;
      (f.material as THREE.LineBasicMaterial).opacity = a > 7 ? 0 : Math.max(0, (a < 0.2 ? 1 : 0.55) * (1 - a / 7)) * Math.min(1, wCap * 2);
    });
  });

  return (
    <group>
      <primitive object={pathObj} ref={pathLine} />
      <primitive object={trailObj} ref={trailRef} />

      {Array.from({ length: 26 }).map((_, i) => (
        <lineLoop
          key={i}
          geometry={fpGeo}
          renderOrder={5}
          userData={{ age: 99 }}
          ref={(el: THREE.LineLoop | null) => {
            if (el) footprints.current[i] = el;
          }}
        >
          <lineBasicMaterial color={AMBER} transparent opacity={0} depthTest={false} blending={THREE.AdditiveBlending} />
        </lineLoop>
      ))}

      <group ref={drone}>
        <group ref={rig} rotation-order="YXZ">
          {/* fuselage */}
          <mesh rotation-x={Math.PI / 2} scale={[1, 1, 0.62]} material={mats.white}>
            <capsuleGeometry args={[0.78, 1.5, 8, 24]} />
          </mesh>
          <mesh position={[0, 0.28, 0.3]} scale={[1, 0.55, 1.6]} material={mats.dark}>
            <sphereGeometry args={[0.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.5, -0.6]} material={mats.accent}>
            <boxGeometry args={[0.14, 0.05, 0.9]} />
          </mesh>
          <mesh position={[0, -0.2, -1.25]} material={mats.dark}>
            <boxGeometry args={[1.1, 0.22, 0.5]} />
          </mesh>

          {/* arms, motors, props, LEDs */}
          {armData.map((a, i) => (
            <group key={i}>
              <mesh position={[(a.sx * a.R) / 2, 0.02, (a.sz * a.R) / 2]} quaternion={a.q} material={mats.dark}>
                <cylinderGeometry args={[0.1, 0.15, a.R * 1.414, 10]} />
              </mesh>
              <mesh position={[a.sx * a.R, 0.1, a.sz * a.R]} material={mats.white}>
                <cylinderGeometry args={[0.27, 0.3, 0.4, 20]} />
              </mesh>
              <group
                position={[a.sx * a.R, 0.34, a.sz * a.R]}
                ref={(el: THREE.Group | null) => {
                  if (el) rotors.current[i] = { g: el, d: a.sx * a.sz };
                }}
              >
                <mesh material={mats.dark}>
                  <boxGeometry args={[2.7, 0.025, 0.2]} />
                </mesh>
                <mesh material={mats.accent}>
                  <sphereGeometry args={[0.14, 12, 8]} />
                </mesh>
              </group>
              <mesh position={[a.sx * a.R, 0.34, a.sz * a.R]} rotation-x={-Math.PI / 2} material={mats.disc}>
                <circleGeometry args={[1.38, 40]} />
              </mesh>
              <mesh position={[a.sx * a.R, 0.34, a.sz * a.R]} rotation-x={-Math.PI / 2} material={mats.ring}>
                <ringGeometry args={[1.28, 1.38, 48]} />
              </mesh>
              <sprite
                position={[a.sx * a.R, -0.1, a.sz * a.R]}
                scale={[1.7, 1.7, 1]}
                ref={(el: THREE.Sprite | null) => {
                  if (el) leds.current[i] = { s: el, front: a.front };
                }}
              >
                <spriteMaterial map={glowTex} color={a.front ? AMBER : 0xff4d6d} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
              </sprite>
            </group>
          ))}

          {/* landing skids */}
          {[-1, 1].map(s => (
            <group key={s}>
              <mesh position={[s * 0.95, -1.0, 0]} rotation-x={Math.PI / 2} material={mats.dark}>
                <cylinderGeometry args={[0.05, 0.05, 2.7, 8]} />
              </mesh>
              {[-0.7, 0.7].map(z => (
                <mesh key={z} position={[s * 0.88, -0.62, z]} rotation-z={-s * 0.22} material={mats.dark}>
                  <cylinderGeometry args={[0.045, 0.045, 0.8, 8]} />
                </mesh>
              ))}
            </group>
          ))}

          {/* gimbal camera */}
          <mesh position={[0, -0.52, 1.0]} material={mats.dark}>
            <sphereGeometry args={[0.32, 20, 14]} />
          </mesh>
          <mesh position={[0, -0.52, 1.27]} rotation-x={Math.PI / 2} material={mats.lens}>
            <cylinderGeometry args={[0.16, 0.16, 0.22, 16]} />
          </mesh>
          <mesh position={[0, -0.52, 1.4]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
            <meshBasicMaterial color={AMBER} />
          </mesh>
          <mesh position={[0, -0.52, 1.0]} rotation-y={Math.PI / 2} material={mats.accent}>
            <torusGeometry args={[0.38, 0.03, 8, 32]} />
          </mesh>
          <sprite ref={gimGlow} position={[0, -0.52, 1.45]} scale={[2.4, 2.4, 1]}>
            <spriteMaterial map={glowTex} color={AMBER} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
          </sprite>
        </group>

        {/* scan cone stays vertical (outside the banking rig) */}
        <mesh position={[0, -FLIGHT_Y / 2, 0]} material={beamShader}>
          <coneGeometry args={[11, FLIGHT_Y, 48, 1, true]} />
        </mesh>
        <mesh ref={beamWire} position={[0, -FLIGHT_Y / 2, 0]}>
          <coneGeometry args={[11, FLIGHT_Y, 24, 1, true]} />
          <meshBasicMaterial color={AMBER} wireframe transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh ref={beamRing} position={[0, -FLIGHT_Y + 1.4, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[10.2, 11, 64]} />
          <meshBasicMaterial color={AMBER} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Measurement lines + detection brackets (analysis stage)             */
/* ------------------------------------------------------------------ */
const Analysis: React.FC<{ shared: Shared }> = ({ shared }) => {
  const heightLine = useRef<THREE.Line>(null);
  const spanLine = useRef<THREE.Line>(null);
  const caps = useRef<THREE.Group>(null);
  const boxes = useRef<THREE.Group>(null);

  const hGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    return g;
  }, []);
  const sGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    return g;
  }, []);

  const hObj = useMemo(() => {
    const l = new THREE.Line(hGeo, new THREE.LineBasicMaterial({ color: AMBER, transparent: true, opacity: 0, depthTest: false, blending: THREE.AdditiveBlending }));
    l.visible = false;
    l.renderOrder = 6;
    l.frustumCulled = false;
    return l;
  }, [hGeo]);
  const sObj = useMemo(() => {
    const l = new THREE.Line(sGeo, new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0, depthTest: false, blending: THREE.AdditiveBlending }));
    l.visible = false;
    l.renderOrder = 6;
    l.frustumCulled = false;
    return l;
  }, [sGeo]);

  const bracketGeo = useMemo(() => {
    // unit box edges drawn as corner brackets only
    const pts: number[] = [];
    const L = 0.28;
    const sgn = [-1, 1];
    sgn.forEach(x =>
      sgn.forEach(y =>
        sgn.forEach(z => {
          const c = [x * 0.5, y * 0.5, z * 0.5];
          pts.push(...c, c[0] - x * L, c[1], c[2]);
          pts.push(...c, c[0], c[1] - y * L, c[2]);
          pts.push(...c, c[0], c[1], c[2] - z * L);
        })
      )
    );
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    const p = story.current;
    const w = sm(0.58, 0.68, p) * (1 - sm(0.86, 0.94, p));
    const draw = sm(0.6, 0.72, p);
    const t = clock.getElapsedTime();
    const top = shared.site.towerTop;

    // height line: vertical beside the tower
    const hp = hGeo.attributes.position as THREE.BufferAttribute;
    hp.setXYZ(0, top.x + 4, 0.2, top.z);
    hp.setXYZ(1, top.x + 4, 0.2 + (top.y - 0.2) * draw, top.z);
    hp.needsUpdate = true;
    // span line: across the plaza at ground level
    const a = v3(shared.site.w * -0.06, 0.4, shared.site.d * 0.34);
    const b = v3(top.x - 4, 0.4, shared.site.d * 0.34);
    const sp = sGeo.attributes.position as THREE.BufferAttribute;
    sp.setXYZ(0, a.x, a.y, a.z);
    sp.setXYZ(1, a.x + (b.x - a.x) * draw, a.y, a.z + (b.z - a.z) * draw);
    sp.needsUpdate = true;

    [heightLine.current, spanLine.current].forEach(l => {
      if (l) {
        (l.material as THREE.LineBasicMaterial).opacity = 0.95 * w;
        l.visible = w > 0.01;
      }
    });
    if (caps.current) {
      caps.current.visible = w > 0.01;
      caps.current.children.forEach((c, i) => {
        const m = c as THREE.Mesh;
        const k = 1 + Math.sin(t * 3 + i) * 0.18;
        m.scale.setScalar(k);
        (m.material as THREE.MeshBasicMaterial).opacity = w;
        if (i === 0) m.position.set(top.x + 4, 0.2, top.z);
        if (i === 1) m.position.set(top.x + 4, 0.2 + (top.y - 0.2) * draw, top.z);
        if (i === 2) m.position.copy(a);
        if (i === 3) m.position.set(a.x + (b.x - a.x) * draw, a.y, a.z + (b.z - a.z) * draw);
      });
    }
    if (boxes.current) {
      boxes.current.visible = w > 0.01;
      boxes.current.children.forEach(c => {
        const ls = c as THREE.LineSegments;
        (ls.material as THREE.LineBasicMaterial).opacity = 0.9 * w * (0.75 + 0.25 * Math.sin(t * 2.4 + c.id));
        ls.scale.copy(ls.userData.size as THREE.Vector3).multiplyScalar(1 + (1 - draw) * 0.25);
      });
    }
  });

  const top = shared.site.towerTop;
  const boxSpecs = [
    { c: v3(top.x, top.y / 2, top.z), s: v3(11, top.y + 1, 11), col: CYAN },
    { c: v3(shared.site.w * 0.33, 3, -shared.site.d * 0.45), s: v3(15, 6.5, 15), col: AMBER },
    { c: v3(-shared.site.w * 0.4, 6, -shared.site.d * 0.05), s: v3(13, 14, 22), col: CYAN }
  ];

  return (
    <group>
      <primitive object={hObj} ref={heightLine} />
      <primitive object={sObj} ref={spanLine} />
      <group ref={caps} visible={false}>
        {[AMBER, AMBER, CYAN, CYAN].map((c, i) => (
          <mesh key={i} renderOrder={6}>
            <sphereGeometry args={[0.6, 14, 10]} />
            <meshBasicMaterial color={c} transparent opacity={0} depthTest={false} />
          </mesh>
        ))}
      </group>
      <group ref={boxes} visible={false}>
        {boxSpecs.map((b, i) => (
          <lineSegments
            key={i}
            geometry={bracketGeo}
            position={b.c}
            scale={b.s}
            renderOrder={6}
            userData={{ size: b.s }}
          >
            <lineBasicMaterial color={b.col} transparent opacity={0} depthTest={false} blending={THREE.AdditiveBlending} />
          </lineSegments>
        ))}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Director: scroll timeline, camera path, scan reveal, labels         */
/* ------------------------------------------------------------------ */
const POS = [
  [-36, 32, 70],
  [-50, 30, 30],
  [28, 17, 36],
  [46, 24, -8],
  [4, 58, 108]
].map(a => v3(a[0], a[1], a[2]));
const LOOK = [
  [0, 5, 0],
  [-6, 4, 0],
  [14, 8, 2],
  [8, 8, -2],
  [0, 6, 0]
].map(a => v3(a[0], a[1], a[2]));
// view shift per section so the model always sits in the half of the screen that is free of copy
const OFF = [-0.17, 0.15, -0.15, 0.15, -0.15];

const Director: React.FC<{ shared: Shared }> = ({ shared }) => {
  const { camera, size, clock } = useThree();
  const posC = useMemo(() => new THREE.CatmullRomCurve3(POS, false, 'centripetal'), []);
  const lookC = useMemo(() => new THREE.CatmullRomCurve3(LOOK, false, 'centripetal'), []);
  const lookV = useRef(LOOK[0].clone());
  const pv = useMemo(() => new THREE.Vector3(), []);
  const reduce = useMemo(() => prefersReducedMotion(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(0.1, dtRaw);
    const t = clock.getElapsedTime();
    const sh = shared;

    // smooth the scroll
    story.current += (story.target - story.current) * (reduce ? 1 : 1 - Math.exp(-dt * 3.2));
    const p = story.current;

    // intro scan sweep
    if (sh.ready && sh.introAt === 0) sh.introAt = t + 0.5;
    const ip = sh.ready ? clamp((t - sh.introAt) / (reduce ? 0.01 : 4.6), 0, 1) : 0;
    const e = 1 - Math.pow(1 - ip, 3);
    const intro = ip < 1;
    story.intro = ip;

    // camera
    posC.getPoint(p, tmpPos);
    lookC.getPoint(p, tmpLook);
    const hold = 1 - sm(0, 0.1, p);
    const mx = reduce ? 0 : story.mx;
    const my = reduce ? 0 : story.my;
    camera.position.set(
      tmpPos.x + mx * 5 + Math.sin(t * 0.18) * 4 * hold - 26 * (1 - e),
      tmpPos.y - my * 3 + Math.sin(t * 0.5) * 0.4 + 30 * (1 - e),
      tmpPos.z + Math.cos(t * 0.18) * 3 * hold + 52 * (1 - e)
    );
    lookV.current.lerp(tmpLook, 0.12);
    camera.lookAt(lookV.current);

    const cam = camera as THREE.PerspectiveCamera;
    const W = size.width;
    const H = size.height;
    if (W > 820) {
      const f = p * 4;
      const i = Math.min(3, Math.floor(f));
      const o = OFF[i] + (OFF[i + 1] - OFF[i]) * sm(0, 1, f - i);
      cam.setViewOffset(W, H, o * W, 0, W, H);
    } else {
      cam.setViewOffset(W, H, 0, H * 0.13, W, H);
    }

    // stage weights
    const wCap = sm(0.1, 0.2, p) * (1 - sm(0.36, 0.44, p));
    const wRec = sm(0.34, 0.42, p) * (1 - sm(0.6, 0.68, p));
    const wAna = sm(0.58, 0.68, p) * (1 - sm(0.86, 0.94, p));
    const dim = 1 - 0.68 * sm(0.1, 0.2, p) * (1 - sm(0.6, 0.7, p));

    // scan slab + reveal
    const sw = sh.site.w / 2 + 14;
    const sx = intro ? -sw + sw * 2 * e : -sw + ((t * 11) % (sw * 2));
    if (sh.slab && sh.slabMat) {
      sh.slab.position.x = sx;
      sh.slab.position.y = 16;
      const o = intro ? (ip < 0.02 ? ip / 0.02 : 1) * (1 - sm(0.92, 1, ip)) : 0.7 * wRec;
      sh.slabMat.uniforms.o.value = o;
      sh.slabMat.uniforms.t.value = t;
      sh.slab.visible = o > 0.003;
    }
    if (sh.ready) {
      sh.solidPlane.constant = intro ? sx : 999;
      sh.wirePlane.constant = intro ? -sx : -999;
      sh.solidMats.forEach(m => m.color.setScalar(dim));
      if (sh.wireMat) {
        // wireframe: ahead of the intro slab, then built across the site during "reconstruct"
        const build = sm(0.36, 0.52, p);
        sh.meshPlane.constant = intro ? 999 : -sw + sw * 2 * build;
        sh.wireMat.opacity = intro ? 0.32 * (1 - sm(0.85, 1, ip)) : 0.3 * wRec;
        sh.wireMat.visible = sh.wireMat.opacity > 0.003;
      }
      if (sh.cloudMat) {
        // point cloud accumulates left → right while "capturing"
        sh.cloudPlane.constant = -sw + sw * 2 * sm(0.12, 0.4, p);
        sh.cloudMat.opacity = 0.9 * wCap + 0.22 * wRec;
        sh.cloudMat.visible = sh.cloudMat.opacity > 0.01;
      }
    }

    // project the on-model tags to screen space for the DOM overlay
    const lo = wAna;
    for (let i = 0; i < sh.tag.length; i++) {
      pv.copy(sh.tag[i]).project(camera);
      const vis = pv.z < 1 && lo > 0.02 && Math.abs(pv.x) < 1.05 && Math.abs(pv.y) < 1.05;
      story.labels[i] = {
        x: (pv.x * 0.5 + 0.5) * W,
        y: (-pv.y * 0.5 + 0.5) * H,
        opacity: vis ? lo : 0
      };
    }
  });

  return null;
};

/** Scan slab mesh (volumetric sweep used in the intro and during reconstruction). */
const ScanSlab: React.FC<{ shared: Shared }> = ({ shared }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { o: { value: 0 }, t: { value: 0 } },
        vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'uniform float o;uniform float t;varying vec3 vP;void main(){float a=pow(clamp((vP.x+9.)/18.,0.,1.),3.5);float e=smoothstep(8.1,9.,vP.x);float scan=.8+.2*sin(vP.y*2.2-t*4.);vec3 c=mix(vec3(.22,.74,.97),vec3(.98,.75,.14),e);gl_FragColor=vec4(c*(a*.1+e*.9)*scan,(a*.03+e*.22)*o);}'
      }),
    []
  );
  useEffect(() => {
    shared.slabMat = mat;
  }, [mat, shared]);
  return (
    <mesh
      ref={el => {
        shared.slab = el;
      }}
      material={mat}
      position={[0, 16, 0]}
      visible={false}
    >
      <boxGeometry args={[18, 40, 52]} />
    </mesh>
  );
};

/** Background, fog and lights. */
const Atmosphere: React.FC = () => {
  const { scene } = useThree();
  useEffect(() => {
    const sky = makeSkyTexture();
    scene.background = sky;
    scene.fog = new THREE.Fog(0x1b2c47, 150, 420);
    return () => {
      sky.dispose();
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);
  return (
    <>
      <hemisphereLight args={[0x9fc4ff, 0x10182a, 0.9]} />
      <directionalLight position={[40, 60, 30]} intensity={1.8} color={0xffe2bd} />
      <directionalLight position={[-30, 20, -40]} intensity={0.5} color={0x5aa9ff} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Public component                                                     */
/* ------------------------------------------------------------------ */
class SceneBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('[Aero3D landing] 3D scene failed, falling back to static background', error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export const LandingScene: React.FC<{ onError: () => void; active?: boolean }> = ({ onError, active = true }) => {
  const shared = useMemo(makeShared, []);
  const mobile = typeof window !== 'undefined' && window.innerWidth < 820;
  const [modelUrl, setModelUrl] = React.useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    resolveHeroModelUrl().then(u => { if (alive) setModelUrl(u); });
    return () => { alive = false; };
  }, []);

  return (
    <SceneBoundary onError={onError}>
      <Canvas
        className="landing-canvas"
        frameloop={active ? 'always' : 'never'}
        dpr={[1, mobile ? 1.5 : 2]}
        camera={{ fov: 46, near: 0.1, far: 900, position: [-36, 32, 70] }}
        gl={{ antialias: true, powerPreference: 'high-performance', localClippingEnabled: true }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Atmosphere />
        <Stage shared={shared} />
        <ScanSlab shared={shared} />
        <Suspense fallback={null}>
          {modelUrl && <SiteModel shared={shared} url={modelUrl} />}
        </Suspense>
        <Drone shared={shared} />
        <Analysis shared={shared} />
        <Director shared={shared} />
      </Canvas>
    </SceneBoundary>
  );
};

resolveHeroModelUrl().then(u => useGLTF.preload(u)).catch(() => useGLTF.preload(FALLBACK_MODEL_URL));
