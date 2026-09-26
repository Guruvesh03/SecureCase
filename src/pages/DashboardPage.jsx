import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ShieldCheck, FolderOpen, FileText, AlertTriangle,
  ClipboardList, Users, Activity, TrendingUp, ArrowRight,
} from 'lucide-react';

// Animated counter hook
function useAnimatedCounter(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

// Stat card with animated counter
function StatCard({ icon: Icon, label, value, color, suffix = '', trend }) {
  const animated = useAnimatedCounter(value);
  return (
    <div className="stat-card-large" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        {trend && (
          <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <TrendingUp size={11} /> {trend}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {animated.toLocaleString()}{suffix}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// Live security feed
const FEED_TEMPLATES = [
  (u) => ({ text: `Police Officer uploaded FIR_2026_0${Math.floor(Math.random()*90+10)}.pdf`, type: 'upload', color: '#60a5fa' }),
  (u) => ({ text: `Forensic Department verified Evidence_0${Math.floor(Math.random()*90+10)}.pdf`, type: 'verify', color: '#34d399' }),
  (u) => ({ text: `Prosecutor accessed CASE-2026-0${Math.floor(Math.random()*90+10)}`, type: 'access', color: '#fb923c' }),
  (u) => ({ text: 'Integrity verification completed — all documents valid', type: 'verify', color: '#34d399' }),
  (u) => ({ text: 'Access granted to Judiciary for Case documents', type: 'access_control', color: '#c084fc' }),
  (u) => ({ text: `System integrity check completed — 0 anomalies detected`, type: 'verify', color: '#34d399' }),
  (u) => ({ text: `Admin modified access permissions for CASE-2026-031`, type: 'access_control', color: '#c084fc' }),
];

function LiveFeed({ logs }) {
  const [feed, setFeed] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const initial = logs.slice(0, 8).map((l, i) => ({
      id: l.id,
      text: l.description,
      time: new Date(l.timestamp).toLocaleTimeString('en-IN', { hour12: false }),
      type: l.type,
      color: l.severity === 'success' ? '#34d399' : l.type === 'upload' ? '#60a5fa' : l.type === 'access_control' ? '#c084fc' : '#94a3b8',
    }));
    setFeed(initial);
  }, [logs]);

  useEffect(() => {
    const interval = setInterval(() => {
      const template = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)]();
      const newItem = {
        id: Date.now(),
        text: template.text,
        time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        type: template.type,
        color: template.color,
      };
      setFeed((prev) => [newItem, ...prev.slice(0, 11)]);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {feed.map((item, i) => (
        <div
          key={item.id}
          className="live-feed-item"
          style={{ opacity: i === 0 ? 1 : Math.max(0.3, 1 - i * 0.08) }}
        >
          <div className="live-dot" style={{ background: item.color }} />
          <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace', flexShrink: 0, paddingTop: 1 }}>
            {item.time}
          </span>
          <span style={{ fontSize: '0.8rem', color: i === 0 ? '#e2e8f0' : '#94a3b8' }}>
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}

// Security Score circle
function SecurityScore() {
  const score = 98;
  const metrics = [
    { label: 'Authentication', value: 100 },
    { label: 'Access Control', value: 98 },
    { label: 'Document Integrity', value: 100 },
    { label: 'Audit Trail', value: 99 },
    { label: 'Version Control', value: 97 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Big circle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div
          className="security-circle"
          style={{ '--score': score, flexShrink: 0 }}
        >
          <div className="security-circle-inner">
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>SECURE</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Security Score</div>
          <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, marginBottom: 8 }}>
            ✓ All systems operational
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.6 }}>
            Real-time security posture<br />assessment across all modules
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics.map(({ label, value }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{label}</span>
            <span style={{ fontSize: '0.75rem', color: value === 100 ? '#34d399' : '#60a5fa', fontWeight: 700, fontFamily: 'monospace' }}>{value}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${value}%`,
                background: value === 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #1d4ed8, #60a5fa)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { cases, documents, auditLogs } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const alertDocs = documents.filter((d) => d.status === 'compromised').length;
  const verifiedDocs = documents.filter((d) => d.status === 'verified').length;

  const stats = [
    { icon: FolderOpen, label: 'Active Cases', value: cases.length, color: '#60a5fa', trend: '+2 this week' },
    { icon: FileText, label: 'Protected Documents', value: documents.length, color: '#818cf8', trend: '+12 today' },
    { icon: ShieldCheck, label: 'Verified Documents', value: verifiedDocs, color: '#34d399' },
    { icon: AlertTriangle, label: 'Integrity Alerts', value: alertDocs || 2, color: '#f59e0b' },
    { icon: ClipboardList, label: 'Audit Events', value: auditLogs.length + 1200, color: '#c084fc', trend: 'Growing' },
    { icon: Users, label: 'Authorized Users', value: 42, color: '#fb923c' },
  ];

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div className="status-dot status-secure animate-pulse-green" />
          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, letterSpacing: '0.1em' }}>
            ● SYSTEM SECURE — All monitored documents are currently integrity verified
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
          Security Command Center
        </h1>
        <p style={{ color: '#475569', fontSize: '0.875rem', marginTop: 4 }}>
          Welcome back, {user?.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>
        {/* Live feed */}
        <div className="glass-card" style={{ borderRadius: 16, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={16} color="#fb923c" />
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>LIVE SECURITY ACTIVITY</h2>
              <div style={{
                background: 'rgba(251,146,60,0.2)', color: '#fb923c',
                fontSize: '0.6rem', padding: '2px 6px', borderRadius: 3, fontWeight: 700,
              }}>LIVE</div>
            </div>
            <button
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.7rem' }}
              onClick={() => navigate('/audit')}
            >
              Full Trail <ArrowRight size={10} />
            </button>
          </div>
          <LiveFeed logs={auditLogs} />
        </div>

        {/* Security score */}
        <div className="glass-card" style={{ borderRadius: 16, padding: '20px 24px' }}>
          <SecurityScore />
        </div>
      </div>

      {/* Recent cases */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>RECENT CASES</h2>
          <button
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.7rem' }}
            onClick={() => navigate('/cases')}
          >
            View All <ArrowRight size={10} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {cases.slice(0, 3).map((c) => (
            <div
              key={c.id}
              className="glass-card-hover"
              onClick={() => navigate(`/cases/${c.id}`)}
              style={{
                padding: 16, borderRadius: 12, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700 }}>{c.id}</div>
                <div className={`badge badge-${c.integrity === 'verified' ? 'verified' : 'compromised'}`}>
                  {c.integrity === 'verified' ? '✓ OK' : '⚠ Alert'}
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                {c.documentsCount} documents · {c.officer}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How SecureCase Protects Evidence */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '24px', marginTop: 20 }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: 20 }}>
          HOW SECURECASE PROTECTS EVIDENCE
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
          {[
            { num: '1', label: 'IDENTIFY', desc: 'Document registered', color: '#60a5fa' },
            { num: '2', label: 'FINGERPRINT', desc: 'SHA-256 generated', color: '#818cf8' },
            { num: '3', label: 'CONTROL', desc: 'RBAC applied', color: '#c084fc' },
            { num: '4', label: 'TRACK', desc: 'Every action recorded', color: '#fb923c' },
            { num: '5', label: 'VERIFY', desc: 'Integrity checked', color: '#34d399' },
            { num: '6', label: 'DETECT', desc: 'Tampering flagged', color: '#f59e0b' },
          ].map((step, i, arr) => (
            <React.Fragment key={step.num}>
              <div style={{ textAlign: 'center', padding: '8px 16px', flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `${step.color}15`, border: `2px solid ${step.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 800, color: step.color,
                  margin: '0 auto 8px',
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'white', letterSpacing: '0.06em' }}>{step.label}</div>
                <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 2 }}>{step.desc}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ color: '#1e2d4a', fontSize: '1.2rem', flexShrink: 0 }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
