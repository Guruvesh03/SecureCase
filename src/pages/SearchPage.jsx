import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Search, FileText, FolderOpen, Filter } from 'lucide-react';
import { formatHashShort } from '../crypto/hash.js';

export default function SearchPage() {
  const { documents, cases } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all | case | document
  const [statusFilter, setStatusFilter] = useState('all');

  const results = query.trim().length < 1 ? [] : (() => {
    const q = query.toLowerCase();
    const caseResults = cases
      .filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.fir?.toLowerCase().includes(q) ||
        c.officer?.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q)
      )
      .map(c => ({ ...c, _resultType: 'case' }));

    const docResults = documents
      .filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.owner.toLowerCase().includes(q) ||
        d.caseId.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      )
      .map(d => ({ ...d, _resultType: 'document' }));

    const combined = [...caseResults, ...docResults];
    return combined.filter(r => {
      if (typeFilter !== 'all' && r._resultType !== typeFilter) return false;
      if (statusFilter !== 'all') {
        if (r._resultType === 'document' && r.status !== statusFilter) return false;
        if (r._resultType === 'case' && r.integrity !== statusFilter && statusFilter !== 'under_investigation') return false;
      }
      return true;
    });
  })();

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
          Global Search
        </h1>
        <p style={{ color: '#475569', fontSize: '0.875rem', marginTop: 4 }}>
          Search across all cases, documents, evidence, and officers
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={20} color="#475569" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          className="input-field"
          style={{ paddingLeft: 48, fontSize: '1rem', height: 52, borderRadius: 12 }}
          placeholder="Search cases, FIRs, documents, evidence, officers..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {[
          { value: 'all', label: 'All Results' },
          { value: 'case', label: 'Cases Only' },
          { value: 'document', label: 'Documents Only' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
              background: typeFilter === value ? 'rgba(29,78,216,0.3)' : 'rgba(255,255,255,0.04)',
              color: typeFilter === value ? '#93c5fd' : '#64748b',
              border: `1px solid ${typeFilter === value ? 'rgba(29,78,216,0.4)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {query.trim().length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#334155' }}>
          <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <div style={{ fontSize: '1rem', color: '#475569', marginBottom: 8 }}>Start typing to search</div>
          <div style={{ fontSize: '0.8rem', color: '#334155' }}>
            Search by: Case ID · FIR Number · Document Name · Officer · Document Type · Department
          </div>
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#334155' }}>
          <Search size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <div style={{ fontSize: '1rem', color: '#475569', marginBottom: 4 }}>No results found</div>
          <div style={{ fontSize: '0.8rem' }}>Try a different search term</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 12 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((r) => (
              r._resultType === 'case' ? (
                <div
                  key={r.id}
                  className="glass-card-hover"
                  onClick={() => navigate(`/cases/${r.id}`)}
                  style={{
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(96,165,250,0.15)',
                    display: 'flex', gap: 14, alignItems: 'center',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FolderOpen size={16} color="#60a5fa" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700 }}>{r.id}</span>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(96,165,250,0.1)', color: '#60a5fa', padding: '1px 6px', borderRadius: 3 }}>CASE</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{r.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{r.officer} · {r.fir}</div>
                  </div>
                  <div className={`badge badge-${r.integrity === 'verified' ? 'verified' : 'compromised'}`}>
                    {r.integrity === 'verified' ? '✓ Verified' : '⚠ Alert'}
                  </div>
                </div>
              ) : (
                <div
                  key={r.id}
                  className="glass-card-hover"
                  onClick={() => navigate(`/cases/${r.caseId}`)}
                  style={{
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', gap: 14, alignItems: 'center',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={16} color="#818cf8" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(129,140,248,0.1)', color: '#818cf8', padding: '1px 6px', borderRadius: 3 }}>DOC</span>
                      <span style={{ fontSize: '0.65rem', color: '#475569' }}>{r.type}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{r.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {r.caseId} · v{r.version} · {r.owner} · SHA: <span className="hash-display" style={{ fontSize: '0.65rem' }}>{formatHashShort(r.hash)}</span>
                    </div>
                  </div>
                  <div className={`badge badge-${r.status === 'verified' ? 'verified' : 'compromised'}`}>
                    {r.status === 'verified' ? '✓ Verified' : '⚠ Alert'}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
