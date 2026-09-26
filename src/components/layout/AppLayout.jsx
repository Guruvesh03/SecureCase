import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#030712' }}>
      <Sidebar />
      <main
        className="security-bg grid-pattern"
        style={{
          flex: 1,
          overflowY: 'auto',
          height: '100vh',
          position: 'relative',
        }}
      >
        <div className="page-enter" style={{ minHeight: '100%' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
