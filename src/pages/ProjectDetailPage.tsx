import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Maximize2, Play, ChevronRight, FileQuestion } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { ThreeCanvas } from '../components/viewer/ThreeCanvas';
import { SafeImage } from '../components/DemoProjectCard';
import { useProjects } from '../store/ProjectContext';
import { getDemoInfo } from '../data/demoProjects';

const PIPELINE: { title: string; text: string }[] = [
  { title: 'Drone Images', text: 'Overlapping photographs taken from many positions around the subject.' },
  { title: 'Image Alignment', text: 'Each photo’s camera position and orientation is solved.' },
  { title: 'Feature Matching', text: 'The same visual points are found across neighbouring photos.' },
  { title: 'Point Cloud / Geometry', text: 'Matched points are triangulated into 3D points, then a surface.' },
  { title: 'Texturing', text: 'Colour from the photographs is projected onto the surface.' },
  { title: '3D Model', text: 'The result is a model that can be orbited and measured.' },
];

const Section: React.FC<{ id: string; letter: string; title: string; children: React.ReactNode }> = ({ id, letter, title, children }) => (
  <section aria-labelledby={id} className="rounded-xl glass-panel border border-slate-800 p-5 sm:p-6 space-y-4">
    <h2 id={id} className="flex items-center gap-3 text-sm font-bold text-slate-100 uppercase tracking-wider">
      <span className="w-6 h-6 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs flex items-center justify-center" aria-hidden>{letter}</span>
      {title}
    </h2>
    {children}
  </section>
);

