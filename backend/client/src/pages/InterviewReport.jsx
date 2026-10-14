import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import Reveal from '../components/Reveal';
import { SkeletonLine, SkeletonCard } from '../components/Skeleton';

function ScoreRing({ score }) {
  const color = score >= 75 ? 'var(--accent-emerald)' : score >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)';
  return (
    <div style={{
      width: 110, height: 110, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`, flexShrink: 0
    }}>
      <div style={{
        width: 86, height: 86, borderRadius: '50%', background: 'var(--bg-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
      }}>
        <strong style={{ fontSize: '1.4rem' }}>{score}</strong>
        <span className="section-subtitle" style={{ fontSize: '0.72rem' }}>/ 100</span>
      </div>
    </div>
  );
}

export default function InterviewReport() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.interview.getById(id).then(setSession).catch(err => setError(err.message));
  }, [id]);

  if (error) return <div className="empty-state"><p>{error}</p></div>;
  if (!session) {
    return (
      <div>
        <SkeletonLine size="sm" style={{ height: '1.8rem', marginBottom: '0.6rem', width: '35%' }} />
        <SkeletonLine size="md" style={{ marginBottom: '2rem' }} />
        <SkeletonCard lines={2} />
        <div style={{ marginTop: '1.25rem' }}><SkeletonCard lines={4} /></div>
      </div>
    );
  }

  const summary = session.evaluation_summary;

  return (
    <div>
      <Reveal as="div" className="section-header">
        <h1 className="section-title">Interview Report</h1>
        <p className="section-subtitle">{session.role_title} · {session.interview_type} · {session.difficulty} level</p>
      </Reveal>

      <Reveal className="glass-card" style={{ marginBottom: '1.75rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <ScoreRing score={summary.overallScore ?? session.overall_score} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Trophy size={20} color="var(--accent-amber)" />
            <h3>Overall Performance</h3>
          </div>
          <p>{summary.summary}</p>
        </div>
      </Reveal>

      {summary.categoryScores && (
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          {Object.entries(summary.categoryScores).map(([key, val], i) => (
            <Reveal as="div" key={key} delay={(i % 4) + 1} className="glass-card">
              <div className="section-subtitle" style={{ marginBottom: '0.5rem', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>{val}%</div>
              <div className="progress-container"><div className="progress-bar" style={{ width: `${val}%` }} /></div>
            </Reveal>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        <Reveal className="glass-card">
          <h3 style={{ marginBottom: '0.9rem', color: 'var(--accent-emerald)' }}>Strengths</h3>
          {(summary.strengths || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} /> {s}
            </div>
          ))}
        </Reveal>
        <Reveal delay={1} className="glass-card">
          <h3 style={{ marginBottom: '0.9rem', color: 'var(--accent-rose)' }}>Weaknesses</h3>
          {(summary.weaknesses || []).length === 0 && <p className="section-subtitle">No major weaknesses identified.</p>}
          {(summary.weaknesses || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
              <XCircle size={16} color="var(--accent-rose)" style={{ flexShrink: 0, marginTop: 2 }} /> {s}
            </div>
          ))}
        </Reveal>
      </div>

      <Reveal className="glass-card" style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ marginBottom: '0.9rem' }}>Next Steps</h3>
        {(summary.nextSteps || []).map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
            <ArrowRight size={16} style={{ flexShrink: 0, marginTop: 2 }} /> {s}
          </div>
        ))}
      </Reveal>

      <Reveal className="glass-card">
        <h3 style={{ marginBottom: '1.1rem' }}>Question-by-Question Breakdown</h3>
        {session.questions.map((q, idx) => (
          <div key={q.id} style={{ padding: '1rem 0', borderBottom: idx < session.questions.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <strong style={{ fontSize: '0.92rem' }}>Q{idx + 1}: {q.question_text}</strong>
              <span className={`badge ${q.score >= 70 ? 'badge-emerald' : q.score >= 45 ? 'badge-amber' : 'badge-rose'}`}>{q.score}/100</span>
            </div>
            <p className="section-subtitle" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Your answer:</strong> {q.user_answer || 'Not answered'}</p>
            {q.feedback?.correctness && <p style={{ fontSize: '0.85rem' }}>{q.feedback.correctness}</p>}
          </div>
        ))}
      </Reveal>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
        <Link to="/interviews/new" className="btn btn-primary">Start Another Interview</Link>
        <Link to="/interviews/history" className="btn btn-secondary">View All History</Link>
      </div>
    </div>
  );
}
