import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import avodhaLogo from '../assets/avodha-logo.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (success) navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      {/* Animated background blobs */}
      <div className="bg-mesh" />

      {/* Extra decorative orbs */}
      <div style={{
        position: 'fixed', top: '10%', right: '5%',
        width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(118,75,162,0.25) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '5%', left: '8%',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="theme-toggle"
        style={{ position: 'fixed', top: 20, right: 20 }}
        title={isDark ? 'Switch to Light' : 'Switch to Dark'}
      >
        <span className={`theme-toggle-thumb ${isDark ? 'dark-mode' : ''}`}>
          {isDark ? '🌙' : '☀️'}
        </span>
      </button>

      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: 900,
        minHeight: 560,
        borderRadius: 28,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-default)',
      }}>

        {/* ── Left panel — branding ─────────────────────────── */}
        <div style={{
          display: 'none',
          width: '45%',
          background: 'var(--gradient-hero)',
          padding: '48px 40px',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }} className="login-left-panel">
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 260, height: 260, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
          }} />
          <div style={{
            position: 'absolute', bottom: -40, left: -40,
            width: 200, height: 200, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
          }} />
          <div style={{
            position: 'absolute', top: '40%', left: '20%',
            width: 120, height: 120, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
          }} />

          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40,
            }}>
              {/* Avodha logo badge */}
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 6,
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                flexShrink: 0,
              }}>
                <img
                  src={avodhaLogo}
                  alt="Avodha"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', display: 'block', lineHeight: 1.1 }}>
                  MCQ Bunker
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                  Avodha Education for a Job
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 16px', lineHeight: 1.2 }}>
              Master Every<br />Subject with Ease
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
              Take chapter-wise MCQ assessments, track your scores, and sharpen your knowledge — all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['📚 Chapter-wise Exams', '📊 Performance Analytics', '🏆 Score Tracking'].map(f => (
              <div key={f} style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel — form ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            flex: 1,
            background: 'var(--bg-surface)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            padding: 'clamp(32px, 6%, 56px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Mobile logo */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 32,
          }} className="login-mobile-logo">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4,
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              flexShrink: 0,
            }}>
              <img
                src={avodhaLogo}
                alt="Avodha"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>MCQ Bunker</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--brand-400)', fontWeight: 500 }}>Avodha Student Portal</span>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 1.9rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 8px',
              letterSpacing: '-0.03em',
            }}>
              Welcome back 👋
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              Sign in to continue to your student portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div>
              <label style={{
                display: 'block', marginBottom: 8,
                fontSize: '0.82rem', fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.02em',
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', marginBottom: 8,
                fontSize: '0.82rem', fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.02em',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 4,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember / forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" id="remember-me" style={{ accentColor: 'var(--brand-500)' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Remember me</span>
              </label>
              <span style={{ fontSize: '0.82rem', color: 'var(--brand-500)', fontWeight: 600, textDecoration: 'none' }}>
                Contact admin for login credentials
              </span>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              whileHover={{ scale: 1.018 }}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: 4, padding: '13px 20px', fontSize: '0.9rem' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={17} />
                </>
              )}
            </motion.button>
          </form>

          {/* Team credit */}
          <p style={{
            marginTop: 28,
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
            lineHeight: 1.6,
          }}>
            Designed &amp; Developed by{' '}
            <span style={{ color: 'var(--brand-400)', fontWeight: 700 }}>Team AOC Thrissur</span>
          </p>
        </motion.div>
      </div>

      {/* Responsive: show left panel on lg+ */}
      <style>{`
        @media (min-width: 900px) {
          .login-left-panel { display: flex !important; }
          .login-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
