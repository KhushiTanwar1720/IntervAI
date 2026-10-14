import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Target, TrendingUp, ListChecks, Trophy, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import Reveal from '../components/Reveal';
import { SkeletonLine, SkeletonBlock, SkeletonCard } from '../components/Skeleton';

function StatCard({ icon: Icon, label, value, accent, delay }) {
  return (
    <Reveal delay={delay} className="glass-card interactive">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 'var(--radius-md)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: accent, flexShrink: 0
        }}>
          <Icon size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{value}</div>
          <div className="section-subtitle" style={{ fontSize: '0.85rem' }}>{label}</div>
        </div>
      </div>
    </Reveal>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.analytics.getDashboard().then(setData).catch(err => setError(err.message));
  }, []);

  if (error) return <div className="empty-state"><AlertCircle size={32} /><p>{error}</p></div>;
  if (!data) {
    return (
      <div>
        <SkeletonLine size="sm" style={{ height: '1.8rem', marginBottom: '0.6rem', width: '40%' }} />
        <SkeletonLine size="md" style={{ marginBottom: '2rem' }} />
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card"><SkeletonBlock height={46} /></div>
          ))}
        </div>
        <div className="grid-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  const { user, targetRole, profileCompleteness, roadmap, interviews, skillGaps, nextActions } = data;

  return (
    <div>
      <Reveal as="div" className="section-header">
        <span className="section-eyebrow">Your workspace</span>
        <h1 className="section-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="section-subtitle">Here's your preparation snapshot for <strong>{targetRole}</strong>.</p>
      </Reveal>

      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <StatCard icon={Target} label="Profile Completeness" value={`${profileCompleteness}%`} accent="var(--gradient-brand)" delay={1} />
        <StatCard icon={ListChecks} label="Roadmap Progress" value={`${roadmap.progressPercent}%`} accent="var(--gradient-cyan)" delay={2} />
        <StatCard icon={Trophy} label="Interviews Completed" value={interviews.totalCompleted} accent="var(--gradient-emerald)" delay={3} />
        <StatCard icon={TrendingUp} label="Average Score" value={`${interviews.averageScore}%`} accent="var(--gradient-amber)" delay={4} />
      </div>

      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        <Reveal className="glass-card">
          <h3 style={{ marginBottom: '1rem' }}>Performance Trend</h3>
          {interviews.performanceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={interviews.performanceTrend}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1a2238', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>No completed interviews yet. Start one to see your trend.</p>
            </div>
          )}
        </Reveal>

        <Reveal delay={1} className="glass-card">
          <h3 style={{ marginBottom: '1rem' }}>Skill Gap Overview — {skillGaps.roleTitle}</h3>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span className="section-subtitle">Role Match</span>
              <strong>{skillGaps.matchPercent}%</strong>
            </div>
            <div className="progress-container"><div className="progress-bar" style={{ width: `${skillGaps.matchPercent}%` }} /></div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <div className="section-subtitle" style={{ marginBottom: '0.5rem' }}>Matching Skills</div>
            <div className="tags-container">
              {skillGaps.matchingSkills.length === 0 && <span className="section-subtitle">None yet</span>}
              {skillGaps.matchingSkills.map(s => <span key={s} className="badge badge-emerald">{s}</span>)}
            </div>
          </div>
          <div>
            <div className="section-subtitle" style={{ marginBottom: '0.5rem' }}>Skill Gaps</div>
            <div className="tags-container">
              {skillGaps.missingSkills.length === 0 && <span className="section-subtitle">None — great job!</span>}
              {skillGaps.missingSkills.map(s => <span key={s} className="badge badge-rose">{s}</span>)}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal className="glass-card">
        <h3 style={{ marginBottom: '1.1rem' }}>Recommended Next Actions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {nextActions.map(action => (
            <Link key={action.id} to={action.link} className="glass-card interactive"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{action.title}</div>
                <div className="section-subtitle" style={{ fontSize: '0.85rem' }}>{action.description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <span className="badge badge-primary">{action.badge}</span>
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
