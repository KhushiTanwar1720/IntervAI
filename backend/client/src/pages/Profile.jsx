import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Upload, Save, X } from 'lucide-react';
import { api } from '../services/api';
import ResumeReviewModal from '../components/ResumeReviewModal';
import Reveal from '../components/Reveal';
import { SkeletonLine, SkeletonCard } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ROLE_OPTIONS = [
  'Full Stack Developer', 'Frontend Engineer', 'Backend Engineer', 'DevOps & Cloud Engineer',
  'AI / Machine Learning Engineer', 'Data Engineer', 'Product Manager (Technical)'
];
const LEVEL_OPTIONS = ['Junior', 'Mid', 'Senior', 'Staff/Lead'];

function SkillInput({ skills, onChange }) {
  const [value, setValue] = useState('');
  function addSkill() {
    const v = value.trim();
    if (v && !skills.some(s => s.toLowerCase() === v.toLowerCase())) {
      onChange([...skills, v]);
    }
    setValue('');
  }
  return (
    <div>
      <div className="tags-container" style={{ marginBottom: '0.75rem' }}>
        {skills.map(s => (
          <span key={s} className="tag-chip">
            {s}
            <button type="button" onClick={() => onChange(skills.filter(x => x !== s))}><X size={13} /></button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <input className="input-field" value={value} placeholder="Add a skill and press Enter"
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
        <button type="button" className="btn btn-secondary" onClick={addSkill}><Plus size={16} /></button>
      </div>
    </div>
  );
}

function ListEditor({ items, onChange, fields, emptyItem, renderTitle }) {
  function update(idx, key, val) {
    const next = items.map((it, i) => i === idx ? { ...it, [key]: val } : it);
    onChange(next);
  }
  function remove(idx) { onChange(items.filter((_, i) => i !== idx)); }
  function add() { onChange([...items, { ...emptyItem }]); }

  return (
    <div>
      {items.map((item, idx) => (
        <div key={idx} className="glass-card" style={{ padding: '1.1rem', marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <strong style={{ fontSize: '0.9rem' }}>{renderTitle ? renderTitle(item, idx) : `Entry ${idx + 1}`}</strong>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(idx)}><Trash2 size={14} /></button>
          </div>
          <div className="grid-2">
            {fields.map(f => (
              <div key={f.key} className="input-group" style={f.full ? { gridColumn: '1 / -1' } : {}}>
                <label className="input-label">{f.label}</label>
                {f.textarea ? (
                  <textarea className="input-field" value={item[f.key] || ''} onChange={e => update(idx, f.key, e.target.value)} />
                ) : (
                  <input className="input-field" value={item[f.key] || ''} onChange={e => update(idx, f.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-outline btn-sm" onClick={add}><Plus size={14} /> Add Entry</button>
    </div>
  );
}

export default function Profile() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const data = await api.profile.get();
    setProfile(data.profile);
    setName(data.user.name);
    setHeadline(data.user.headline || '');
  }

  function setField(key, val) {
    setProfile(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...profile, name, headline };
      const result = await api.profile.update(payload);
      setProfile(result.profile);
      toast.success('Profile saved successfully.');
      refreshUser();
    } catch (err) {
      toast.error(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.resume.upload(file);
      setReviewData(result.extracted);
    } catch (err) {
      toast.error(err.message || 'Failed to parse resume.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleMerged(updatedProfile) {
    setProfile(updatedProfile);
    setReviewData(null);
    toast.success('Resume data merged into your profile. Review below and save.');
  }

  if (!profile) {
    return (
      <div>
        <SkeletonLine size="sm" style={{ height: '1.8rem', marginBottom: '0.6rem', width: '35%' }} />
        <SkeletonLine size="md" style={{ marginBottom: '2rem' }} />
        <div className="grid-2">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    );
  }

  const completeness = profile.completeness?.score ?? 0;

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title">Career Profile</h1>
          <p className="section-subtitle">Keep your superset profile accurate — it powers role matching, roadmaps, and interviews.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: 'none' }} onChange={handleFileChange} />
          <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload size={16} /> {uploading ? 'Parsing...' : 'Upload Resume'}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      <Reveal className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span className="section-subtitle">Profile Completeness</span>
          <strong>{completeness}%</strong>
        </div>
        <div className="progress-container"><div className="progress-bar" style={{ width: `${completeness}%` }} /></div>
      </Reveal>

      <Reveal className="grid-2" delay={1} style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.1rem' }}>Basics</h3>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Headline</label>
            <input className="input-field" value={headline} onChange={e => setHeadline(e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input className="input-field" value={profile.phone || ''} onChange={e => setField('phone', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Location</label>
              <input className="input-field" value={profile.location || ''} onChange={e => setField('location', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '1.1rem' }}>Career Target</h3>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Target Role</label>
              <select className="input-field" value={profile.target_role} onChange={e => setField('target_role', e.target.value)}>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Target Level</label>
              <select className="input-field" value={profile.target_level} onChange={e => setField('target_level', e.target.value)}>
                {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Years of Experience</label>
            <input type="number" min="0" step="0.5" className="input-field" value={profile.experience_years || 0}
              onChange={e => setField('experience_years', e.target.value)} />
          </div>
        </div>
      </Reveal>

      <Reveal className="glass-card" delay={2} style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.1rem' }}>Links</h3>
        <div className="grid-3">
          <div className="input-group">
            <label className="input-label">LinkedIn</label>
            <input className="input-field" value={profile.linkedin_url || ''} onChange={e => setField('linkedin_url', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">GitHub</label>
            <input className="input-field" value={profile.github_url || ''} onChange={e => setField('github_url', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Portfolio</label>
            <input className="input-field" value={profile.portfolio_url || ''} onChange={e => setField('portfolio_url', e.target.value)} />
          </div>
        </div>
      </Reveal>

      <Reveal className="glass-card" delay={3} style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.1rem' }}>Skills</h3>
        <SkillInput skills={profile.skills || []} onChange={v => setField('skills', v)} />
      </Reveal>

      <Reveal className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.1rem' }}>Work Experience</h3>
        <ListEditor
          items={profile.work_experience || []}
          onChange={v => setField('work_experience', v)}
          emptyItem={{ title: '', company: '', dateRange: '', description: '' }}
          renderTitle={(it) => it.title || it.company || 'New Role'}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'company', label: 'Company' },
            { key: 'dateRange', label: 'Date Range' },
            { key: 'description', label: 'Description', textarea: true, full: true }
          ]}
        />
      </Reveal>

      <Reveal className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.1rem' }}>Education</h3>
          <ListEditor
            items={profile.education || []}
            onChange={v => setField('education', v)}
            emptyItem={{ degree: '', institution: '', graduationYear: '', gpa: '' }}
            renderTitle={(it) => it.degree || 'New Entry'}
            fields={[
              { key: 'degree', label: 'Degree' },
              { key: 'institution', label: 'Institution' },
              { key: 'graduationYear', label: 'Graduation Year' },
              { key: 'gpa', label: 'GPA' }
            ]}
          />
        </div>
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.1rem' }}>Certifications</h3>
          <ListEditor
            items={profile.certifications || []}
            onChange={v => setField('certifications', v)}
            emptyItem={{ name: '', issuer: '' }}
            renderTitle={(it) => it.name || 'New Certification'}
            fields={[
              { key: 'name', label: 'Name', full: true },
              { key: 'issuer', label: 'Issuer', full: true }
            ]}
          />
        </div>
      </Reveal>

      <Reveal className="glass-card">
        <h3 style={{ marginBottom: '1.1rem' }}>Projects</h3>
        <ListEditor
          items={profile.projects || []}
          onChange={v => setField('projects', v)}
          emptyItem={{ title: '', description: '', techStack: [] }}
          renderTitle={(it) => it.title || 'New Project'}
          fields={[
            { key: 'title', label: 'Title', full: true },
            { key: 'description', label: 'Description', textarea: true, full: true }
          ]}
        />
      </Reveal>

      {reviewData && (
        <ResumeReviewModal extracted={reviewData} onClose={() => setReviewData(null)} onMerged={handleMerged} />
      )}
    </div>
  );
}
