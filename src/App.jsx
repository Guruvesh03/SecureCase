import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { initSeedData } from './store/localStorage.js';

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CasesPage from './pages/CasesPage.jsx';
import CaseWorkspacePage from './pages/CaseWorkspacePage.jsx';
import DocumentVaultPage from './pages/DocumentVaultPage.jsx';
import EvidenceChainPage from './pages/EvidenceChainPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import AuditTrailPage from './pages/AuditTrailPage.jsx';
import AccessControlPage from './pages/AccessControlPage.jsx';
import SecurityCenterPage from './pages/SecurityCenterPage.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

// Initialize seed data on first load
initSeedData();

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030712' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2px solid #1d4ed8', borderTop: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading SecureCase...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/:caseId" element={<CaseWorkspacePage />} />
        <Route path="vault" element={<DocumentVaultPage />} />
        <Route path="evidence-chain" element={<EvidenceChainPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="audit" element={<AuditTrailPage />} />
        <Route path="access" element={<AccessControlPage />} />
        <Route path="security" element={<SecurityCenterPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  );
}
