import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import MSPDashboard from './pages/MSPDashboard';
import TeamPage from './pages/TeamPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import AppLayout from './components/layout/AppLayout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#080c18', flexDirection:'column', gap:12 }}>
      <div className="spinner" style={{ width:40, height:40, borderWidth:3 }} />
      <p style={{ color:'#8a9bc5', fontSize:14 }}>Loading ShellKode MSP Portal...</p>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
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
