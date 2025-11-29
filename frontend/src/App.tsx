import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/common/Layout/Layout';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { IngestPage } from './pages/IngestPage/IngestPage';
import { QueryPage } from './pages/QueryPage/QueryPage';
import { DocumentsPage } from './pages/DocumentsPage/DocumentsPage';
import { ToastProvider } from './components/common/Toast/Toast';

import { useEffect } from 'react';
import { useSettingsStore } from './store/settingsStore';

// Placeholder for Dashboard
const Dashboard = () => <Navigate to="/ingest" replace />;

function App() {
  useEffect(() => {
    useSettingsStore.getState().initialize();
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ingest" element={<IngestPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/query" element={<QueryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
