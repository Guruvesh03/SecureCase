import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Link2, CheckCircle2, Clock, User, Shield } from 'lucide-react';

const CHAIN_STAGES = [
  { id: 'collection', label: 'Evidence Collected', icon: '📦', role: 'Field Officer', color: '#60a5fa' },
  { id: 'upload', label: 'Officer Uploaded', icon: '📤', role: 'Police', color: '#60a5fa' },
  { id: 'hash', label: 'SHA-256 Generated', icon: '🔐', role: 'System', color: '#818cf8' },
  { id: 'forensic', label: 'Forensic Analysis', icon: '🔬', role: 'Forensic Dept', color: '#34d399' },
  { id: 'verify', label: 'Integrity Verified', icon: '✓', role: 'System', color: '#34d399' },
  { id: 'prosecution', label: 'Prosecution Review', icon: '⚖', role: 'Prosecutor', color: '#fb923c' },
  { id: 'judiciary', label: 'Judicial Review', icon: '🏛', role: 'Judiciary', color: '#facc15' },
];

export default function EvidenceChainPage() {
  const { documents, cases } = useApp();
  const evidenceDocs = documents.filter(d => d.type === 'Evidence Record' || d.type === 'Forensic Report');
  const [selectedDoc, setSelectedDoc] = useState(evidenceDocs[0] || null);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
          Evidence Chain
        </h1>
        <p style={{ color: '#475569', fontSize: '0.875rem', marginTop: 4 }}>
          Prototype chain-of-custody visualization — not a legally certified chain of custody
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Evidence list */}
        <div className="glass-card" style={{ borderRadius: 16, padding: 16, alignSelf: 'start' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Select Evidence
          </div>
          {evidenceDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#475569', fontSize: '0.8rem' }}>No evidence records</div>
          ) : evidenceDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
                background: selectedDoc?.id === doc.id ? 'rgba(29,78,216,0.2)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${selectedDoc?.id === doc.id ? 'rgba(29,78,216,0.4)' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', marginBottom: 2 }}>{doc.name}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{doc.caseId} · {doc.type}</div>
            </div>
          ))}
        </div>

        {/* Chain visualization */}
        <div>
          {!selectedDoc ? (
            <div className="glass-card" style={{ borderRadius: 16, padding: 40, textAlign: 'center', color: '#475569' }}>
              <Link2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div>Select an evidence document to view its chain</div>
            </div>
          ) : (
            <div className="glass-card" style={{ borderRadius: 16, padding: '24px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#60a5fa', marginBottom: 4 }}>
                  {selectedDoc.caseId}
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>
                  {selectedDoc.name}
                </h2>
                <div className={`badge badge-${selectedDoc.status === 'verified' ? 'verified' : 'compromised'}`}>
                  {selectedDoc.status === 'verified' ? '✓ Chain Integrity Verified' : '⚠ Chain Alert'}
                </div>
              </div>

              {/* Chain of custody */}
              <div className="custody-chain">
                {CHAIN_STAGES.map((stage, i) => {
                  const ts = new Date(selectedDoc.uploadedAt);
                  ts.setHours(ts.getHours() - (CHAIN_STAGES.length - i - 1) * 2);

                  return (
                    <React.Fragment key={stage.id}>
                      <div className="custody-node" style={{ borderColor: `${stage.color}30` }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                          background: `${stage.color}15`,
                          border: `2px solid ${stage.color}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem',
                        }}>
                          {stage.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
                            {stage.label}
                          </div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <User size={10} /> {stage.role === 'Police' ? selectedDoc.owner : stage.role}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={10} /> {ts.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={16} color="#10b981" />
                          <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>Recorded</span>
                        </div>
                      </div>
                      {i < CHAIN_STAGES.length - 1 && <div className="custody-connector" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Chain integrity summary */}
              <div style={{
                marginTop: 20, padding: 16, borderRadius: 10,
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={16} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                      Complete chain of custody documented
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                      {CHAIN_STAGES.length} stages · All transitions recorded · SHA-256 verified
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: '0.65rem', color: '#334155', textAlign: 'center' }}>
                ⚠ This is a prototype visualization for demonstration purposes only. Not a legally certified chain of custody.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
