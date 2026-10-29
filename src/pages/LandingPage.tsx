import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, BrainCircuit, Cpu, FileText, Map, Play, PlusCircle, Ruler } from 'lucide-react';
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
    <div className="min-h-screen bg-aerospace-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
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
            {/* 0 — hero */}
            <section className="ln-sec" ref={setSec(0)}>
              <div className="ln-card" style={{ maxWidth: 640 }}>
                <div className="ln-eyebrow ln-rv" style={{ ['--d' as string]: 0 }}>
                  <i /> INNOTECH 2026
                </div>
                <h1 className="ln-display ln-h1 mt-5">
                  <span className="ln-rv block" style={{ ['--d' as string]: 1 }}>One drone flight.</span>
                  <span className="ln-rv ln-grad block" style={{ ['--d' as string]: 2 }}>A living 3D twin.</span>
                </h1>
                <p className="ln-p ln-rv mt-6 max-w-lg" style={{ ['--d' as string]: 3 }}>
                  Turn raw drone footage into an interactive, browser-native 3D environment with AI scene intelligence, GIS mapping and spatial measurements, with no plugin to install.
                </p>
                <div className="ln-rv flex flex-wrap gap-3 mt-8" style={{ ['--d' as string]: 4 }}>
                  <button className="ln-btn primary" onClick={handleLaunchDemo}>
                    <Play className="w-4 h-4 fill-current" /> Launch Interactive Demo
                  </button>
                  <Link to="/projects/new" className="ln-btn ghost">
                    <PlusCircle className="w-4 h-4 text-sky-400" /> Start New Survey
                  </Link>
                </div>
              </div>
              <div className="ln-hint">
                <b /> Scroll to fly the survey
              </div>
            </section>

            {/* 1 — capture */}
            <section className="ln-sec right" ref={setSec(1)}>
              <div className="ln-card glass">
                <div className="ln-eyebrow ln-rv" style={{ ['--d' as string]: 0 }}>
                  <i /> 01 · Capture
                </div>
                <h2 className="ln-display ln-h2 mt-4 ln-rv" style={{ ['--d' as string]: 1 }}>
                  Fly once.<br />
                  <span className="ln-grad">Capture everything.</span>
                </h2>
                <p className="ln-p mt-4 ln-rv" style={{ ['--d' as string]: 2 }}>
                  Upload MP4, MOV or overlapping photos. FFmpeg samples sharp frames along the flight path, and every frame becomes a footprint on the ground.
                </p>
                <div className="ln-chips mt-5 ln-rv" style={{ ['--d' as string]: 3 }}>
                  <span className="ln-chip">MP4 · MOV · MKV</span>
                  <span className="ln-chip">3 FPS sampling</span>
                  <span className="ln-chip amber">Lawnmower path</span>
                </div>
              </div>
            </section>

            {/* 2 — reconstruct */}
            <section className="ln-sec" ref={setSec(2)}>
              <div className="ln-card glass">
                <div className="ln-eyebrow ln-rv" style={{ ['--d' as string]: 0 }}>
                  <i /> 02 · Reconstruct
                </div>
                <h2 className="ln-display ln-h2 mt-4 ln-rv" style={{ ['--d' as string]: 1 }}>
                  Points become a<br />
                  <span className="ln-grad">textured mesh.</span>
                </h2>
                <p className="ln-p mt-4 ln-rv" style={{ ['--d' as string]: 2 }}>
                  Extracted frames feed a photogrammetry engine that produces a textured GLB mesh. Today the demo runs offline on bundled models, and you can upload a finished .glb; COLMAP and Polycam run-through is not wired up yet.
                </p>
                <div className="ln-chips mt-5 ln-rv" style={{ ['--d' as string]: 3 }}>
                  <span className="ln-chip">GLB upload works</span>
                  <span className="ln-chip">Demo engine: offline</span>
                  <span className="ln-chip amber">COLMAP / Polycam: planned</span>
                </div>
              </div>
            </section>

            {/* 3 — analyse */}
            <section className="ln-sec right" ref={setSec(3)}>
              <div className="ln-card glass">
                <div className="ln-eyebrow ln-rv" style={{ ['--d' as string]: 0 }}>
                  <i /> 03 · Analyse
                </div>
                <h2 className="ln-display ln-h2 mt-4 ln-rv" style={{ ['--d' as string]: 1 }}>
                  Measure, classify,<br />
                  <span className="ln-grad">map it.</span>
                </h2>
                <p className="ln-p mt-4 ln-rv" style={{ ['--d' as string]: 2 }}>
                  Click two points to measure distance or height, calibrate the scale, and switch units. A Leaflet map shows the survey location. Scene labels on this page are an illustration, not live detections.
                </p>
                <div className="ln-chips mt-5 ln-rv" style={{ ['--d' as string]: 3 }}>
                  <span className="ln-chip">Distance · Height · Calibration</span>
                  <span className="ln-chip amber">GIS map</span>
                </div>
              </div>
            </section>

            {/* 4 — deliver */}
            <section className="ln-sec" ref={setSec(4)}>
              <div className="ln-card" style={{ maxWidth: 600 }}>
                <div className="ln-eyebrow ln-rv" style={{ ['--d' as string]: 0 }}>
                  <i /> 04 · Deliver
                </div>
                <h2 className="ln-display ln-h2 mt-5 ln-rv" style={{ ['--d' as string]: 1 }}>
                  Explore the <span className="ln-grad">digital twin.</span>
                </h2>
                <p className="ln-p mt-5 ln-rv" style={{ ['--d' as string]: 2 }}>
                  Open the interactive viewer, or start a new survey with your own footage.
                </p>
                <div className="ln-rv flex flex-wrap gap-3 mt-8" style={{ ['--d' as string]: 3 }}>
                  <button className="ln-btn primary" onClick={handleLaunchDemo}>
                    <Play className="w-4 h-4 fill-current" /> Launch Interactive Demo
                  </button>
                  <Link to="/projects/new" className="ln-btn ghost">
                    <PlusCircle className="w-4 h-4 text-sky-400" /> Start New Survey
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* Features */}
          <section className="ln-after py-24">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <div className="ln-eyebrow justify-center"><i /> What is implemented</div>
                <h2 className="ln-display ln-h2">What works today</h2>
                <p className="text-slate-300 text-sm">Each capability is labelled as working, demo data, or partly built.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { I: Box, t: '3D viewer in the browser', st: 'Working', d: 'Render GLB models with Three.js and React Three Fiber, switch between textured, wireframe, solid and point-cloud views, with no plugin to install.' },
                  { I: Ruler, t: 'Dimensions and measurement', st: 'Working', d: 'Length, width and height guide lines, two-point distance and height measurement, scale calibration and unit conversion.' },
                  { I: Map, t: 'GIS location map', st: 'Working', d: 'A Leaflet map with dark, street and satellite layers shows the survey location and boundary.' },
                  { I: FileText, t: 'Survey report', st: 'Working', d: 'A printable inspection report for each project; use your browser\'s Print dialog to save it as PDF.' },
                  { I: BrainCircuit, t: 'AI scene intelligence', st: 'Demo data', d: 'Object detections are sample data for the bundled demo project only. No detector runs on uploaded projects yet.' },
                  { I: Cpu, t: 'Reconstruction engines', st: 'Partly built', d: 'FFmpeg frame extraction and a provider layer exist. Running COLMAP or Polycam end to end is not implemented; upload a finished .glb for now.' }
                ].map(({ I, t, d, st }) => (
                  <div key={t} className="ln-feat">
                    <div className="ic"><I className="w-5 h-5" /></div>
                    <h3 className="ln-display font-bold text-lg text-slate-100">{t}</h3>
                    <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${st === 'Working' ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' : 'text-amber-300 border-amber-500/40 bg-amber-500/10'}`}>{st}</span>
                    <p className="text-slate-300 text-sm leading-relaxed mt-3">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-800/80 bg-aerospace-950 py-8 text-center text-xs text-slate-400 font-mono">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-slate-300 font-bold">Aero3D Intelligence</span> © 2026 — INNOTECH Project
              <div className="mt-1 text-xs text-slate-400">
                Homepage 3D model: Drone Building Scans — Matthew Guertin, 2026.{' '}
                <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline hover:text-sky-300">CC BY 4.0</a>. Optimized for web.
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <Link to="/presentation" className="hover:text-sky-300">Presentation Mode</Link>
              <Link to="/about" className="hover:text-sky-300">Architecture</Link>
              <Link to="/settings" className="hover:text-sky-300">System Health</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* steps rail */}
      <nav className={`ln-rail ${inStory ? '' : 'off'}`} aria-label="Story steps">
        {STAGES.map((s, i) => (
          <button key={s} className={stage === i ? 'on' : ''} onClick={() => goTo(i)}>
            <span>{s}</span>
            <i />
          </button>
        ))}
      </nav>

      {/* telemetry HUD */}
      <div className={`ln-hud ${inStory ? '' : 'off'}`} aria-hidden>
        <div className="stage"><small>Stage</small><span className="v" ref={setHud('stage')}>Orbit</span></div>
        <div><small>Altitude</small><span className="v" ref={setHud('alt')}>120 m</span></div>
        <div className="hide-sm"><small>Vertices</small><span className="v" ref={setHud('v')}>—</span></div>
        <div className="hide-sm"><small>Triangles</small><span className="v" ref={setHud('t')}>—</span></div>
        <div><small>Points</small><span className="v" ref={setHud('pts')}>—</span></div>
      </div>
    </div>
  );
};
