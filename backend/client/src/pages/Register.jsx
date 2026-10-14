import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const POINTS = [
  'Resume parsing you review before anything is saved',
  'Role matching scored against real required skills',
  'Mock interviews with adaptive follow-up questions'
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', headline: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
        <h1 className="auth-panel-title">Preparation, not guesswork.</h1>
        <p className="section-subtitle" style={{ fontSize: '1rem', maxWidth: 420, marginBottom: '2rem' }}>
          Everything is built on your actual profile — nothing here is a placeholder or a canned demo.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {POINTS.map(p => (
            <div key={p} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '0.92rem' }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-side">
        <div className="glass-card" style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <span className="section-eyebrow">Get started</span>
            <h1 style={{ fontSize: '1.6rem' }}>Create your account</h1>
          </div>

          {error && (
            <div className="badge badge-rose" style={{ display: 'block', marginBottom: '1rem', padding: '0.6rem 0.9rem' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="name">Full Name</label>
              <input id="name" required className="input-field" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="headline">Headline (optional)</label>
              <input id="headline" className="input-field" value={form.headline}
                onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Aspiring Full Stack Developer" />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input-field" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <input id="password" type="password" required minLength={6} className="input-field" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
              <UserPlus size={18} /> {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="section-subtitle" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
