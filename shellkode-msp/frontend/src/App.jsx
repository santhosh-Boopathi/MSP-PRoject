import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import MSPDashboard from './pages/MSPDashboard';
import TeamPage from './pages/TeamPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import AppLayout from './components/layout/AppLayout';
import ClientReportSidebar from './components/layout/ClientReportSidebar';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#080c18', flexDirection: 'column', gap: 12 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <p style={{ color: '#8a9bc5', fontSize: 14 }}>Loading ShellKode MSP Portal...</p>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

function AppWithSidebar() {
  const [showReport, setShowReport] = useState(false);
  return (
    <>
      <AppLayout />
      <button onClick={() => setShowReport(true)} title="Client Report Status"
        style={{ position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: '10px 0 0 10px', color: 'white', cursor: 'pointer', zIndex: 900, padding: '14px 7px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '-4px 0 20px rgba(59,130,246,0.3)', writingMode: 'vertical-rl', fontSize: 11, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '0.5px' }}>
        📋 Report Status
      </button>
      <ClientReportSidebar isOpen={showReport} onClose={() => setShowReport(false)} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AppWithSidebar /></ProtectedRoute>}>
            <Route index element={<MSPDashboard />} />
            <Route path="msp" element={<MSPDashboard />} />
            <Route path="msp/:teamId" element={<TeamPage />} />
            <Route path="msp/:teamId/clients" element={<ClientsPage />} />
            <Route path="msp/:teamId/clients/:clientId/:section?" element={<ClientDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
