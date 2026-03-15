import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginDemo, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/msp'); }, [user, navigate]);

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.endsWith('@shellkode.com')) {
      setError('Access restricted to @shellkode.com accounts only');
      return;
    }
    setLoading(true);
    try {
      await loginDemo(email);
      navigate('/msp');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Animated background */}
      <div style={styles.bgGrid} />
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Left panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoMark}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#lg1)"/>
              <path d="M14 24L20 18L26 24L32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 30L20 24L26 30L32 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#3b82f6"/>
                  <stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 style={styles.brandName}>ShellKode</h1>
          <div style={styles.brandTag}>MSP Operations Portal</div>

          <div style={{ marginTop: 60 }}>
            <h2 style={styles.heroTitle}>Manage Your AWS<br />Clients at Scale</h2>
            <p style={styles.heroSub}>Unified platform for security audits, cost optimization, monitoring, patching, and reporting for all your managed AWS accounts.</p>
          </div>

          <div style={styles.featureList}>
            {['Security & Vulnerability Analysis', 'Cost Optimization & Anomaly Detection', 'AWS Compute Optimizer Insights', 'EC2 Patching Lifecycle', 'SSL & Domain Monitoring', 'FreshDesk Ticket Integration'].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <span style={styles.featureDot} />
                <span style={{ color: '#94a3b8', fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={styles.teamBadge}>
            <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: 12 }}>TEAM CRONOS</span>
            <span style={{ color: '#4a5878', fontSize: 12, marginLeft: 8 }}>11 Engineers · 12 Clients</span>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div style={styles.rightPanel}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <h2 style={styles.loginTitle}>Welcome Back</h2>
            <p style={styles.loginSub}>Sign in with your @shellkode.com account</p>
          </div>

          {/* Google OAuth placeholder */}
          <button style={styles.googleBtn} onClick={() => setError('Configure GOOGLE_CLIENT_ID in backend .env to enable Google SSO')}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google Workspace
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or sign in with email</span>
            <span style={styles.dividerLine} />
          </div>

          <form onSubmit={handleDemoLogin} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrap}>
                <svg style={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="yourname@shellkode.com"
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : 'Sign In to MSP Portal'}
            </button>
          </form>

          <div style={styles.domainNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Only @shellkode.com accounts are authorized</span>
          </div>

          <div style={styles.quickAccess}>
            <p style={{ color: '#4a5878', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>Quick Demo Access</p>
            <div style={styles.quickGrid}>
              {['raghul.sasikumar@shellkode.com', 'santhosh.b@shellkode.com', 'surya.krishna@shellkode.com'].map(em => (
                <button key={em} style={styles.quickBtn} onClick={() => { setEmail(em); }}>
                  {em.split('.')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#080c18' },
  bgGrid: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
    backgroundSize: '48px 48px'
  },
  bgGlow1: { position: 'absolute', top: '-200px', left: '-100px', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', zIndex: 0 },
  bgGlow2: { position: 'absolute', bottom: '-200px', right: '-100px', width: 600, height: 600, background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)', zIndex: 0 },
  leftPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', position: 'relative', zIndex: 1, borderRight: '1px solid #1e2d47' },
  leftContent: { maxWidth: 440 },
  logoMark: { marginBottom: 12 },
  brandName: { fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.5px' },
  brandTag: { display: 'inline-block', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, padding: '3px 14px', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', marginTop: 8 },
  heroTitle: { fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 700, color: '#f0f4ff', lineHeight: 1.25, marginBottom: 16, letterSpacing: '-0.5px' },
  heroSub: { color: '#64748b', fontSize: 15, lineHeight: 1.7 },
  featureList: { marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 },
  teamBadge: { marginTop: 40, display: 'inline-flex', alignItems: 'center', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '8px 16px' },
  rightPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 40px', position: 'relative', zIndex: 1 },
  loginCard: { width: '100%', maxWidth: 440, background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(20px)', border: '1px solid #1e2d47', borderRadius: 20, padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' },
  loginHeader: { marginBottom: 28, textAlign: 'center' },
  loginTitle: { fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 700, color: '#f0f4ff', marginBottom: 8 },
  loginSub: { color: '#64748b', fontSize: 14 },
  googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '13px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#e2e8f0', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Space Grotesk', sans-serif" },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' },
  dividerLine: { flex: 1, height: 1, background: '#1e2d47' },
  dividerText: { color: '#4a5878', fontSize: 12, whiteSpace: 'nowrap' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: '#8a9bc5', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5878', pointerEvents: 'none' },
  input: { width: '100%', padding: '12px 14px 12px 42px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", outline: 'none', transition: 'border-color 0.2s' },
  errorBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: 13 },
  submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.2px', transition: 'transform 0.15s, box-shadow 0.15s' },
  domainNote: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, color: '#3b82f6', fontSize: 12 },
  quickAccess: { marginTop: 24, paddingTop: 20, borderTop: '1px solid #1e2d47' },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  quickBtn: { padding: '8px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, color: '#60a5fa', fontSize: 12, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize', fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s' },
};
