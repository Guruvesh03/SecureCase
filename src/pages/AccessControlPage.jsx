import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { PERMISSIONS, DEPARTMENTS } from '../store/seedData.js';
import { Lock, Shield, CheckCircle2, X, AlertTriangle } from 'lucide-react';

const PERM_LABELS = {
  upload: { label: 'Upload Documents', icon: '📤' },
  download: { label: 'Download Documents', icon: '📥' },
  delete: { label: 'Delete Documents', icon: '🗑' },
  verify: { label: 'Verify Integrity', icon: '✓' },
  manageAccess: { label: 'Manage Access', icon: '🔑' },
  createCase: { label: 'Create Cases', icon: '📁' },
  viewAll: { label: 'View All Cases', icon: '👁' },
};

const ROLE_LEVELS = ['admin', 'police', 'forensic', 'prosecutor', 'judiciary'];
const ROLE_BAR_CONFIG = {
  admin: { label: 'FULL ADMIN', color: '#c084fc', barColor: 'rgba(192,132,252,0.8)', width: '100%' },
  police: { label: 'FULL ACCESS', color: '#60a5fa', barColor: 'rgba(96,165,250,0.8)', width: '80%' },
  forensic: { label: 'EVIDENCE ACCESS', color: '#34d399', barColor: 'rgba(52,211,153,0.8)', width: '60%' },
  prosecutor: { label: 'READ ACCESS', color: '#fb923c', barColor: 'rgba(251,146,60,0.8)', width: '40%' },
  judiciary: { label: 'READ ONLY', color: '#facc15', barColor: 'rgba(250,204,21,0.8)', width: '20%' },
};

export default function AccessControlPage() {
  const { user, can, addAuditLog: authLog } = useAuth();
  const { addAuditLog } = useApp();
  const [denyVisible, setDenyVisible] = useState(false);
  const [denyAction, setDenyAction] = useState('');
  const [selectedRole, setSelectedRole] = useState('police');

  const tryAction = (action) => {
    if (!can(action)) {
      setDenyAction(action);
      setDenyVisible(true);
      addAuditLog({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        user: user.name, userId: user.id, role: user.role,
        caseId: null, documentId: null, documentName: null,
        description: `⚠ Unauthorized attempt: ${action} by ${user.name} (${user.role}) on Access Control page`,
        type: 'access_control', severity: 'error',
      });
    } else {
      alert(`✓ Action "${action}" is permitted for your role (${user.role})`);
    }
  };

  const selectedPerms = PERMISSIONS[selectedRole] || {};

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
          Access Control
        </h1>
        <p style={{ color: '#475569', fontSize: '0.875rem', marginTop: 4 }}>
          Role-based access control (RBAC) policy visualization
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Access Matrix visualization */}
        <div className="glass-card" style={{ borderRadius: 16, padding: '24px' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: 16 }}>ACCESS MATRIX</h2>
          {ROLE_LEVELS.map((role) => {
            const cfg = ROLE_BAR_CONFIG[role];
            return (
              <div key={role} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', align: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', textTransform: 'uppercase' }}>{role}</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: cfg.color, fontFamily: 'monospace', letterSpacing: '0.06em' }}>{cfg.label}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: cfg.width, background: cfg.barColor,
                    borderRadius: 3, transition: 'width 1s ease-out',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {Object.entries(PERMISSIONS[role] || {}).filter(([k]) => !['label', 'level'].includes(k)).map(([perm, allowed]) => (
                    <span key={perm} style={{
                      fontSize: '0.6rem', padding: '2px 6px', borderRadius: 3,
                      background: allowed ? `${cfg.color}15` : 'rgba(255,255,255,0.03)',
                      color: allowed ? cfg.color : '#334155',
                      border: `1px solid ${allowed ? `${cfg.color}30` : 'rgba(255,255,255,0.05)'}`,
                    }}>
                      {PERM_LABELS[perm]?.icon} {perm}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Permission Detail */}
        <div className="glass-card" style={{ borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>PERMISSION DETAIL</h2>
            <select
              className="input-field"
              style={{ width: 130, appearance: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            >
              {ROLE_LEVELS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(PERM_LABELS).map(([perm, { label, icon }]) => {
              const allowed = !!selectedPerms[perm];
              return (
                <div key={perm} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8,
                  background: allowed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.04)',
                  border: `1px solid ${allowed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1rem' }}>{icon}</span>
                    <span style={{ fontSize: '0.8rem', color: allowed ? '#e2e8f0' : '#64748b', fontWeight: allowed ? 600 : 400 }}>{label}</span>
                  </div>
                  {allowed
                    ? <CheckCircle2 size={16} color="#10b981" />
                    : <X size={16} color="#ef4444" />
                  }
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RBAC Live Test */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '24px' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
          LIVE RBAC TEST — Your Current Role: <span style={{ color: ROLE_BAR_CONFIG[user?.role]?.color || '#60a5fa' }}>{user?.role?.toUpperCase()}</span>
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 20 }}>
          Click actions below to test your permissions. Denied actions are recorded in the audit trail.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { action: 'delete', label: '🗑 Delete Document', danger: true },
            { action: 'manageAccess', label: '🔑 Manage Access', danger: false },
            { action: 'upload', label: '📤 Upload Document', danger: false },
            { action: 'verify', label: '✓ Verify Integrity', danger: false },
            { action: 'createCase', label: '📁 Create Case', danger: false },
          ].map(({ action, label, danger }) => (
            <button
              key={action}
              className={danger ? 'btn-danger' : 'btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
              onClick={() => tryAction(action)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Deny Modal */}
      {denyVisible && (
        <div className="modal-overlay" onClick={() => setDenyVisible(false)}>
          <div className="modal-content alert-threat" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚫</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f87171', marginBottom: 8 }}>ACCESS DENIED</h3>
            <p style={{ fontSize: '0.85rem', color: '#f87171', opacity: 0.8, marginBottom: 20 }}>
              You do not have permission to perform this operation.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 2 }}>Your Role</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>{user?.role}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 2 }}>Required</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ADMINISTRATOR</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 2 }}>Action</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171', fontFamily: 'monospace' }}>{denyAction}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 2 }}>Status</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>RECORDED</div>
              </div>
            </div>
            <div style={{
              fontSize: '0.75rem', color: '#f59e0b',
              background: 'rgba(245,158,11,0.1)', borderRadius: 6, padding: '8px 12px',
              marginBottom: 16,
            }}>
              ⚠ This unauthorized attempt has been recorded in the audit trail.
            </div>
            <button className="btn-secondary" onClick={() => setDenyVisible(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
