import { useEffect, useState } from 'react';
import { Star, Check, Plus } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Reveal from '../components/Reveal';
import { SkeletonLine, SkeletonGrid } from '../components/Skeleton';

export default function Roles() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [busyRole, setBusyRole] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const result = await api.roles.getRecommendations();
      setData(result);
    } catch (err) {
      setLoadError(err.message);
    }
  }

  async function handleSelect(roleTitle, matchScore, makePrimary) {
    setBusyRole(roleTitle);
    try {
      await api.roles.select(roleTitle, makePrimary, matchScore);
      await load();
      toast.success(makePrimary ? `${roleTitle} set as your primary target.` : `${roleTitle} shortlisted.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyRole('');
    }
  }

  async function handleRemove(roleTitle) {
    setBusyRole(roleTitle);
    try {
      await api.roles.unselect(roleTitle);
      await load();
      toast.info(`${roleTitle} removed from your shortlist.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyRole('');
    }
  }

  async function handleAddCustom() {
    const title = customRole.trim();
    if (!title) return;
    await handleSelect(title, 0, false);
    setCustomRole('');
  }

  if (loadError) return <div className="empty-state"><p>{loadError}</p></div>;
  if (!data) {
    return (
      <div>
        <SkeletonLine size="sm" style={{ height: '1.8rem', marginBottom: '0.6rem', width: '35%' }} />
        <SkeletonLine size="md" style={{ marginBottom: '2rem' }} />
        <SkeletonGrid count={4} lines={4} />
      </div>
    );
  }

  return (
    <div>
      <Reveal as="div" className="section-header">
        <h1 className="section-title">Role Recommendations</h1>
        <p className="section-subtitle">Ranked by how well your current profile matches each role's required and preferred skills.</p>
      </Reveal>

      <Reveal className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.9rem' }}>Add a Custom Role</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input className="input-field" placeholder="e.g. Site Reliability Engineer" value={customRole}
            onChange={e => setCustomRole(e.target.value)} />
          <button type="button" className="btn btn-secondary" onClick={handleAddCustom}><Plus size={16} /> Add</button>
        </div>
      </Reveal>

      <div className="grid-2">
        {data.recommendations.map((role, i) => (
          <Reveal as="div" key={role.title} delay={(i % 4) + 1} className="glass-card interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.2rem' }}>{role.title}</h3>
                <span className="section-subtitle" style={{ fontSize: '0.82rem' }}>{role.category}</span>
              </div>
              <span className={`badge ${role.matchScore >= 70 ? 'badge-emerald' : role.matchScore >= 40 ? 'badge-amber' : 'badge-rose'}`}>
                {role.matchScore}% match
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', marginBottom: '0.9rem' }}>{role.description}</p>

            <div className="progress-container" style={{ marginBottom: '1rem' }}>
              <div className="progress-bar" style={{ width: `${role.matchScore}%` }} />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div className="section-subtitle" style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>Matching Skills</div>
              <div className="tags-container">
                {role.matchingSkills.length === 0 && <span className="section-subtitle">None yet</span>}
                {role.matchingSkills.slice(0, 8).map(s => <span key={s} className="badge badge-emerald">{s}</span>)}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div className="section-subtitle" style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>Preparation Priorities</div>
              <div className="tags-container">
                {role.preparationPriorities.map(p => (
                  <span key={p.skill} className="badge badge-rose" title={p.reason}>{p.skill}</span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {role.isPrimary ? (
                <span className="badge badge-primary" style={{ padding: '0.55rem 1rem' }}><Star size={14} /> Primary Target</span>
              ) : role.isSelected ? (
                <>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSelect(role.title, role.matchScore, true)} disabled={busyRole === role.title}>
                    <Star size={14} /> Make Primary
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleRemove(role.title)} disabled={busyRole === role.title}>
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => handleSelect(role.title, role.matchScore, true)} disabled={busyRole === role.title}>
                    <Star size={14} /> Set as Primary
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSelect(role.title, role.matchScore, false)} disabled={busyRole === role.title}>
                    <Check size={14} /> Shortlist
                  </button>
                </>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
