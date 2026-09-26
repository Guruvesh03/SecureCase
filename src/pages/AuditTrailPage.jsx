import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ClipboardList, AlertTriangle, CheckCircle2, Upload, User, Shield, Lock, Activity } from 'lucide-react';

const TYPE_CONFIG = {
  upload: { color: '#60a5fa', icon: Upload, label: 'Upload' },
  verify: { color: '#34d399', icon: CheckCircle2, label: 'Verify' },
  access: { color: '#94a3b8', icon: User, label: 'Access' },
  access_control: { color: '#c084fc', icon: Lock, label: 'Access Control' },
  auth: { color: '#fb923c', icon: Shield, label: 'Authentication' },
  case: { color: '#818cf8', icon: ClipboardList, label: 'Case' },
  error: { color: '#ef4444', icon: AlertTriangle, label: 'Alert' },
};

const SEVERITY_COLORS = {
  error: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  success: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)' },
  info: { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.05)' },
};

export default function AuditTrailPage() {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filtered = auditLogs.filter((log) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      log.action.toLowerCase().includes(q) ||
      log.user.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      log.caseId?.toLowerCase().includes(q) ||
      log.documentName?.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || log.type === typeFilter;
    const matchSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchSearch && matchType && matchSeverity;
  });

  const errorCount = auditLogs.filter(l => l.severity === 'error').length;

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
            Forensic Audit Trail
          </h1>
          <p style={{ color: '#475569', fontSize: '0.875rem', marginTop: 4 }}>
            {auditLogs.length} events recorded · {errorCount} security alerts
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)',
          borderRadius: 8, padding: '6px 12px',
        }}>
          <Activity size={12} color="#fb923c" />
          <span style={{ fontSize: '0.7rem', color: '#fb923c', fontWeight: 700 }}>LIVE MONITORING</span>
        </div>
      </div>

      {/* Alert summary */}
      {errorCount > 0 && (
        <div className="alert-threat" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={20} color="#ef4444" />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171' }}>
              {errorCount} Security Alert{errorCount !== 1 ? 's' : ''} Detected
            </div>
            <div style={{ fontSize: '0.75rem', color: '#f87171', opacity: 0.7 }}>
              Review integrity failures and unauthorized access attempts below.
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <input
            className="input-field"
            style={{ paddingLeft: 14 }}
            placeholder="Search audit events, users, cases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field" style={{ width: 160, appearance: 'none' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="upload">Upload</option>
          <option value="verify">Verification</option>
          <option value="access">Access</option>
          <option value="access_control">Access Control</option>
          <option value="auth">Authentication</option>
          <option value="case">Case</option>
        </select>
        <select className="input-field" style={{ width: 160, appearance: 'none' }} value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          <option value="all">All Severity</option>
          <option value="error">Alerts Only</option>
          <option value="success">Success</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '24px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569' }}>
            <ClipboardList size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>No audit events match your filters</div>
          </div>
        ) : filtered.map((log, i) => {
          const cfg = TYPE_CONFIG[log.type] || TYPE_CONFIG.access;
          const Icon = cfg.icon;
          const sev = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info;

          return (
            <div key={log.id} className="timeline-item" style={{ marginBottom: 12 }}>
              <div className="timeline-dot" style={{
                borderColor: cfg.color,
                background: `${cfg.color}20`,
              }}>
                <Icon size={8} color={cfg.color} />
              </div>
              <div style={{
                background: sev.bg, border: `1px solid ${sev.border}`,
                borderRadius: 10, padding: '12px 16px',
                animation: i === 0 ? 'fade-in-up 0.4s ease-out' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 800, color: cfg.color,
                      fontFamily: 'monospace', letterSpacing: '0.04em',
                    }}>
                      {log.action}
                    </span>
                    {log.severity === 'error' && (
                      <span style={{ fontSize: '0.6rem', color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>ALERT</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'monospace' }}>
                    {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 6, lineHeight: 1.5 }}>
                  {log.description}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.65rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <User size={9} /> {log.user}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Shield size={9} /> {log.role}
                  </span>
                  {log.caseId && (
                    <span style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'monospace' }}>
                      📁 {log.caseId}
                    </span>
                  )}
                  {log.documentName && (
                    <span style={{ fontSize: '0.65rem', color: '#475569' }}>
                      📄 {log.documentName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
