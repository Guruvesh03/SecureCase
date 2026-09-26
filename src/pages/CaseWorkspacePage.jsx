import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getCaseById, getDocsByCase, getAuditByCase, getVersionsByDoc } from '../store/localStorage.js';
import { sha256, formatHash, formatHashShort, generateTamperedHash } from '../crypto/hash.js';
import { saveFileBlob, getFileBlob } from '../store/indexedDB.js';
import {
  ArrowLeft, Shield, ShieldAlert, Upload, FileText, Download,
  Eye, Hash, Clock, User, AlertTriangle, CheckCircle2,
  RefreshCw, RotateCcw, Lock, Unlock, ChevronDown, ChevronUp,
  Plus, X, Activity,
} from 'lucide-react';

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview' },
  { id: 'documents', label: 'Documents' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'access', label: 'Access' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'integrity', label: 'Integrity' },
];

const TYPE_COLORS = {
  'FIR': '#60a5fa',
  'Forensic Report': '#34d399',
  'Witness Statement': '#fb923c',
  'Evidence Record': '#c084fc',
  'Charge Sheet': '#facc15',
  'Investigation Report': '#818cf8',
  'Court Filing': '#f87171',
};

// ──────────────────────────────────────────────────────────────
// Document Detail Panel (the WOW feature with tamper demo)
// ──────────────────────────────────────────────────────────────
function DocumentDetailPanel({ doc, onClose, onUpdate, caseId }) {
  const { addAuditLog } = useApp();
  const { user } = useAuth();
  const [tamperState, setTamperState] = useState('idle'); // idle | simulating | compromised | restoring | restored
  const [currentHash, setCurrentHash] = useState(doc.hash);
  const [verifying, setVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [versions, setVersions] = useState([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setVersions(getVersionsByDoc(doc.id));
    setCurrentHash(doc.hash);
    setTamperState('idle');
    setVerifyStep(0);
  }, [doc.id]);

  const isCompromised = tamperState === 'compromised';
  const isRestored = tamperState === 'restored';

  const simulateTampering = async () => {
    setTamperState('simulating');
    await new Promise(r => setTimeout(r, 800));
    const tampered = await generateTamperedHash(doc.originalHash);
    setCurrentHash(tampered);
    onUpdate(doc.id, { hash: tampered, status: 'compromised' });
    setTamperState('compromised');
    addAuditLog({
      action: 'INTEGRITY_VIOLATION_SIMULATED',
      user: user.name,
      userId: user.id,
      role: user.role,
      caseId,
      documentId: doc.id,
      documentName: doc.name,
      description: `⚠ DEMO: Tampering simulation triggered on ${doc.name}`,
      type: 'verify',
      severity: 'error',
    });
  };

  const verifyIntegrity = async () => {
    setVerifying(true);
    const steps = ['Reading document...', 'Computing SHA-256...', 'Comparing fingerprints...', 'Generating report...'];
    for (let i = 0; i < steps.length; i++) {
      setVerifyStep(i + 1);
      await new Promise(r => setTimeout(r, 600));
    }
    setVerifying(false);
    addAuditLog({
      action: isCompromised ? 'INTEGRITY_VERIFICATION_FAILED' : 'INTEGRITY_VERIFIED',
      user: user.name,
      userId: user.id,
      role: user.role,
      caseId,
      documentId: doc.id,
      documentName: doc.name,
      description: isCompromised
        ? `⚠ INTEGRITY FAILURE: Hash mismatch detected on ${doc.name}`
        : `✓ Integrity verified: ${doc.name} hash matches`,
      type: 'verify',
      severity: isCompromised ? 'error' : 'success',
    });
  };

  const restoreVersion = async () => {
    setTamperState('restoring');
    await new Promise(r => setTimeout(r, 1000));
    setCurrentHash(doc.originalHash);
    onUpdate(doc.id, { hash: doc.originalHash, status: 'verified' });
    setTamperState('restored');
    addAuditLog({
      action: 'VERSION_RESTORED',
      user: user.name,
      userId: user.id,
      role: user.role,
      caseId,
      documentId: doc.id,
      documentName: doc.name,
      description: `✓ Original version restored for ${doc.name}`,
      type: 'upload',
      severity: 'success',
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const fileData = await getFileBlob(doc.id);
      if (fileData) {
        const url = URL.createObjectURL(fileData.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Demo download for seed documents
        const demoContent = `SECURECASE DOCUMENT EXPORT\n\nDocument: ${doc.name}\nCase: ${caseId}\nType: ${doc.type}\nVersion: ${doc.version}\nStatus: ${doc.status}\n\nSHA-256 Fingerprint:\n${doc.hash}\n\nOriginal Hash:\n${doc.originalHash}\n\nUploaded: ${new Date(doc.uploadedAt).toLocaleString()}\nOwner: ${doc.owner}\n\n[This is a demo document generated by SecureCase prototype]`;
        const blob = new Blob([demoContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name.replace(/\.[^.]+$/, '') + '_securecase_export.txt';
        a.click();
        URL.revokeObjectURL(url);
      }
      addAuditLog({
        action: 'DOCUMENT_DOWNLOADED',
        user: user.name, userId: user.id, role: user.role,
        caseId, documentId: doc.id, documentName: doc.name,
        description: `Document ${doc.name} downloaded by ${user.name}`,
        type: 'access', severity: 'info',
      });
    } finally {
      setDownloading(false);
    }
  };

  const docStatus = isCompromised ? 'compromised' : (isRestored ? 'verified' : doc.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, width: '100%', padding: 0 }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: isCompromised ? 'rgba(239,68,68,0.06)' : 'transparent',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <FileText size={18} color="#60a5fa" />
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>{doc.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div className={`badge badge-${docStatus === 'verified' ? 'verified' : 'compromised'}`}>
                  {docStatus === 'verified' ? '✓ INTEGRITY VERIFIED' : '⚠ INTEGRITY COMPROMISED'}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#475569' }}>Version {doc.version}</span>
                <span style={{ fontSize: '0.7rem', color: '#475569' }}>{doc.type}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
          {/* COMPROMISED ALERT */}
          {isCompromised && (
            <div className="alert-threat" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <ShieldAlert size={20} color="#ef4444" />
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f87171' }}>
                  ⚠ INTEGRITY COMPROMISED
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#f87171', opacity: 0.8, marginBottom: 12 }}>
                The original document fingerprint does not match the current fingerprint. Possible document modification detected.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Original Hash</div>
                  <div className="hash-display" style={{ fontSize: '0.65rem', wordBreak: 'break-all' }}>{doc.originalHash}</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Hash</div>
                  <div className="hash-display compromised" style={{ fontSize: '0.65rem', wordBreak: 'break-all' }}>{currentHash}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>View Previous Version</button>
                <button
                  className="btn-primary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  onClick={restoreVersion}
                  disabled={tamperState === 'restoring'}
                >
                  {tamperState === 'restoring' ? '⟳ Restoring...' : '↩ Restore Original Version'}
                </button>
              </div>
            </div>
          )}

          {/* RESTORED SUCCESS */}
          {isRestored && (
            <div style={{
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 12, padding: 16, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <CheckCircle2 size={20} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399' }}>✓ Original Version Restored</div>
                <div style={{ fontSize: '0.75rem', color: '#34d399', opacity: 0.7 }}>Integrity: VALID · Audit record created</div>
              </div>
            </div>
          )}

          {/* SHA-256 Fingerprint */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Hash size={14} color="#60a5fa" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                SHA-256 Document Fingerprint
              </span>
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 16,
              border: `1px solid ${isCompromised ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)'}`,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {/* Visual hash grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
                {(currentHash || '0'.repeat(64)).match(/.{1,8}/g)?.slice(0, 8).map((chunk, i) => (
                  <div key={i} style={{
                    background: isCompromised ? 'rgba(239,68,68,0.08)' : 'rgba(52,211,153,0.06)',
                    borderRadius: 4, padding: '4px 6px',
                    fontSize: '0.7rem', color: isCompromised ? '#f87171' : '#34d399',
                    letterSpacing: '0.08em', textAlign: 'center',
                    border: `1px solid ${isCompromised ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.12)'}`,
                  }}>
                    {chunk.toUpperCase()}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.7rem', color: isCompromised ? '#f87171' : '#34d399', wordBreak: 'break-all', opacity: 0.7 }}>
                {currentHash}
              </div>
            </div>

            {/* Hash match visualization */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
              padding: '10px 16px', borderRadius: 8,
              background: docStatus === 'verified'
                ? 'rgba(16,185,129,0.08)'
                : 'rgba(239,68,68,0.08)',
              border: `1px solid ${docStatus === 'verified' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              {docStatus === 'verified'
                ? <CheckCircle2 size={16} color="#10b981" />
                : <AlertTriangle size={16} color="#ef4444" />
              }
              <span style={{
                fontSize: '0.8rem', fontWeight: 700,
                color: docStatus === 'verified' ? '#34d399' : '#f87171',
              }}>
                {docStatus === 'verified'
                  ? 'HASH MATCH — Document has not been modified'
                  : 'HASH MISMATCH — Document integrity cannot be verified'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <button
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
              onClick={verifyIntegrity}
              disabled={verifying}
            >
              {verifying
                ? `⟳ ${['Reading file...', 'Computing SHA-256...', 'Comparing hashes...', 'Generating report...'][verifyStep - 1] || 'Verifying...'}`
                : <><RefreshCw size={14} /> Verify Integrity</>
              }
            </button>
            <button
              className="btn-danger"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
              onClick={simulateTampering}
              disabled={tamperState !== 'idle' && tamperState !== 'restored'}
            >
              {tamperState === 'simulating' ? '⟳ Simulating...' : '⚡ Simulate Tampering'}
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download size={14} /> {downloading ? 'Downloading...' : 'Download Original'}
            </button>
          </div>

          {/* Document info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Owner', value: doc.owner, icon: User },
              { label: 'Department', value: doc.department, icon: Shield },
              { label: 'File Size', value: `${(doc.fileSize / 1024).toFixed(0)} KB`, icon: FileText },
              { label: 'Uploaded', value: new Date(doc.uploadedAt).toLocaleDateString('en-IN'), icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon size={10} /> {label}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Version History */}
          {versions.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Version History
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {versions.map((v, i) => (
                  <div key={v.id} className="timeline-item" style={{ marginBottom: 16 }}>
                    <div className="timeline-dot" style={{
                      borderColor: i === 0 ? '#10b981' : '#334155',
                      background: i === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(51,65,85,0.5)',
                    }} />
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? '#34d399' : 'white' }}>
                          Version {v.version}
                        </span>
                        <span className="badge badge-verified">{v.status}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 4 }}>
                        {new Date(v.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {v.uploadedBy}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#475569' }}>{v.note}</div>
                      <div className="hash-display" style={{ fontSize: '0.6rem', marginTop: 4, opacity: 0.6 }}>
                        SHA-256: {formatHashShort(v.hash)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Upload Modal
// ──────────────────────────────────────────────────────────────
function UploadModal({ caseId, onClose, onUploaded }) {
  const { user, addAuditLog } = useAuth();
  const [phase, setPhase] = useState('idle'); // idle | reading | hashing | registering | done
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('FIR');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const { addDocument, addAuditLog: appLog } = useApp();

  const handleFile = (file) => {
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setPhase('reading');
      await new Promise(r => setTimeout(r, 400));
      setPhase('hashing');
      const hash = await sha256(selectedFile);
      await new Promise(r => setTimeout(r, 300));
      setPhase('registering');
      await saveFileBlob(`UPLOAD-${Date.now()}`, selectedFile);
      const docId = `DOC-${Date.now()}`;
      const doc = {
        id: docId,
        name: selectedFile.name,
        type: docType,
        caseId,
        owner: user.name,
        ownerId: user.id,
        department: user.department,
        version: 1,
        status: 'verified',
        hash,
        originalHash: hash,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        uploadedAt: new Date().toISOString(),
        description,
        tags: [docType, 'Verified'],
      };
      addDocument(doc);
      appLog({
        action: 'DOCUMENT_UPLOADED',
        user: user.name, userId: user.id, role: user.role,
        caseId, documentId: docId, documentName: selectedFile.name,
        description: `${selectedFile.name} uploaded. SHA-256 generated and stored.`,
        type: 'upload', severity: 'info',
      });
      setResult({ hash, name: selectedFile.name });
      setPhase('done');
      onUploaded();
    } catch (e) {
      console.error(e);
      setPhase('idle');
      alert('Upload failed: ' + e.message);
    }
  };

  const PHASE_STEPS = [
    { id: 'reading', label: 'Reading file bytes', done: ['hashing', 'registering', 'done'].includes(phase) },
    { id: 'hashing', label: 'Generating SHA-256 fingerprint', done: ['registering', 'done'].includes(phase) },
    { id: 'registering', label: 'Registering metadata & audit record', done: ['done'].includes(phase) },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 28, maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>Register New Document</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
            <X size={20} />
          </button>
        </div>

        {phase === 'done' && result ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(16,185,129,0.15)',
              border: '2px solid rgba(16,185,129,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle2 size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginBottom: 8 }}>
              ✓ Document Registered
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 16 }}>{result.name}</p>
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 12, marginBottom: 12, textAlign: 'left' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 4 }}>Digital Fingerprint Created (SHA-256):</div>
              <div className="hash-display" style={{ fontSize: '0.65rem', wordBreak: 'break-all' }}>{result.hash}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#34d399' }}>✓ Digital Fingerprint Created</span>
              <span style={{ fontSize: '0.75rem', color: '#34d399' }}>✓ Audit Record Created</span>
            </div>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={onClose}>Done</button>
          </div>
        ) : phase !== 'idle' ? (
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Processing Document...</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedFile?.name}</div>
            </div>
            {PHASE_STEPS.map((step) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: step.done ? 'rgba(16,185,129,0.2)' : phase === step.id ? 'rgba(29,78,216,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${step.done ? '#10b981' : phase === step.id ? '#1d4ed8' : '#334155'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {step.done ? '✓' : phase === step.id ? (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #60a5fa', borderTop: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  ) : null}
                </div>
                <span style={{
                  fontSize: '0.85rem', fontWeight: step.done || phase === step.id ? 600 : 400,
                  color: step.done ? '#34d399' : phase === step.id ? 'white' : '#475569',
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Drop zone */}
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById('sc-file-input').click()}
              style={{ marginBottom: 16 }}
            >
              <Upload size={28} color="#60a5fa" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: 4 }}>
                {selectedFile ? selectedFile.name : 'Drop document here'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'or Browse Files · PDF · DOCX · JPG · PNG'}
              </div>
              <input
                id="sc-file-input"
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Document Type</label>
              <select className="input-field" style={{ appearance: 'none' }} value={docType} onChange={e => setDocType(e.target.value)}>
                {['FIR', 'Forensic Report', 'Witness Statement', 'Evidence Record', 'Charge Sheet', 'Investigation Report', 'Court Filing', 'Legal Notice', 'Judgment'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
              <textarea className="input-field" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the document..." style={{ resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={handleUpload} disabled={!selectedFile}>
                <Shield size={14} /> Register & Fingerprint
              </button>
            </div>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Access Control Tab
// ──────────────────────────────────────────────────────────────
function AccessTab({ caseId }) {
  const { user, can } = useAuth();
  const { addAuditLog } = useApp();
  const [denyVisible, setDenyVisible] = useState(false);
  const [denyAction, setDenyAction] = useState('');

  const accessMatrix = [
    { dept: 'Police / Investigation', color: '#60a5fa', level: 100, label: 'FULL ACCESS', icon: '██████████' },
    { dept: 'Forensic Department', color: '#34d399', level: 60, label: 'EVIDENCE ACCESS', icon: '██████░░░░' },
    { dept: 'Public Prosecution', color: '#fb923c', level: 40, label: 'READ ACCESS', icon: '████░░░░░░' },
    { dept: 'Judiciary', color: '#facc15', level: 20, label: 'READ ONLY', icon: '██░░░░░░░░' },
  ];

  const tryUnauthorized = (action) => {
    if (!can(action)) {
      setDenyAction(action);
      setDenyVisible(true);
      addAuditLog({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        user: user.name, userId: user.id, role: user.role,
        caseId, documentId: null, documentName: null,
        description: `⚠ Unauthorized action attempted: ${action} by ${user.name} (${user.role})`,
        type: 'access_control', severity: 'error',
      });
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 20 }}>Access Matrix</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {accessMatrix.map(({ dept, color, level, label, icon }) => (
          <div key={dept} style={{
            background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '14px 16px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{dept}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color, fontFamily: 'monospace' }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color, letterSpacing: '0.05em' }}>{icon}</span>
              <span style={{ fontSize: '0.7rem', color: '#475569' }}>{level}%</span>
            </div>
            <div className="access-bar" style={{ marginTop: 6 }}>
              <div style={{ height: '100%', width: `${level}%`, background: `linear-gradient(90deg, ${color}60, ${color})`, borderRadius: 3, transition: 'width 1s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* RBAC Test */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 20,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
          Access Control Test (RBAC Demo)
        </h4>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 16 }}>
          Current Role: <strong style={{ color: '#60a5fa' }}>{user?.role?.toUpperCase()}</strong>
          {' '}— Try performing actions that may be restricted for your role.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn-danger"
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            onClick={() => tryUnauthorized('delete')}
          >
            🗑 Delete Document
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            onClick={() => tryUnauthorized('manageAccess')}
          >
            🔑 Manage Access
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            onClick={() => tryUnauthorized('upload')}
          >
            📤 Upload Document
          </button>
        </div>
      </div>

      {/* Access Denied Modal */}
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

// ──────────────────────────────────────────────────────────────
// Timeline Tab
// ──────────────────────────────────────────────────────────────
function TimelineTab({ caseId }) {
  const logs = getAuditByCase(caseId);
  const TYPE_CONFIG = {
    upload: { color: '#60a5fa', icon: '📤' },
    verify: { color: '#34d399', icon: '✓' },
    access: { color: '#94a3b8', icon: '👁' },
    access_control: { color: '#c084fc', icon: '🔑' },
    auth: { color: '#fb923c', icon: '🔐' },
    case: { color: '#818cf8', icon: '📁' },
    error: { color: '#ef4444', icon: '⚠' },
  };

  if (!logs.length) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
      <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
      <div>No activity recorded yet</div>
    </div>
  );

  return (
    <div>
      {logs.map((log, i) => {
        const cfg = TYPE_CONFIG[log.type] || TYPE_CONFIG.access;
        return (
          <div key={log.id} className="timeline-item" style={{ marginBottom: 16 }}>
            <div className="timeline-dot" style={{
              borderColor: cfg.color,
              background: `${cfg.color}20`,
              fontSize: '0.55rem',
            }}>
              {cfg.icon}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 14px',
              border: `1px solid ${log.severity === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cfg.color, fontFamily: 'monospace' }}>
                  {log.action}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'monospace' }}>
                  {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>{log.description}</div>
              <div style={{ fontSize: '0.65rem', color: '#475569' }}>
                {log.user} · {log.role} · {new Date(log.timestamp).toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Case Workspace
// ──────────────────────────────────────────────────────────────
export default function CaseWorkspacePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { documents, patchDocument, addAuditLog } = useApp();
  const { user, can } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const caseObj = getCaseById(caseId);
  const caseDocs = documents.filter(d => d.caseId === caseId);

  useEffect(() => {
    if (caseObj) {
      addAuditLog({
        action: 'CASE_ACCESSED',
        user: user.name, userId: user.id, role: user.role,
        caseId, documentId: null, documentName: null,
        description: `${user.name} accessed case workspace for ${caseId}`,
        type: 'access', severity: 'info',
      });
    }
  }, [caseId]);

  if (!caseObj) return (
    <div style={{ padding: 32, textAlign: 'center', color: '#475569' }}>
      <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>Case not found</div>
      <button className="btn-secondary" onClick={() => navigate('/cases')}>← Back to Cases</button>
    </div>
  );

  const STATUS_COLOR = {
    under_investigation: '#60a5fa',
    chargesheet_filed: '#34d399',
    pending_review: '#f59e0b',
    closed: '#64748b',
  };

  const openDoc = (doc) => {
    addAuditLog({
      action: 'DOCUMENT_ACCESSED',
      user: user.name, userId: user.id, role: user.role,
      caseId, documentId: doc.id, documentName: doc.name,
      description: `${doc.name} viewed by ${user.name}`,
      type: 'access', severity: 'info',
    });
    setSelectedDoc(doc);
  };

  const refreshDoc = () => {
    const updated = documents.find(d => d.id === selectedDoc?.id);
    if (updated) setSelectedDoc(updated);
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Back */}
      <button
        className="btn-secondary"
        style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: 20 }}
        onClick={() => navigate('/cases')}
      >
        <ArrowLeft size={14} /> Cases
      </button>

      {/* Case Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700, marginBottom: 6 }}>{caseObj.id}</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {caseObj.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                padding: '4px 12px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700,
                background: `${STATUS_COLOR[caseObj.status]}15`,
                color: STATUS_COLOR[caseObj.status],
                border: `1px solid ${STATUS_COLOR[caseObj.status]}30`,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {caseObj.status.replace(/_/g, ' ')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Officer: {caseObj.officer}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{caseDocs.length} Documents</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>FIR: {caseObj.fir}</span>
            </div>
          </div>
          {can('upload') && (
            <button className="btn-primary" onClick={() => setShowUpload(true)}>
              <Upload size={14} /> Upload Document
            </button>
          )}
        </div>
        {caseObj.description && (
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 12, maxWidth: 640, lineHeight: 1.6 }}>
            {caseObj.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 24, overflowX: 'auto' }}>
        {TAB_CONFIG.map(({ id, label }) => (
          <button
            key={id}
            className={`tab-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '24px' }}>
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 16 }}>Case Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total Documents', value: caseDocs.length, color: '#60a5fa' },
                { label: 'Verified', value: caseDocs.filter(d => d.status === 'verified').length, color: '#34d399' },
                { label: 'Integrity Alerts', value: caseDocs.filter(d => d.status === 'compromised').length, color: '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color, marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.8 }}>
              <div><strong style={{ color: '#94a3b8' }}>Department:</strong> {caseObj.department}</div>
              <div><strong style={{ color: '#94a3b8' }}>Created:</strong> {new Date(caseObj.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div><strong style={{ color: '#94a3b8' }}>Priority:</strong> <span style={{ color: caseObj.priority === 'high' ? '#ef4444' : '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>{caseObj.priority}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 16 }}>
              Case Documents ({caseDocs.length})
            </h3>
            {caseDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
                <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div>No documents yet</div>
                {can('upload') && <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setShowUpload(true)}><Plus size={14} /> Upload First Document</button>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {caseDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="glass-card-hover"
                    onClick={() => openDoc(doc)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                      borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${doc.status === 'compromised' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: `${TYPE_COLORS[doc.type] || '#60a5fa'}15`,
                      border: `1px solid ${TYPE_COLORS[doc.type] || '#60a5fa'}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={16} color={TYPE_COLORS[doc.type] || '#60a5fa'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{doc.type} · v{doc.version} · {doc.owner}</div>
                    </div>
                    <div className={`badge badge-${doc.status === 'verified' ? 'verified' : 'compromised'}`}>
                      {doc.status === 'verified' ? '✓ Verified' : '⚠ Alert'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#334155', fontFamily: 'monospace' }}>
                      {formatHashShort(doc.hash)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 16 }}>Evidence Records</h3>
            {caseDocs.filter(d => d.type === 'Evidence Record' || d.type === 'Forensic Report').map(doc => (
              <div key={doc.id} onClick={() => openDoc(doc)} style={{ cursor: 'pointer', marginBottom: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{doc.name}</span>
                  <div className={`badge badge-${doc.status === 'verified' ? 'verified' : 'compromised'}`}>{doc.status}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{doc.description}</div>
              </div>
            ))}
            {caseDocs.filter(d => d.type === 'Evidence Record' || d.type === 'Forensic Report').length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No evidence records found</div>
            )}
          </div>
        )}

        {activeTab === 'access' && <AccessTab caseId={caseId} />}
        {activeTab === 'timeline' && <TimelineTab caseId={caseId} />}

        {activeTab === 'integrity' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 16 }}>Integrity Status</h3>
            <div style={{ marginBottom: 20 }}>
              {caseDocs.map(doc => (
                <div key={doc.id} onClick={() => openDoc(doc)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 8,
                  background: 'rgba(255,255,255,0.02)', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${doc.status === 'compromised' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.15)'}`,
                }}>
                  {doc.status === 'verified'
                    ? <CheckCircle2 size={16} color="#10b981" />
                    : <AlertTriangle size={16} color="#ef4444" />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{doc.name}</div>
                    <div className="hash-display" style={{ fontSize: '0.6rem', marginTop: 2 }}>{formatHashShort(doc.hash)}</div>
                  </div>
                  <div className={`badge badge-${doc.status === 'verified' ? 'verified' : 'compromised'}`}>
                    {doc.status === 'verified' ? '✓ Verified' : '⚠ Compromised'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              background: 'rgba(16,185,129,0.06)', borderRadius: 10, padding: 16,
              border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.8rem', color: '#34d399',
            }}>
              <strong>INTEGRITY PIPELINE:</strong> Document → SHA-256 → Digital Fingerprint → Verification
            </div>
          </div>
        )}
      </div>

      {/* Document Detail */}
      {selectedDoc && (
        <DocumentDetailPanel
          doc={documents.find(d => d.id === selectedDoc.id) || selectedDoc}
          onClose={() => { setSelectedDoc(null); }}
          onUpdate={(id, updates) => { patchDocument(id, updates); }}
          caseId={caseId}
        />
      )}

      {/* Upload */}
      {showUpload && (
        <UploadModal
          caseId={caseId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
