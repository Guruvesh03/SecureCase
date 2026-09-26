import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Eye, EyeOff, Check, Lock, Users, FileCheck, Activity } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Administrator', email: 'admin@securecase.demo', password: 'admin123', role: 'admin', color: '#c084fc', badge: 'ADMIN-001' },
  { label: 'Police Officer', email: 'police@securecase.demo', password: 'police123', role: 'police', color: '#60a5fa', badge: 'CCU-2847' },
  { label: 'Prosecutor', email: 'prosecutor@securecase.demo', password: 'prosecutor123', role: 'prosecutor', color: '#fb923c', badge: 'PP-0391' },
  { label: 'Judiciary', email: 'judge@securecase.demo', password: 'judge123', role: 'judiciary', color: '#facc15', badge: 'DC-0012' },
];

const SECURITY_FEATURES = [
  { icon: Lock, label: 'Identity Verification', desc: 'Multi-factor authentication' },
  { icon: Users, label: 'Role-Based Access', desc: 'Granular permission control' },
  { icon: FileCheck, label: 'Document Integrity', desc: 'SHA-256 fingerprinting' },
  { icon: Activity, label: 'Audit Monitoring', desc: 'Complete activity tracking' },
];

// Background animated nodes
function SecurityCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nodes = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw connections
      nodes.forEach((n, i) => {
        nodes.slice(i + 1).forEach((m) => {
          const d = Math.hypot(n.x - m.x, n.y - m.y);
          if (d < 150) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(29,78,216,${0.12 * (1 - d / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      // Draw nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(96,165,250,0.4)';
        ctx.fill();
        // Update
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activatingDemo, setActivatingDemo] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 800)); // auth simulation delay
    const result = await login(email, password);
    setLoading(false);
    if (result.success) navigate('/');
    else setError('Invalid credentials. Please verify your identity.');
  };

  const handleDemoLogin = async (account) => {
    setActivatingDemo(account.role);
    setEmail(account.email);
    setPassword(account.password);
    await new Promise((r) => setTimeout(r, 600));
    const result = await login(account.email, account.password);
    setActivatingDemo(null);
    if (result.success) navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #030712 0%, #0a0f1e 50%, #030712 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SecurityCanvas />

      {/* Gradient overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 60%, rgba(29,78,216,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 30%, rgba(16,185,129,0.04) 0%, transparent 50%)', pointerEvents: 'none' }} />

      {/* Left Panel — Security Features */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 64px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #1d4ed8, #0f172a)',
            border: '1px solid rgba(96,165,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={24} color="#60a5fa" />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
              SECURE<span style={{ color: '#60a5fa' }}>CASE</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Digital Evidence Platform
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 12 }}>
          Trusted Digital Evidence<br />
          <span style={{ color: '#60a5fa' }}>Management</span>
        </h1>
        <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: 48, maxWidth: 420, lineHeight: 1.7 }}>
          Protecting the integrity of legal evidence with military-grade cryptographic verification and complete audit visibility.
        </p>

        {/* Security Features Panel */}
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: '20px 24px',
          backdropFilter: 'blur(12px)',
          maxWidth: 440,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div className="status-dot status-secure animate-pulse-green" />
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, letterSpacing: '0.1em' }}>
              🔐 SECURE ENVIRONMENT
            </span>
          </div>
          {SECURITY_FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={14} color="#34d399" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: '0.7rem', color: '#475569' }}>{desc}</div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.7rem', color: '#34d399', fontWeight: 700,
              }}>
                <Check size={12} /> Active
              </div>
            </div>
          ))}
        </div>

        {/* Government badge */}
        <div style={{ marginTop: 32, fontSize: '0.7rem', color: '#334155' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>🏛️ Government Grade Security</span>
            <span>🔒 End-to-End Encryption</span>
            <span>📋 Complete Audit Trail</span>
          </div>
          <div style={{ marginTop: 8, color: '#1e2d4a' }}>
            SecureCase Prototype v1.0 · For demonstration purposes only
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        width: 440,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '40px',
        position: 'relative',
        zIndex: 1,
        background: 'rgba(10,15,30,0.7)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>Identity Verification</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Enter your credentials to access the secure platform</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: '0.8rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Email Address
            </label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@securecase.gov"
              required
              autoComplete="username"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.9rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Verifying Identity...
              </>
            ) : (
              <>
                <Lock size={16} />
                Authenticate & Enter
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
          <div style={{ fontSize: '0.7rem', color: '#334155', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
            ⚡ Quick Demo Access
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                onClick={() => handleDemoLogin(account)}
                disabled={activatingDemo !== null}
                style={{
                  padding: '10px 12px',
                  background: activatingDemo === account.role
                    ? `rgba(${account.color === '#60a5fa' ? '96,165,250' : account.color === '#c084fc' ? '192,132,252' : account.color === '#fb923c' ? '251,146,60' : '250,204,21'},0.2)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activatingDemo === account.role ? account.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8,
                  cursor: activatingDemo !== null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  opacity: activatingDemo && activatingDemo !== account.role ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!activatingDemo) e.currentTarget.style.borderColor = account.color;
                }}
                onMouseLeave={(e) => {
                  if (!activatingDemo) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: account.color, marginBottom: 2 }}>
                  {activatingDemo === account.role ? '⟳ Authenticating...' : account.label}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'monospace' }}>
                  {account.badge}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.7rem', color: '#1e2d4a' }}>
          Prototype for demonstration · Not for production use
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
