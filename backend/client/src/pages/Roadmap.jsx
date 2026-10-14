import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, RefreshCw, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Reveal from '../components/Reveal';
import { SkeletonLine, SkeletonCard } from '../components/Skeleton';

const CATEGORY_BADGE = {
  Theory: 'badge-primary',
  Coding: 'badge-cyan',
  Practice: 'badge-amber',
  'Mock Interview': 'badge-rose'
};

export default function Roadmap() {
  const toast = useToast();
  const [roadmap, setRoadmap] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({ targetRole: 'Full Stack Developer', targetDeadlineWeeks: 4, dailyHours: 2 });
  const [generating, setGenerating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await api.roadmap.get();
      setRoadmap(data);
      setForm(f => ({ ...f, targetRole: data.target_role, targetDeadlineWeeks: data.target_deadline_weeks, dailyHours: data.daily_hours }));
    } catch (err) {
      setLoadError(err.message);
    }
  }

  async function toggleTask(taskId) {
    await api.roadmap.toggleTask(taskId);
    await load();
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.roadmap.generate(form);
      setShowGenerate(false);
      await load();
      toast.success('New roadmap generated.');
    } catch (err) {
      toast.error(err.message || 'Failed to generate roadmap.');
    } finally {
      setGenerating(false);
    }
  }

  if (loadError) return <div className="empty-state"><p>{loadError}</p></div>;
  if (!roadmap) {
    return (
      <div>
        <SkeletonLine size="sm" style={{ height: '1.8rem', marginBottom: '0.6rem', width: '35%' }} />
        <SkeletonLine size="md" style={{ marginBottom: '2rem' }} />
        <SkeletonCard lines={2} />
        <div style={{ marginTop: '1.25rem' }}><SkeletonCard lines={4} /></div>
      </div>
    );
  }

  const tasksByMilestone = {};
  for (const t of roadmap.tasks) {
    tasksByMilestone[t.milestone_id] = tasksByMilestone[t.milestone_id] || [];
    tasksByMilestone[t.milestone_id].push(t);
  }

  return (
    <div>
      <Reveal as="div" className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title">Learning Roadmap</h1>
          <p className="section-subtitle">{roadmap.target_role} · {roadmap.target_deadline_weeks} weeks · {roadmap.daily_hours}h/day</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setShowGenerate(v => !v)}>
          <RefreshCw size={16} /> Regenerate Roadmap
        </button>
      </Reveal>

      {showGenerate && (
        <form className="glass-card" style={{ marginBottom: '1.5rem' }} onSubmit={handleGenerate}>
          <div className="grid-3">
            <div className="input-group">
              <label className="input-label">Target Role</label>
              <input className="input-field" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Deadline (weeks)</label>
              <input type="number" min="2" max="12" className="input-field" value={form.targetDeadlineWeeks}
                onChange={e => setForm({ ...form, targetDeadlineWeeks: Number(e.target.value) })} />
            </div>
            <div className="input-group">
              <label className="input-label">Daily Study Hours</label>
              <input type="number" min="0.5" step="0.5" className="input-field" value={form.dailyHours}
                onChange={e => setForm({ ...form, dailyHours: Number(e.target.value) })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={generating}>{generating ? 'Generating...' : 'Generate New Roadmap'}</button>
        </form>
      )}

      <Reveal className="glass-card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span className="section-subtitle">Overall Progress</span>
          <strong>{roadmap.progress.completed} / {roadmap.progress.total} tasks ({roadmap.progress.progressPercent}%)</strong>
        </div>
        <div className="progress-container"><div className="progress-bar" style={{ width: `${roadmap.progress.progressPercent}%` }} /></div>
      </Reveal>

      {roadmap.milestones.map((m, i) => (
        <Reveal as="div" key={m.id} delay={(i % 4) + 1} className="glass-card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <h3>{m.title}</h3>
            <span className="badge badge-primary"><Clock size={12} /> {m.estimatedHours}h</span>
          </div>
          <p style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>{m.description}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(tasksByMilestone[m.id] || []).map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem',
                borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)',
                transition: 'opacity var(--transition-normal), background var(--transition-normal)'
              }}>
                <button type="button" onClick={() => toggleTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.is_completed ? 'var(--accent-emerald)' : 'var(--text-muted)', marginTop: 2, transition: 'color var(--transition-fast), transform var(--transition-fast)' }}>
                  {task.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, textDecoration: task.is_completed ? 'line-through' : 'none', opacity: task.is_completed ? 0.6 : 1, transition: 'opacity var(--transition-normal)' }}>
                    {task.title}
                  </div>
                  <p className="section-subtitle" style={{ fontSize: '0.84rem', margin: '0.2rem 0 0.4rem' }}>{task.description}</p>
                  <span className={`badge ${CATEGORY_BADGE[task.category] || 'badge-primary'}`}>{task.category}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
