import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Shield,
  LayoutDashboard,
  FolderOpen,
  FileText,
  Link2,
  Search,
  ClipboardList,
  Lock,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Activity,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Command Center', icon: LayoutDashboard, exact: true },
  { to: '/cases', label: 'Cases', icon: FolderOpen },
  { to: '/vault', label: 'Document Vault', icon: FileText },
  { to: '/evidence-chain', label: 'Evidence Chain', icon: Link2 },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/audit', label: 'Audit Trail', icon: ClipboardList },
  { to: '/access', label: 'Access Control', icon: Lock },
  { to: '/security', label: 'Security Center', icon: ShieldCheck },
];

const ROLE_COLORS = {
  admin: { bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.3)', text: '#c084fc' },
  police: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)', text: '#60a5fa' },
  prosecutor: { bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.3)', text: '#fb923c' },
  judiciary: { bg: 'rgba(250,204,21,0.15)', border: 'rgba(250,204,21,0.3)', text: '#facc15' },
  forensic: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)', text: '#34d399' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleStyle = ROLE_COLORS[user?.role] || ROLE_COLORS.police;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #1d4ed8, #0f172a)',
            border: '1px solid rgba(96,165,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Shield size={18} color="#60a5fa" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              SECURE<span style={{ color: '#60a5fa' }}>CASE</span>
            </div>
            <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Evidence Management
            </div>
          </div>
        </div>

        {/* System status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 12,
          padding: '6px 10px', borderRadius: 6,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <div className="status-dot status-secure animate-pulse-green" />
          <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600, letterSpacing: '0.05em' }}>
            SYSTEM SECURE
          </span>
          <Activity size={10} color="#34d399" style={{ marginLeft: 'auto' }} />
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.65rem', color: '#334155', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 6px 8px' }}>
          Navigation
        </div>
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
            {to === '/audit' && (
              <span style={{
                marginLeft: 'auto', background: 'rgba(251,146,60,0.2)',
                color: '#fb923c', fontSize: '0.6rem', padding: '1px 5px',
                borderRadius: 3, fontWeight: 700,
              }}>LIVE</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User panel */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{
          padding: '12px', borderRadius: 10,
          background: roleStyle.bg,
          border: `1px solid ${roleStyle.border}`,
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: roleStyle.bg, border: `2px solid ${roleStyle.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, color: roleStyle.text,
              flexShrink: 0,
            }}>
              {user?.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: roleStyle.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {user?.role} · {user?.badgeId}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: '0.65rem', color: '#64748b' }}>
            {user?.department}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.8rem' }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
