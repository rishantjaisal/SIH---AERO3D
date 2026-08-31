import React from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Download, Box, MapPin, Calendar, Camera, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useProjects } from '../store/ProjectContext';

export const ReportsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, activeProject, markers } = useProjects();
  const currentProj = (projects || []).find(p => p && p.id === projectId) || activeProject || projects[0];

  const handlePrint = () => {
    window.print();
  };

  const projIdLabel = (currentProj?.id || 'demo').toString().toUpperCase();
  const providerLabel = (currentProj?.provider || 'demo').toString().toUpperCase();

  return (
    <div className="flex h-screen bg-aerospace-950 text-slate-100 overflow-hidden font-sans">
      
      <div className="print:hidden">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        <div className="print:hidden">
          <Topbar title="Executive Survey Report Generator" />
        </div>

        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">

          {/* Action Bar */}
          <div className="flex items-center justify-between print:hidden">
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-sans">Executive Digital Twin Inspection Report</h2>
              <p className="text-xs text-slate-400">PDF-ready formal survey documentation for engineering teams.</p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-aerospace-950 font-bold text-xs shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF Report</span>
            </button>
          </div>

          {/* Printable Report Document Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8 print:bg-white print:text-slate-900 print:border-none print:shadow-none">
            
            {/* Report Header */}
            <div className="flex items-start justify-between border-b border-slate-800 print:border-slate-300 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-2xl tracking-wider text-sky-400 print:text-slate-900 font-mono">AERO<span className="text-slate-100 print:text-sky-600">3D</span></span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 print:bg-slate-200 print:text-slate-800">DIGITAL TWIN AUDIT</span>
                </div>
                <h1 className="text-xl font-bold text-slate-100 print:text-slate-900 mt-2">{currentProj?.name || 'KIET Campus Building Survey'}</h1>
                <p className="text-xs text-slate-400 print:text-slate-600 font-mono">Report Ref: AUDIT-{projIdLabel}-2026</p>
              </div>

              <div className="text-right text-xs font-mono text-slate-400 print:text-slate-600">
                <p>Date: {currentProj?.metadata?.surveyDate || '2026-08-28'}</p>
                <p>Status: APPROVED</p>
                <p>Provider: {providerLabel}</p>
              </div>
            </div>

            {/* 3D Model Snapshot Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 rounded-xl overflow-hidden border border-slate-800 print:border-slate-300">
                <img
                  src={currentProj?.thumbnail_url}
                  alt="3D Digital Twin Model Snapshot"
                  className="w-full h-48 object-cover"
                />
              </div>

              <div className="md:col-span-2 space-y-2 text-xs">
                <h3 className="font-bold text-sky-300 print:text-slate-900 font-mono text-sm uppercase">Site Overview & Coordinates</h3>
                <div className="grid grid-cols-2 gap-2 p-3 rounded bg-aerospace-950 print:bg-slate-100 border border-slate-800 print:border-slate-300 font-mono">
                  <div>
                    <span className="text-slate-500 print:text-slate-600 block text-[10px]">LOCATION</span>
                    <span className="font-bold">{currentProj?.metadata?.locationName || 'Delhi NCR, India'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 print:text-slate-600 block text-[10px]">GSD ACCURACY</span>
                    <span className="font-bold text-emerald-400 print:text-emerald-700">{currentProj?.metadata?.gsd || '1.2 cm/px'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 print:text-slate-600 block text-[10px]">DRONE RIG</span>
                    <span className="font-bold">{currentProj?.metadata?.droneModel || 'DJI Mavic 3 Enterprise RTK'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 print:text-slate-600 block text-[10px]">ALTITUDE</span>
                    <span className="font-bold">{currentProj?.metadata?.flightAltitude || '45 m'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mesh Geometry Metrics Table */}
            <div className="space-y-3">
              <h3 className="font-bold text-sky-300 print:text-slate-900 font-mono text-xs uppercase">1. Photogrammetry 3D Mesh Metrics</h3>
              <div className="grid grid-cols-4 gap-3 font-mono text-xs text-center">
                <div className="p-3 rounded bg-aerospace-950 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <span className="text-[10px] text-slate-500 block">VERTICES</span>
                  <span className="font-bold text-sm">{(currentProj?.metadata?.vertices || 48520).toLocaleString()}</span>
                </div>
                <div className="p-3 rounded bg-aerospace-950 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <span className="text-[10px] text-slate-500 block">POLYGON FACES</span>
                  <span className="font-bold text-sm">{(currentProj?.metadata?.faces || 92400).toLocaleString()}</span>
                </div>
                <div className="p-3 rounded bg-aerospace-950 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <span className="text-[10px] text-slate-500 block">SURFACE AREA</span>
                  <span className="font-bold text-sm text-sky-300 print:text-sky-700">{currentProj?.metadata?.estimatedArea || 855.6} m²</span>
                </div>
                <div className="p-3 rounded bg-aerospace-950 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <span className="text-[10px] text-slate-500 block">HEIGHT DELTA</span>
                  <span className="font-bold text-sm text-sky-300 print:text-sky-700">{currentProj?.metadata?.estimatedHeight || 18.2} m</span>
                </div>
              </div>
            </div>

            {/* Inspection Findings Table */}
            <div className="space-y-3">
              <h3 className="font-bold text-sky-300 print:text-slate-900 font-mono text-xs uppercase">2. Flagged Structural Inspection Findings</h3>
              <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300">
                <thead className="bg-aerospace-950 print:bg-slate-200 text-slate-400 print:text-slate-700 font-mono text-[10px]">
                  <tr>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5">Finding Label</th>
                    <th className="p-2.5">Inspector Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300 font-mono">
                  {(markers || []).map(m => (
                    <tr key={m.id}>
                      <td className="p-2.5 font-bold">{m.category}</td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          m.severity === 'High' ? 'bg-rose-500/20 text-rose-300 print:text-rose-700' : 'bg-amber-500/20 text-amber-300 print:text-amber-700'
                        }`}>
                          {m.severity}
                        </span>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-200 print:text-slate-900">{m.label}</td>
                      <td className="p-2.5 text-slate-400 print:text-slate-600 font-sans">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex justify-between text-xs font-mono text-slate-400 print:text-slate-600">
              <div>
                <p className="font-bold">Aero3D Flight Lead Signoff:</p>
                <div className="h-8" />
                <p className="text-[10px] text-slate-500">Certified Photogrammetry Pilot</p>
              </div>
              <div className="text-right">
                <p className="font-bold">Chief GIS Surveyor Signoff:</p>
                <div className="h-8" />
                <p className="text-[10px] text-slate-500">Licensed Professional Engineer</p>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};
