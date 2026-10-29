import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BrainCircuit, Check, FileText, FolderKanban, Map as MapIcon, Play, Ruler } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useProjects } from '../store/ProjectContext';
import { clamp, prefersReducedMotion, story, webglAvailable } from '../components/landing/story';
import '../styles/landing.css';

const LandingScene = lazy(() => import('../components/landing/LandingScene').then(m => ({ default: m.LandingScene })));

const STAGES = ['Orbit', 'Capture', 'Reconstruct', 'Analyse', 'Deliver'];
// Illustrative annotations only: they show what the analysis layer would label, not real detections.
const TAGS: Array<{ name: string; meta: string; amber?: boolean }> = [
  { name: 'Highest point', meta: 'sample label' },
  { name: 'Roof surface', meta: 'sample label', amber: true },
  { name: 'Ground / paving', meta: 'sample label' },
  { name: 'Vegetation', meta: 'sample label' }
];

const PIPELINE: Array<{ t: string; d: string; st: 'ok' | 'sim' | 'plan'; label: string }> = [
  { t: 'Capture', d: 'Fly the site and upload MP4/MOV footage or overlapping photos.', st: 'ok', label: 'Working' },
  { t: 'Extract frames', d: 'FFmpeg samples sharp frames along the flight path.', st: 'ok', label: 'Working' },
  { t: 'Reconstruct', d: 'Photogrammetry turns frames into a textured GLB. Today the demo engine serves bundled models; COLMAP and Polycam are not wired up.', st: 'sim', label: 'Simulated in demo' },
  { t: 'Inspect', d: 'Open the model in the browser viewer, measure it, calibrate scale and switch units.', st: 'ok', label: 'Working' },
  { t: 'Report', d: 'Print an inspection report per project; save it as PDF from the browser.', st: 'ok', label: 'Working' }
];