type Probe = 'checking' | 'present' | 'missing';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, setActiveProject, scaleFactor, isCalibrated } = useProjects();
  const project = projects.find(p => p.id === projectId);
  const info = getDemoInfo(projectId);
  const [show3d, setShow3d] = useState(false);
  const [probe, setProbe] = useState<Probe>('checking');

  // A static host can answer a missing file with index.html, so check the content type too.
  useEffect(() => {
    setShow3d(false);
    if (!project?.model_url) { setProbe('missing'); return; }
    let cancelled = false;
    fetch(project.model_url, { method: 'HEAD' })
      .then(r => { if (!cancelled) setProbe(r.ok && !(r.headers.get('content-type') || '').includes('text/html') ? 'present' : 'missing'); })
      .catch(() => { if (!cancelled) setProbe('missing'); });
    return () => { cancelled = true; };
  }, [project?.model_url]);

  if (!project || !info) {
    return (
      <div className="flex h-screen bg-aerospace-950 text-slate-100 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col"><Topbar title="Project" />
          <main id="main-content" className="p-10 text-center text-slate-300 space-y-3">
            <FileQuestion className="w-8 h-8 mx-auto text-slate-400" aria-hidden />
            <p>This project has no detail page, or it was removed.</p>
            <Link to="/projects" className="text-sky-300 hover:underline">Back to projects</Link>
          </main>
        </div>
      </div>
    );
  }

  const openViewer = () => { setActiveProject(project); navigate(`/viewer/${project.id}`); };
  const hasImage = !project.thumbnail_url.startsWith('data:');

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title={project.name} />
        <main id="main-content" className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
          <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-300">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden /> All projects
          </Link>

          {/* A. Overview */}
          <Section id="sec-overview" letter="A" title="Project overview">
            <div className="grid md:grid-cols-5 gap-5">
              <div className="md:col-span-3 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {info.labels.map(l => (
                    <span key={l} className={`px-2 py-0.5 rounded-full border text-[11px] ${l === 'Demo Project' ? 'border-sky-500/40 text-sky-300' : 'border-slate-700 text-slate-300'}`}>{l}</span>
                  ))}
                </div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-xs uppercase tracking-wider text-slate-400">{info.category}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{info.description}</p>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Real-world applications</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {info.applications.map(a => <li key={a} className="px-2 py-0.5 rounded bg-aerospace-900 border border-slate-800 text-xs text-slate-200">{a}</li>)}
                  </ul>
                </div>
                <p className="text-xs text-slate-400 border-l-2 border-amber-500/50 pl-3">
                  Imagery was captured by the dataset’s authors, and the 3D output was processed outside AERO3D. AERO3D loads and inspects it here. No accuracy figures are claimed.
                </p>
              </div>
              <div className="md:col-span-2">
                {hasImage ? (
                  <SafeImage src={project.thumbnail_url} alt={`${project.name} reference`} className="w-full rounded-lg border border-slate-800 aspect-[16/9] object-cover" />
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-700 aspect-[16/9] flex items-center justify-center text-xs text-slate-400 text-center p-4">
                    Reference image is added once the dataset files are available
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* B. Input data */}
          <Section id="sec-input" letter="B" title="Input data">
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {info.facts.map(f => (
                <div key={f.label} className="flex justify-between gap-4 border-b border-slate-800/70 py-1.5">
                  <dt className="text-slate-400">{f.label}</dt>
                  <dd className="text-slate-100 text-right" title={f.verifiedFrom ? `Source: ${f.verifiedFrom}` : undefined}>{f.value}</dd>
                </div>
              ))}
            </dl>

            {info.gallery.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {info.gallery.map(g => (
                  <li key={g.src} className="rounded-lg border border-slate-800 overflow-hidden bg-aerospace-900">
                    <SafeImage src={g.src} alt={g.caption} className="w-full aspect-[4/3] object-cover" label="Thumbnail not bundled. Use the dataset link." />
                    <div className="p-3 text-xs space-y-1">
                      <p className="text-slate-200">{g.caption}</p>
                      {g.file && <p className="font-mono text-slate-400 break-all">{g.file}</p>}
                      {g.href && <a href={g.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-300 hover:underline">Original <ExternalLink className="w-3 h-3" aria-hidden /></a>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-xs text-slate-400">{info.galleryNote}</p>

            <div className="rounded-lg bg-aerospace-900 border border-slate-800 p-4 text-sm text-slate-300 leading-relaxed">
              <p className="font-semibold text-slate-100 mb-1">Why the photos overlap</p>
              Neighbouring photographs share a large part of the scene. Software finds the same points in several photos and, from how those points shift between views,
              works out where each camera was and where each point sits in 3D.
            </div>
          </Section>

          {/* C. Pipeline */}
          <Section id="sec-pipeline" letter="C" title="Reconstruction pipeline">
            <ol className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {PIPELINE.map((s, i) => (
                <li key={s.title} className="relative rounded-lg bg-aerospace-900 border border-slate-800 p-3">
                  <span className="text-[11px] font-mono text-sky-300">0{i + 1}</span>
                  <p className="text-sm font-semibold text-slate-100 mt-0.5">{s.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{s.text}</p>
                  {i < PIPELINE.length - 1 && <ChevronRight className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" aria-hidden />}
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-400 border-l-2 border-amber-500/50 pl-3">
              This pipeline is an explanation of the general method. These steps were run by the dataset’s authors with other software, not by AERO3D. AERO3D displays the published result.
            </p>
          </Section>

          {/* D. Output */}
          <Section id="sec-output" letter="D" title="Output model">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-300">
              <span><span className="text-slate-400">Format: </span>{info.outputFormat}</span>
              <span><span className="text-slate-400">File: </span><span className="font-mono">{project.model_url}</span></span>
            </div>
            <p className="text-xs text-slate-400">{info.outputNote}</p>

            <div className="relative rounded-lg border border-slate-800 bg-aerospace-900 overflow-hidden h-[340px] sm:h-[460px]">
              {probe === 'missing' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6 text-sm text-slate-300">
                  <FileQuestion className="w-7 h-7 text-slate-400" aria-hidden />
                  <p className="font-semibold">Output file not added yet</p>
                  <p className="text-xs text-slate-400 max-w-md">
                    {info.outputShipped
                      ? 'The model file could not be loaded from this deployment.'
                      : 'The published point cloud still needs to be added to this project. Nothing has been substituted.'}
                  </p>
                </div>
              ) : !show3d ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  {hasImage && <SafeImage src={project.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
                  <button type="button" disabled={probe !== 'present'} onClick={() => setShow3d(true)}
                    className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-aerospace-950 font-bold text-xs">
                    <Play className="w-4 h-4" aria-hidden /> Load 3D preview
                  </button>
                  <span className="relative text-[11px] text-slate-400">Loads only this project’s model.</span>
                </div>
              ) : (
                <ThreeCanvas
                  key={`${project.id}-${project.model_url}`}
                  activeTool="orbit"
                  renderMode="textured"
                  showGrid={false}
                  cameraPreset="default"
                  markers={[]}
                  onAddMarkerAtPoint={() => {}}
                  measurements={[]}
                  onAddMeasurement={() => {}}
                  scaleFactor={scaleFactor}
                  isCalibrated={isCalibrated}
                  projectId={project.id}
                  modelUrl={project.model_url as string}
                  project={project}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={openViewer} disabled={probe === 'missing'}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-aerospace-950 font-bold text-xs">
                <Maximize2 className="w-4 h-4" aria-hidden /> Open in full viewer (measure, dimensions, calibrate)
              </button>
            </div>
          </Section>

          {/* E. References */}
          <Section id="sec-refs" letter="E" title="Dataset references">
            <ul className="space-y-2 text-sm">
              {info.sources.map(s => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sky-300 hover:underline break-all">
                    {s.label} <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  </a>
                </li>
              ))}
              <li>
                <a href={info.licence.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sky-300 hover:underline">
                  Licence: {info.licence.name} <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                </a>
              </li>
            </ul>
            <p className="text-xs text-slate-400">Attribution: {info.licence.attribution}</p>
          </Section>
        </main>
      </div>
    </div>
  );
};
