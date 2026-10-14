import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogIn, Quote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="brand-logo" style={{ marginBottom: '3rem' }}>
          <span className="brand-icon"><Sparkles size={20} /></span>
          IntervAI
        </div>
        <h1 className="auth-panel-title">Walk into the room already prepared.</h1>
        <p className="section-subtitle" style={{ fontSize: '1rem', maxWidth: 420 }}>
          Real resume parsing, role-matched roadmaps, and an interviewer that actually pushes back — not another generic quiz app.
        </p>
        <div className="auth-quote">
          <Quote size={18} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
          <p>"The follow-up questions caught exactly the gaps my real interview did a week later."</p>
          <span className="section-subtitle" style={{ fontSize: '0.82rem' }}>— a candidate who got the offer</span>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="glass-card" style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <span className="section-eyebrow">Welcome back</span>
            <h1 style={{ fontSize: '1.6rem' }}>Sign in to continue</h1>
          </div>

          {error && (
            <div className="badge badge-rose" style={{ display: 'block', marginBottom: '1rem', padding: '0.6rem 0.9rem' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input-field" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <input id="password" type="password" required className="input-field" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
              <LogIn size={18} /> {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="section-subtitle" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
