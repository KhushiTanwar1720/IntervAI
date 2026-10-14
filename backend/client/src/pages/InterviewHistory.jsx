import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, PlayCircle } from 'lucide-react';
import { api } from '../services/api';
import Reveal from '../components/Reveal';
import { SkeletonLine, SkeletonGrid } from '../components/Skeleton';

export default function InterviewHistory() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.interview.getHistory().then(setSessions).catch(err => setError(err.message));
  }, []);

  if (error) return <div className="empty-state"><p>{error}</p></div>;
  if (!sessions) {
    return (
      <div>
        <SkeletonLine size="sm" style={{ height: '1.8rem', marginBottom: '0.6rem', width: '35%' }} />
        <SkeletonLine size="md" style={{ marginBottom: '2rem' }} />
        <SkeletonGrid count={4} lines={2} />
      </div>
    );
  }

  return (
    <div>
      <Reveal as="div" className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title">Interview History</h1>
          <p className="section-subtitle">Review past mock interview sessions and their reports.</p>
        </div>
        <Link to="/interviews/new" className="btn btn-primary"><PlayCircle size={16} /> New Interview</Link>
      </Reveal>

      {sessions.length === 0 ? (
        <div className="glass-card empty-state">
          <Clock size={32} />
          <p>No interviews yet. Start your first mock interview to see it here.</p>
        </div>
      ) : (
        <div className="grid-2">
          {sessions.map((s, i) => (
            <Reveal as="div" key={s.id} delay={(i % 4) + 1} className="glass-card interactive">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.2rem' }}>{s.role_title}</h3>
                  <span className="section-subtitle" style={{ fontSize: '0.82rem' }}>{s.interview_type} · {s.difficulty}</span>
                </div>
                <span className={`badge ${s.status === 'completed' ? 'badge-emerald' : 'badge-amber'}`}>
                  {s.status === 'completed' ? `${s.overall_score}%` : 'In Progress'}
                </span>
              </div>
              <p className="section-subtitle" style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
                {s.question_count} questions · {new Date(s.created_at).toLocaleDateString()}
              </p>
              {s.status === 'completed' ? (
                <Link to={`/interviews/${s.id}/report`} className="btn btn-secondary btn-sm">View Report</Link>
              ) : (
                <Link to={`/interviews/${s.id}/session`} className="btn btn-primary btn-sm">Resume</Link>
              )}
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
