import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatHashShort } from '../crypto/hash.js';
import { getFileBlob } from '../store/indexedDB.js';
import { FileText, Search, Shield, AlertTriangle, Download, Filter, X } from 'lucide-react';

const TYPE_COLORS = {
  'FIR': '#60a5fa', 'Forensic Report': '#34d399', 'Witness Statement': '#fb923c',
  'Evidence Record': '#c084fc', 'Charge Sheet': '#facc15', 'Investigation Report': '#818cf8',
};

export default function DocumentVaultPage() {
  const { documents, cases } = useApp();
  const { user, can } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [integrityFilter, setIntegrityFilter] = useState('all');
  const [caseFilter, setCaseFilter] = useState('all');

  const filtered = documents.filter((d) => {
    const s = search.toLowerCase();
    const matchSearch = !s || d.name.toLowerCase().includes(s) || d.type.toLowerCase().includes(s) || d.owner.toLowerCase().includes(s) || d.caseId.toLowerCase().includes(s);
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchIntegrity = integrityFilter === 'all' || d.status === integrityFilter;
    const matchCase = caseFilter === 'all' || d.caseId === caseFilter;
    return matchSearch && matchType && matchIntegrity && matchCase;
  });

  const docTypes = [...new Set(documents.map(d => d.type))];

  const handleDownload = async (doc) => {
    const fileData = await getFileBlob(doc.id);
    if (fileData) {
      const url = URL.createObjectURL(fileData.blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileData.name; a.click();
      URL.revokeObjectURL(url);
    } else {
      const content = `SECURECASE VAULT EXPORT\n\nDocument: ${doc.name}\nCase: ${doc.caseId}\nType: ${doc.type}\nOwner: ${doc.owner}\nVersion: ${doc.version}\n\nSHA-256: ${doc.hash}\n\n[Demo document]`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = doc.name; a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
          Secure Document Vault
        </h1>
        <p style={{ color: '#475569', fontSize: '0.875rem', marginTop: 4 }}>
          {documents.length} documents protected · {documents.filter(d => d.status === 'verified').length} integrity verified
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="input-field" style={{ paddingLeft: 34 }} placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ width: 160, appearance: 'none' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input-field" style={{ width: 160, appearance: 'none' }} value={integrityFilter} onChange={e => setIntegrityFilter(e.target.value)}>
          <option value="all">All Integrity</option>
          <option value="verified">Verified</option>
          <option value="compromised">Compromised</option>
        </select>
        <select className="input-field" style={{ width: 180, appearance: 'none' }} value={caseFilter} onChange={e => setCaseFilter(e.target.value)}>
          <option value="all">All Cases</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Document', 'Type', 'Case', 'Owner', 'Version', 'Fingerprint', 'Integrity', 'Actions'].map(col => (
                  <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#475569' }}>
                    <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div>No documents match your filters</div>
                  </td>
                </tr>
              ) : filtered.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                        background: `${TYPE_COLORS[doc.type] || '#60a5fa'}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FileText size={13} color={TYPE_COLORS[doc.type] || '#60a5fa'} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#475569' }}>{(doc.fileSize / 1024).toFixed(0)} KB</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.7rem', color: TYPE_COLORS[doc.type] || '#60a5fa', fontWeight: 600 }}>{doc.type}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontFamily: 'monospace' }}>{doc.caseId}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{doc.owner.split(' ').slice(-1)[0]}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>v{doc.version}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="hash-display" style={{ fontSize: '0.65rem', color: doc.status === 'compromised' ? '#f87171' : '#34d399' }}>
                      {formatHashShort(doc.hash)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className={`badge badge-${doc.status === 'verified' ? 'verified' : 'compromised'}`}>
                      {doc.status === 'verified' ? <><Shield size={9} /> Verified</> : <><AlertTriangle size={9} /> Alert</>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {can('download') && (
                      <button
                        onClick={() => handleDownload(doc)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
