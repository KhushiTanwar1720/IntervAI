import { useEffect, useState } from 'react';
import { FileSearch, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Reveal from '../components/Reveal';

export default function JobDescription() {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    try {
      const data = await api.jd.getHistory();
      setHistory(data);
    } catch { /* non-fatal */ }
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.jd.analyze({ title, company, jdText });
      setResult(data);
      await loadHistory();
      toast.success('Job description analyzed.');
    } catch (err) {
      toast.error(err.message || 'Failed to analyze job description.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Reveal as="div" className="section-header">
        <h1 className="section-title">Job Description Analyzer</h1>
        <p className="section-subtitle">Paste a job description to compare it against your current profile and surface skill gaps.</p>
      </Reveal>

      <div className="grid-2">
        <Reveal as="form" className="glass-card" onSubmit={handleAnalyze}>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Job Title</label>
              <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" />
            </div>
            <div className="input-group">
              <label className="input-label">Company (optional)</label>
              <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Job Description Text</label>
            <textarea className="input-field" style={{ minHeight: 260 }} required
              value={jdText} onChange={e => setJdText(e.target.value)}
              placeholder="Paste the full job description here..." />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <FileSearch size={16} /> {loading ? 'Analyzing...' : 'Analyze Job Description'}
          </button>
        </Reveal>

        <div>
          {result ? (
            <Reveal className="glass-card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.3rem' }}>{result.title}</h3>
              {result.company && <p className="section-subtitle" style={{ marginBottom: '0.9rem' }}>{result.company}</p>}

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.1rem' }}>
                <span className="badge badge-primary">{result.analysis.detectedLevel}</span>
                <span className={`badge ${result.analysis.matchPercentage >= 60 ? 'badge-emerald' : 'badge-amber'}`}>
                  {result.analysis.matchPercentage}% profile match
                </span>
              </div>

              <div className="progress-container" style={{ marginBottom: '1.25rem' }}>
                <div className="progress-bar" style={{ width: `${result.analysis.matchPercentage}%` }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div className="section-subtitle" style={{ marginBottom: '0.5rem' }}>Matching Skills</div>
                <div className="tags-container">
                  {result.analysis.matchingSkills.length === 0 && <span className="section-subtitle">None detected</span>}
                  {result.analysis.matchingSkills.map(s => <span key={s} className="badge badge-emerald">{s}</span>)}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div className="section-subtitle" style={{ marginBottom: '0.5rem' }}>Missing Skills</div>
                <div className="tags-container">
                  {result.analysis.missingSkills.length === 0 && <span className="section-subtitle">None — you're fully covered!</span>}
                  {result.analysis.missingSkills.map(s => <span key={s} className="badge badge-rose">{s}</span>)}
                </div>
              </div>

              <div>
                <div className="section-subtitle" style={{ marginBottom: '0.5rem' }}>Recommendations</div>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.88rem' }}>
                  {result.analysis.recommendations.map((r, i) => <li key={i} style={{ marginBottom: '0.4rem' }}>{r}</li>)}
                </ul>
              </div>
            </Reveal>
          ) : (
            <div className="glass-card empty-state" style={{ marginBottom: '1.5rem' }}>
              <FileSearch size={32} />
              <p>Analysis results will appear here.</p>
            </div>
          )}

          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem' }}><Clock size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Recent Analyses</h3>
            {history.length === 0 && <p className="section-subtitle">No analyses yet.</p>}
            {history.slice(0, 6).map(h => (
              <div key={h.id} style={{ padding: '0.7rem 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{h.title}</div>
                  <div className="section-subtitle" style={{ fontSize: '0.8rem' }}>{h.company || h.experience_level}</div>
                </div>
                <span className="badge badge-primary">{h.match_analysis.matchPercentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
