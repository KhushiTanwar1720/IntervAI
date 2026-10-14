import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../services/api';

export default function ResumeReviewModal({ extracted, onClose, onMerged }) {
  const [selectedSkills, setSelectedSkills] = useState(new Set(extracted.skills || []));
  const [includeExperience, setIncludeExperience] = useState(true);
  const [includeEducation, setIncludeEducation] = useState(true);
  const [includeProjects, setIncludeProjects] = useState(true);
  const [includeCertifications, setIncludeCertifications] = useState(true);
  const [phone, setPhone] = useState(extracted.phone || '');
  const [linkedin, setLinkedin] = useState(extracted.links?.linkedin || '');
  const [github, setGithub] = useState(extracted.links?.github || '');
  const [portfolio, setPortfolio] = useState(extracted.links?.portfolio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleSkill(skill) {
    setSelectedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill); else next.add(skill);
      return next;
    });
  }

  async function handleMerge() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        skills: Array.from(selectedSkills),
        work_experience: includeExperience ? extracted.experience : [],
        education: includeEducation ? extracted.education : [],
        projects: includeProjects ? extracted.projects : [],
        certifications: includeCertifications ? extracted.certifications : [],
        phone,
        linkedin_url: linkedin,
        github_url: github,
        portfolio_url: portfolio,
        mergeMode: 'merge'
      };
      const result = await api.resume.merge(payload);
      onMerged(result.profile);
    } catch (err) {
      setError(err.message || 'Failed to merge resume data.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Review Extracted Resume Data</h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p className="section-subtitle" style={{ marginBottom: '1rem' }}>
            Nothing is saved automatically. Review and deselect anything incorrect before merging into your profile.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="input-label" style={{ marginBottom: '0.6rem' }}>Skills Detected ({selectedSkills.size} selected)</div>
            <div className="tags-container">
              {(extracted.skills || []).length === 0 && <span className="section-subtitle">No skills detected.</span>}
              {(extracted.skills || []).map(skill => (
                <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                  className={`badge ${selectedSkills.has(skill) ? 'badge-emerald' : 'badge-rose'}`}
                  style={{ cursor: 'pointer', border: 'none' }}>
                  {selectedSkills.has(skill) && <Check size={12} />} {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">LinkedIn</label>
              <input className="input-field" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">GitHub</label>
              <input className="input-field" value={github} onChange={e => setGithub(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Portfolio</label>
              <input className="input-field" value={portfolio} onChange={e => setPortfolio(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input type="checkbox" checked={includeExperience} onChange={e => setIncludeExperience(e.target.checked)} />
              Include {extracted.experience?.length || 0} work experience entries
            </label>
            <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input type="checkbox" checked={includeEducation} onChange={e => setIncludeEducation(e.target.checked)} />
              Include {extracted.education?.length || 0} education entries
            </label>
            <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input type="checkbox" checked={includeProjects} onChange={e => setIncludeProjects(e.target.checked)} />
              Include {extracted.projects?.length || 0} projects
            </label>
            <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input type="checkbox" checked={includeCertifications} onChange={e => setIncludeCertifications(e.target.checked)} />
              Include {extracted.certifications?.length || 0} certifications
            </label>
          </div>

          {error && <div className="badge badge-rose" style={{ display: 'block', marginTop: '1rem', padding: '0.6rem 0.9rem' }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleMerge} disabled={saving}>
            {saving ? 'Merging...' : 'Merge Into Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
