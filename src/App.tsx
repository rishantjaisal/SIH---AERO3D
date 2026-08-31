import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './store/ProjectContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { NewSurvey } from './pages/NewSurvey';
import { ProcessingPage } from './pages/ProcessingPage';
import { ViewerPage } from './pages/ViewerPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { MapPage } from './pages/MapPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { ReportsPage } from './pages/ReportsPage';
import { PresentationPage } from './pages/PresentationPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ProjectProvider>
        <Router>
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
        </Router>
      </ProjectProvider>
    </ErrorBoundary>
  );
};

export default App;