const fmt = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(Math.round(n)));

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setActiveProject } = useProjects();

  const storyRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const hudRefs = useRef<Record<string, HTMLElement | null>>({});
  const tagRefs = useRef<Array<HTMLDivElement | null>>([]);
  const secRefs = useRef<Array<HTMLElement | null>>([]);
  const [gl, setGl] = useState<boolean>(() => webglAvailable());
  const [loaded, setLoaded] = useState(false);
  const [inStory, setInStory] = useState(true);
  const [stage, setStage] = useState(0);

  const handleLaunchDemo = () => {
    if (projects.length > 0) setActiveProject(projects[0]);
    navigate('/viewer/demo-proj-001');
  };

  // Scroll → story progress
  useEffect(() => {
    story.target = 0;
    story.current = 0;
    story.ready = false;
    story.intro = 0;
    const onScroll = () => {
      const el = storyRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const range = Math.max(1, r.height - window.innerHeight);
      story.target = clamp(-r.top / range, 0, 1);
      setInStory(r.bottom > window.innerHeight * 0.6);
      setStage(Math.round(story.target * 4));
      if (barRef.current) barRef.current.style.transform = `scaleX(${story.target})`;
    };
    const onMove = (e: PointerEvent) => {
      story.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      story.my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  // Text reveal per section
  useEffect(() => {
    const reduce = prefersReducedMotion();
    const io = new IntersectionObserver(
      es => es.forEach(e => e.target.classList.toggle('in', reduce || e.isIntersecting)),
      { threshold: 0.45 }
    );
    secRefs.current.forEach(s => s && io.observe(s));
    return () => io.disconnect();
  }, []);

  // DOM HUD + projected labels (no React re-render per frame)
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = story.current;
      const h = hudRefs.current;
      if (h.stage) h.stage.textContent = STAGES[clamp(Math.round(p * 4), 0, 4)];
      if (h.alt) h.alt.textContent = `${(120 - p * 60 + Math.sin(p * 9) * 6).toFixed(0)} m`;
      if (h.v) h.v.textContent = story.ready ? fmt(story.stats.vertices * Math.min(1, 0.15 + p * 1.6)) : '—';
      if (h.t) h.t.textContent = story.ready ? fmt(story.stats.triangles * Math.min(1, 0.1 + p * 1.8)) : '—';
      if (h.pts) h.pts.textContent = story.ready ? fmt(story.stats.points * Math.min(1, p * 2.6)) : '—';
      story.labels.forEach((l, i) => {
        const el = tagRefs.current[i];
        if (!el || !l) return;
        el.style.opacity = String(l.opacity);
        el.style.transform = `translate(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px)`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Loader dismissal
  useEffect(() => {
    if (!gl) {
      setLoaded(true);
      return;
    }
    const id = window.setInterval(() => {
      if (story.ready) {
        setLoaded(true);
        window.clearInterval(id);
      }
    }, 120);
    const fail = window.setTimeout(() => setLoaded(true), 12000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(fail);
    };
  }, [gl]);

  const goTo = useCallback((i: number) => {
    const el = storyRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (range * i) / 4, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);

  const setSec = (i: number) => (el: HTMLElement | null) => {
    secRefs.current[i] = el;
  };
  const setHud = (k: string) => (el: HTMLElement | null) => {
    hudRefs.current[k] = el;
  };

  return (
    <div className="min-h-screen bg-aerospace-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30">
      <div className={`ln-loader ${loaded ? 'done' : ''}`} aria-hidden={loaded}>
        <span>Loading site model</span>
        <i />
      </div>

      <div className="ln-bar" aria-hidden>
        <i ref={barRef as React.RefObject<HTMLElement> as React.RefObject<HTMLDivElement>} />
      </div>

      {/* Fixed 3D stage */}
      <div className={`ln-stage ${inStory ? '' : 'off'}`} aria-hidden>
        <div className="ln-fallback" />
        {gl && (
          <Suspense fallback={null}>
            <LandingScene active={inStory} onError={() => setGl(false)} />
          </Suspense>
        )}
        <div className="ln-vignette" />
      </div>

      {/* projected labels */}
      <div className="ln-tags" aria-hidden>
        {TAGS.map((t, i) => (
          <div key={t.name} className={`ln-tag ${t.amber ? 'amber' : ''}`} ref={el => (tagRefs.current[i] = el)}>
            <div>
              {t.name}
              <br />
              <b>{t.meta}</b>
            </div>
          </div>
        ))}
      </div>

      <div className="ln-root flex flex-col flex-1">
        <Navbar />

        <main id="main-content" className="flex-1">
          <div className="ln-story" ref={storyRef}>
            {/* 0: hero */}
            <section className="ln-sec" ref={setSec(0)}>
              <div className="ln-card" style={{ maxWidth: 640 }}>
                <div className="ln-eyebrow ln-rv" style={{ ['--d' as string]: 0 }}>
                  <i /> Drone photogrammetry<span className="hidden sm:inline">&nbsp;· INNOTECH 2026</span>
                </div>
                <h1 className="ln-display ln-h1 mt-6">
                  <span className="ln-rv block" style={{ ['--d' as string]: 1 }}>One drone flight.</span>
                  <span className="ln-rv ln-accent block" style={{ ['--d' as string]: 2 }}>A measurable 3D twin.</span>
                </h1>
                <p className="ln-p ln-rv mt-7" style={{ ['--d' as string]: 3 }}>
                  AERO3D turns drone footage into an interactive 3D model you can open in the browser, then measure, map and report on, with no plugin to install.
                </p>
                <div className="ln-actions ln-rv flex flex-wrap items-center gap-3 mt-9" style={{ ['--d' as string]: 4 }}>
                  <button className="btn btn-primary" onClick={handleLaunchDemo}>
                    <Play className="w-4 h-4 fill-current" aria-hidden /> Open the demo
                  </button>
                  <Link to="/projects/new" className="btn btn-ghost">
                    Start a survey <ArrowRight className="w-4 h-4" aria-hidden />
                  </Link>
                </div>
                <div className="ln-facts ln-rv mt-8" style={{ ['--d' as string]: 5 }}>
                  <span>Runs in the browser</span>
                  <span>Upload a finished GLB</span>
                  <span>Measure and calibrate</span>
                </div>
              </div>
              <div className="ln-hint">
                <b /> Scroll to fly the survey
              </div>
            </section>

            {/* 1: capture */}
            <section className="ln-sec right" ref={setSec(1)}>
              <div className="ln-card panel">
                <div className="ln-num ln-rv" style={{ ['--d' as string]: 0 }}>01</div>
                <h2 className="ln-display ln-h2 mt-5 ln-rv" style={{ ['--d' as string]: 1 }}>Capture the site</h2>
                <p className="ln-p mt-4 ln-rv" style={{ ['--d' as string]: 2 }}>
                  Upload MP4, MOV or overlapping photos. FFmpeg samples sharp frames along the flight path, and every frame becomes a footprint on the ground.
                </p>
                <div className="ln-chips mt-6 ln-rv" style={{ ['--d' as string]: 3 }}>
                  <span className="ln-chip">MP4 · MOV · MKV</span>
                  <span className="ln-chip">3 FPS sampling</span>
                  <span className="ln-chip">Lawnmower path</span>
                </div>
              </div>
            </section>

            {/* 2: reconstruct */}
            <section className="ln-sec" ref={setSec(2)}>
              <div className="ln-card panel">
                <div className="ln-num ln-rv" style={{ ['--d' as string]: 0 }}>02</div>
                <h2 className="ln-display ln-h2 mt-5 ln-rv" style={{ ['--d' as string]: 1 }}>Build the mesh</h2>
                <p className="ln-p mt-4 ln-rv" style={{ ['--d' as string]: 2 }}>
                  Frames feed a photogrammetry engine that produces a textured GLB. Today the demo runs offline on bundled models and you can upload a finished .glb. COLMAP and Polycam are not wired up yet.
                </p>
                <div className="ln-chips mt-6 ln-rv" style={{ ['--d' as string]: 3 }}>
                  <span className="ln-chip ok">GLB upload works</span>
                  <span className="ln-chip warn">Demo engine: offline</span>
                  <span className="ln-chip warn">COLMAP / Polycam: planned</span>
                </div>
              </div>
            </section>

            {/* 3: analyse */}
            <section className="ln-sec right" ref={setSec(3)}>
              <div className="ln-card panel">
                <div className="ln-num ln-rv" style={{ ['--d' as string]: 0 }}>03</div>
                <h2 className="ln-display ln-h2 mt-5 ln-rv" style={{ ['--d' as string]: 1 }}>Measure and map</h2>
                <p className="ln-p mt-4 ln-rv" style={{ ['--d' as string]: 2 }}>
                  Click two points to measure distance or height, calibrate the scale and switch units. A Leaflet map shows the survey location. Labels on this page are an illustration, not live detections.
                </p>
                <div className="ln-chips mt-6 ln-rv" style={{ ['--d' as string]: 3 }}>
                  <span className="ln-chip">Distance · Height</span>
                  <span className="ln-chip">Calibration</span>
                  <span className="ln-chip">GIS map</span>
                </div>
              </div>
            </section>

            {/* 4: deliver */}
            <section className="ln-sec" ref={setSec(4)}>
              <div className="ln-card" style={{ maxWidth: 620 }}>
                <div className="ln-num ln-rv" style={{ ['--d' as string]: 0 }}>04</div>
                <h2 className="ln-display ln-h2 mt-5 ln-rv" style={{ ['--d' as string]: 1 }}>
                  Explore the <span className="ln-accent">digital twin</span>
                </h2>
                <p className="ln-p mt-5 ln-rv" style={{ ['--d' as string]: 2 }}>
                  Open the interactive viewer, or start a new survey with your own footage.
                </p>
                <div className="ln-actions ln-rv flex flex-wrap items-center gap-3 mt-8" style={{ ['--d' as string]: 3 }}>
                  <button className="btn btn-primary" onClick={handleLaunchDemo}>
                    <Play className="w-4 h-4 fill-current" aria-hidden /> Open the demo
                  </button>
                  <Link to="/projects/new" className="btn btn-ghost">
                    Start a survey <ArrowRight className="w-4 h-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <div className="ln-after">
            {/* Viewer */}
            <section className="ln-sect" aria-labelledby="viewer-h">
              <div className="ln-wrap ln-split">
                <div>
                  <div className="ln-eyebrow"><i /> 3D viewer</div>
                  <h2 id="viewer-h" className="ln-display ln-h2 mt-5">Inspect the model like engineering software</h2>
                  <p className="ln-p mt-5">Open any GLB in the browser and check its real geometry. Every control below is implemented in the viewer today.</p>
                  <ul className="ln-list">
                    {[
                      ['Length, width and height', 'Guide lines and labels from the model\u2019s bounding box.'],
                      ['Two-point measurement', 'Pick any two points for distance and height.'],
                      ['Calibration and units', 'Set a known length to scale the model, then switch units.'],
                      ['Four view modes', 'Solid, wireframe, point cloud and orbit.']
                    ].map(([t, d]) => (
                      <li key={t}><Check className="w-5 h-5" aria-hidden /><span><b>{t}</b>{d}</span></li>
                    ))}
                  </ul>
                  <button className="btn btn-primary mt-9" onClick={handleLaunchDemo}>
                    <Play className="w-4 h-4 fill-current" aria-hidden /> Open the demo viewer
                  </button>
                </div>
                <figure className="ln-frame">
                  <div className="ln-frame-bar" aria-hidden><i /><i /><i /><span className="ml-2">AERO3D viewer</span></div>
                  <img src="/img/viewer-demo.png" alt="The AERO3D viewer showing the demo building with length, width and height dimension lines" loading="lazy" width={1440} height={900} />
                  <figcaption>Demo project in the viewer. Screenshot of the running app.</figcaption>
                </figure>
              </div>
            </section>

            {/* Pipeline (light) */}
            <section className="ln-sect ln-paper" aria-labelledby="pipe-h">
              <div className="ln-wrap">
                <div className="ln-sect-head">
                  <div className="ln-eyebrow"><i /> Reconstruction pipeline</div>
                  <h2 id="pipe-h" className="ln-display ln-h2 mt-5">From aerial footage to a measurable model</h2>
                  <p className="ln-p">Five stages. Each is marked as working or simulated, so you can see what runs for real today.</p>
                </div>
                <ol className="ln-steps">
                  {PIPELINE.map((st, i) => (
                    <li key={st.t} className="ln-step">
                      <span className="n" aria-hidden>{i + 1}</span>
                      <h3 className="ln-display">{st.t}</h3>
                      <p className="mt-2"><span className={`ln-tag-s ${st.st}`}>{st.label}</span></p>
                      <p>{st.d}</p>
                    </li>
                  ))}
                </ol>
                <div className="ln-legend">
                  <span><span className="ln-tag-s ok">Working</span> runs for real</span>
                  <span><span className="ln-tag-s sim">Simulated in demo</span> bundled sample data</span>
                  <span><span className="ln-tag-s plan">Planned</span> not built</span>
                </div>
              </div>
            </section>

            {/* Capabilities */}
            <section className="ln-sect" aria-labelledby="cap-h">
              <div className="ln-wrap">
                <div className="ln-sect-head">
                  <div className="ln-eyebrow"><i /> Platform</div>
                  <h2 id="cap-h" className="ln-display ln-h2 mt-5">Projects, maps and reports in one place</h2>
                </div>
                <div className="ln-bento">
                  <article className="ln-cell ln-b1">
                    <div className="ic"><FolderKanban className="w-5 h-5" aria-hidden /></div>
                    <h3 className="ln-display">Every survey is its own project</h3>
                    <p>Each project keeps its own model, metadata, calibration and measurements. Switch between projects, delete the ones you no longer need, and your projects are still there after a reload.</p>
                    <div className="ln-kv">
                      <div><b>Isolated</b>per-project state</div>
                      <div><b>Persistent</b>survives reloads</div>
                      <div><b>Removable</b>delete with confirmation</div>
                    </div>
                  </article>
                  <article className="ln-cell ln-b2">
                    <div className="ic"><Ruler className="w-5 h-5" aria-hidden /></div>
                    <h3 className="ln-display">Scale calibration</h3>
                    <p>Anchor the model to a known real-world length, then read distances in your unit.</p>
                    <span className="ln-status ok">Working</span>
                  </article>
                  <article className="ln-cell ln-b3">
                    <div className="ic"><MapIcon className="w-5 h-5" aria-hidden /></div>
                    <h3 className="ln-display">GIS location map</h3>
                    <p>Dark, street and satellite layers show the survey location and boundary.</p>
                    <span className="ln-status ok">Working</span>
                  </article>
                  <article className="ln-cell ln-b4">
                    <div className="ic"><FileText className="w-5 h-5" aria-hidden /></div>
                    <h3 className="ln-display">Inspection report</h3>
                    <p>A printable report per project. Use your browser’s Print dialog to save it as PDF.</p>
                    <span className="ln-status ok">Working</span>
                  </article>
                  <article className="ln-cell ln-b5">
                    <div className="ic"><BrainCircuit className="w-5 h-5" aria-hidden /></div>
                    <h3 className="ln-display">AI scene intelligence</h3>
                    <p>Detections are sample data on the bundled demo project. No detector runs on uploaded projects yet.</p>
                    <span className="ln-status warn">Demo data</span>
                  </article>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="pb-24" aria-label="Get started">
              <div className="ln-wrap">
                <div className="ln-cta">
                  <div>
                    <h2 className="ln-display ln-h2">See the demo building in 3D</h2>
                    <p className="ln-p mt-4">Open the viewer with a bundled project, or upload your own GLB.</p>
                  </div>
                  <div className="ln-actions flex flex-wrap gap-3">
                    <button className="btn btn-primary" onClick={handleLaunchDemo}><Play className="w-4 h-4 fill-current" aria-hidden /> Open the demo</button>
                    <Link to="/projects/new" className="btn btn-secondary">New survey</Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="ln-footer">
          <div className="ln-wrap">
            <div className="ln-foot-grid">
              <div>
                <Link to="/" className="inline-flex items-center gap-3" aria-label="AERO3D home">
                  <span className="w-9 h-9 rounded-[10px] bg-sky-500 text-aerospace-950 font-display font-bold text-sm grid place-items-center" aria-hidden>3D</span>
                  <span className="font-display font-semibold text-xl text-slate-100">AERO3D</span>
                </Link>
                <p className="mt-4 max-w-sm leading-relaxed">Drone footage to measurable 3D models in the browser. Built for INNOTECH 2026.</p>
              </div>
              <nav aria-label="Product">
                <h4>Product</h4>
                <ul>
                  <li><Link to="/dashboard">Dashboard</Link></li>
                  <li><Link to="/projects">Projects</Link></li>
                  <li><Link to="/projects/new">New survey</Link></li>
                  <li><Link to="/viewer/demo-proj-001">Demo viewer</Link></li>
                </ul>
              </nav>
              <nav aria-label="Learn">
                <h4>Learn</h4>
                <ul>
                  <li><Link to="/about">Architecture</Link></li>
                  <li><Link to="/presentation">Presentation</Link></li>
                  <li><Link to="/settings">System health</Link></li>
                </ul>
              </nav>
              <div>
                <h4>Credits</h4>
                <p className="leading-relaxed">
                  Homepage 3D model: Drone Building Scans, Matthew Guertin, 2026.{' '}
                  <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline">CC BY 4.0</a>. Optimized for web.
                </p>
              </div>
            </div>
            <div className="ln-foot-base">
              <span>© 2026 AERO3D · INNOTECH project</span>
              <span>Hero model is illustrative and carries no survey measurements.</span>
            </div>
          </div>
        </footer>
      </div>

      {/* steps rail */}
      <nav className={`ln-rail ${inStory ? '' : 'off'}`} aria-label="Story steps">
        {STAGES.map((s, i) => (
          <button key={s} className={stage === i ? 'on' : ''} onClick={() => goTo(i)} aria-label={`Go to ${s}`}>
            <span>{s}</span>
            <i />
          </button>
        ))}
      </nav>

      {/* readout */}
      <div className={`ln-hud ${inStory ? '' : 'off'}`} aria-hidden>
        <div className="stage"><small>Stage</small><span className="v" ref={setHud('stage')}>Orbit</span></div>
        <div><small>Camera height</small><span className="v" ref={setHud('alt')}>120 m</span></div>
        <div className="hide-sm"><small>Vertices</small><span className="v" ref={setHud('v')}>—</span></div>
        <div className="hide-sm"><small>Triangles</small><span className="v" ref={setHud('t')}>—</span></div>
        <div><small>Points</small><span className="v" ref={setHud('pts')}>—</span></div>
      </div>
    </div>
  );
};
