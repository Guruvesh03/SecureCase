import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { addAuditLog } from '../store/localStorage.js';
import {
  FolderOpen, Plus, Search, Shield, AlertTriangle,
  Clock, FileText, ChevronRight, Filter,
} from 'lucide-react';

const STATUS_CONFIG = {
  under_investigation: { label: 'Under Investigation', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)' },
  chargesheet_filed: { label: 'Chargesheet Filed', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)' },
  pending_review: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  closed: { label: 'Closed', color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)' },
};

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#64748b' };

function CaseCard({ caseObj, onClick }) {
  const status = STATUS_CONFIG[caseObj.status] || STATUS_CONFIG.under_investigation;
  const lastActivity = new Date(caseObj.lastActivity);
  const diff = Date.now() - lastActivity.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const timeAgo = days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : `${mins}m ago`;

  return (
    <div
      className="stat-card-large glass-card-hover"
      onClick={onClick}
      style={{ cursor: 'pointer', borderRadius: 14 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700, marginBottom: 4 }}>
            {caseObj.id}
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>{caseObj.title}</h3>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{caseObj.type}</div>
        </div>
        <div
          style={{
            padding: '4px 10px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700,
            background: status.bg, color: status.color, border: `1px solid ${status.border}`,
            whiteSpace: 'nowrap', letterSpacing: '0.04em',
          }}
        >
          {status.label}
        </div>
      </div>

      {/* Priority bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {['high', 'medium', 'low'].map((p) => (
          <div
            key={p}
            style={{
              height: 3, flex: 1, borderRadius: 2,
              background: p === caseObj.priority ? PRIORITY_COLORS[p] : 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 2 }}>Officer</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{caseObj.officer}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 2 }}>Documents</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{caseObj.documentsCount}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 2 }}>FIR</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{caseObj.fir}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 2 }}>Last Activity</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} /> {timeAgo}
          </div>
        </div>
      </div>

      {/* Integrity indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: 8,
        background: caseObj.integrity === 'verified' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
        border: `1px solid ${caseObj.integrity === 'verified' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {caseObj.integrity === 'verified'
            ? <Shield size={12} color="#34d399" />
            : <AlertTriangle size={12} color="#f59e0b" />
          }
          <span style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: caseObj.integrity === 'verified' ? '#34d399' : '#f59e0b',
          }}>
            {caseObj.integrity === 'verified' ? 'INTEGRITY VERIFIED' : 'INTEGRITY ALERT'}
          </span>
        </div>
        <ChevronRight size={14} color="#475569" />
      </div>
    </div>
  );
}

// New Case Modal
function NewCaseModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', type: 'Cybercrime', fir: '', description: '' });
  const { user } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = `CASE-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const newCase = {
      id,
      ...form,
      status: 'under_investigation',
      officer: user.name,
      officerId: user.id,
      department: user.department,
      documentsCount: 0,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      integrity: 'verified',
      priority: 'medium',
    };
    onSave(newCase);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: 24 }}>Register New Case</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Case Title *</label>
            <input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Cyber Crime Investigation" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Case Type</label>
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ appearance: 'none' }}>
              {['Cybercrime', 'Financial Fraud', 'Digital Forensics', 'Online Fraud', 'Forensic Analysis', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>FIR Number</label>
            <input className="input-field" value={form.fir} onChange={(e) => setForm({ ...form, fir: e.target.value })} placeholder="FIR-2026-XXX" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
            <textarea className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Case summary..." rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create Case</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const { cases, addCase, addAuditLog } = useApp();
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewCase, setShowNewCase] = useState(false);

  const filtered = cases.filter((c) => {
    const matchSearch = !search || c.id.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase()) || c.fir?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleNewCase = (caseObj) => {
    addCase(caseObj);
    addAuditLog({
      action: 'CASE_CREATED',
      user: user.name,
      userId: user.id,
      role: user.role,
      caseId: caseObj.id,
      documentId: null,
      documentName: null,
      description: `New case ${caseObj.id} created: ${caseObj.title}`,
      type: 'case',
      severity: 'info',
    });
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
            Case Intelligence
          </h1>
          <p style={{ color: '#475569', fontSize: '0.875rem', marginTop: 4 }}>
            {cases.length} active cases · {cases.filter(c => c.integrity === 'verified').length} integrity verified
          </p>
        </div>
        {can('createCase') && (
          <button className="btn-primary" onClick={() => setShowNewCase(true)}>
            <Plus size={16} /> Register Case
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 36 }}
            placeholder="Search by case ID, title, FIR number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field" style={{ width: 200, appearance: 'none' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="under_investigation">Under Investigation</option>
          <option value="chargesheet_filed">Chargesheet Filed</option>
          <option value="pending_review">Pending Review</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#475569' }}>
          <FolderOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>No cases found</div>
          <div style={{ fontSize: '0.85rem' }}>Try adjusting your search or filters</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((c) => (
            <CaseCard
              key={c.id}
              caseObj={c}
              onClick={() => navigate(`/cases/${c.id}`)}
            />
          ))}
        </div>
      )}

      {showNewCase && (
        <NewCaseModal
          onClose={() => setShowNewCase(false)}
          onSave={handleNewCase}
        />
      )}
    </div>
  );
}
