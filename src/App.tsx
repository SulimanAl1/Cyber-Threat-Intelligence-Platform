import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { StaleBanner } from './components/common/StaleBanner';
import { SettingsModal } from './components/extras/SettingsModal';

// Phase 1 Pages
import { Overview } from './pages/Overview';
import { ThreatFeed } from './pages/ThreatFeed';
import { VulnerabilityCenter } from './pages/VulnerabilityCenter';
import { IncidentInvestigation } from './pages/IncidentInvestigation';
import { SourceHealth } from './pages/SourceHealth';
import { Methodology } from './pages/Methodology';

export const AppContent: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <StaleBanner />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/feed" element={<ThreatFeed />} />
            <Route path="/vulnerabilities" element={<VulnerabilityCenter />} />
            <Route path="/investigation" element={<IncidentInvestigation />} />
            <Route path="/sources" element={<SourceHealth />} />
            <Route path="/methodology" element={<Methodology />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <DataProvider>
      <Router>
        <AppContent />
      </Router>
    </DataProvider>
  );
};
