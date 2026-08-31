import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './store/ProjectContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const NewSurvey = lazy(() => import('./pages/NewSurvey').then(m => ({ default: m.NewSurvey })));
const ProcessingPage = lazy(() => import('./pages/ProcessingPage').then(m => ({ default: m.ProcessingPage })));
const ViewerPage = lazy(() => import('./pages/ViewerPage').then(m => ({ default: m.ViewerPage })));
const AIAnalysisPage = lazy(() => import('./pages/AIAnalysisPage').then(m => ({ default: m.AIAnalysisPage })));
const MapPage = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })));
const DigitalTwinPage = lazy(() => import('./pages/DigitalTwinPage').then(m => ({ default: m.DigitalTwinPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const PresentationPage = lazy(() => import('./pages/PresentationPage').then(m => ({ default: m.PresentationPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-aerospace-950 text-slate-100 flex items-center justify-center font-mono text-xs">
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-panel border border-slate-800">
      <span className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
      <span>Loading Aero3D Module...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ProjectProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/new" element={<NewSurvey />} />
              
              {/* Parameterized and Default Routes */}
              <Route path="/processing" element={<ProcessingPage />} />
              <Route path="/processing/:projectId" element={<ProcessingPage />} />
              
              <Route path="/viewer" element={<ViewerPage />} />
              <Route path="/viewer/:projectId" element={<ViewerPage />} />
              
              <Route path="/analysis" element={<AIAnalysisPage />} />
              <Route path="/analysis/:projectId" element={<AIAnalysisPage />} />
              
              <Route path="/map" element={<MapPage />} />
              <Route path="/map/:projectId" element={<MapPage />} />
              
              <Route path="/digital-twin" element={<DigitalTwinPage />} />
              <Route path="/digital-twin/:projectId" element={<DigitalTwinPage />} />
              
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:projectId" element={<ReportsPage />} />
              
              <Route path="/presentation" element={<PresentationPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              
              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ProjectProvider>
    </ErrorBoundary>
  );
};

export default App;
