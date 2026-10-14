import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Reveal from '../components/Reveal';

const ROLE_OPTIONS = [
  'Full Stack Developer', 'Frontend Engineer', 'Backend Engineer', 'DevOps & Cloud Engineer',
  'AI / Machine Learning Engineer', 'Data Engineer', 'Product Manager (Technical)'
];
const TYPE_OPTIONS = [
  { value: 'technical', label: 'Technical' },
  { value: 'coding', label: 'Coding' },
  { value: 'hr', label: 'HR' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'system_design', label: 'System Design' }
];
const DIFFICULTY_OPTIONS = ['Junior', 'Mid', 'Senior', 'Staff/Lead'];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    roleTitle: 'Full Stack Developer',
    interviewType: 'technical',
    difficulty: 'Mid',
    durationMinutes: 30,
    totalQuestions: 5
  });
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const session = await api.interview.create(form);
      navigate(`/interviews/${session.id}/session`);
    } catch (err) {
      toast.error(err.message || 'Failed to start interview.');
      setCreating(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Reveal as="div" className="section-header">
        <span className="section-eyebrow">Mock interview</span>
        <h1 className="section-title">Configure Mock Interview</h1>
        <p className="section-subtitle">Choose a role, interview type, and difficulty for your simulated session.</p>
      </Reveal>

      <Reveal as="form" className="glass-card" onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Target Role</label>
          <select className="input-field" value={form.roleTitle} onChange={e => setForm({ ...form, roleTitle: e.target.value })}>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Interview Type</label>
          <div className="grid-3">
            {TYPE_OPTIONS.map(t => (
              <button key={t.value} type="button"
                className={`btn ${form.interviewType === t.value ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setForm({ ...form, interviewType: t.value })}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Difficulty</label>
          <div className="grid-4">
            {DIFFICULTY_OPTIONS.map(d => (
              <button key={d} type="button"
                className={`btn ${form.difficulty === d ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setForm({ ...form, difficulty: d })}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Duration (minutes)</label>
            <input type="number" min="10" max="90" className="input-field" value={form.durationMinutes}
              onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
          </div>
          <div className="input-group">
            <label className="input-label">Number of Questions</label>
            <input type="number" min="3" max="10" className="input-field" value={form.totalQuestions}
              onChange={e => setForm({ ...form, totalQuestions: Number(e.target.value) })} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={creating}>
          <PlayCircle size={18} /> {creating ? 'Preparing questions...' : 'Start Interview'}
        </button>
      </Reveal>
    </div>
  );
}
