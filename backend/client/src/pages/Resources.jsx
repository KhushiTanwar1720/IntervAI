import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, CheckCircle2, Circle, ExternalLink, Search } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Reveal from '../components/Reveal';
import { SkeletonLine, SkeletonGrid } from '../components/Skeleton';

const TYPE_BADGE = {
  documentation: 'badge-primary',
  video: 'badge-rose',
  article: 'badge-cyan',
  practice: 'badge-amber'
};

export default function Resources() {
  const toast = useToast();
  const [resources, setResources] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('All');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  useEffect(() => { load(); }, [search, category, type]);

  async function load() {
    try {
      const data = await api.resources.getAll({ search, category, type });
      setResources(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load resources.');
    } finally {
      setLoaded(true);
    }
  }

  async function toggleBookmark(id, title, wasBookmarked) {
    await api.resources.toggleBookmark(id);
    await load();
    toast.info(wasBookmarked ? `Removed "${title}" from bookmarks.` : `Bookmarked "${title}".`);
  }

  async function toggleComplete(id, title, wasCompleted) {
    await api.resources.toggleCompleted(id);
    await load();
    if (!wasCompleted) toast.success(`Marked "${title}" complete.`);
  }

  const categories = ['All', ...new Set(resources.map(r => r.category))];
  const types = ['All', ...new Set(resources.map(r => r.type))];
  const visible = showBookmarksOnly ? resources.filter(r => r.is_bookmarked) : resources;

  if (!loaded) {
    return (
      <div>
        <SkeletonLine size="sm" style={{ height: '1.8rem', marginBottom: '0.6rem', width: '35%' }} />
        <SkeletonLine size="md" style={{ marginBottom: '2rem' }} />
        <SkeletonGrid count={6} lines={3} />
      </div>
    );
  }

  return (
    <div>
      <Reveal as="div" className="section-header">
        <h1 className="section-title">Learning Resources</h1>
        <p className="section-subtitle">Verified documentation, videos, articles, and practice problems — bookmark and track completion.</p>
      </Reveal>

      <Reveal className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div className="grid-3">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input className="input-field" style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." />
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Category</label>
            <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Type</label>
            <select className="input-field" value={type} onChange={e => setType(e.target.value)}>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={showBookmarksOnly} onChange={e => setShowBookmarksOnly(e.target.checked)} />
          Show bookmarked only
        </label>
      </Reveal>

      <div className="grid-2">
        {visible.map((res, i) => (
          <Reveal as="div" key={res.id} delay={(i % 4) + 1} className="glass-card interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
              <span className={`badge ${TYPE_BADGE[res.type] || 'badge-primary'}`}>{res.type}</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleBookmark(res.id, res.title, res.is_bookmarked)} title="Bookmark">
                  {res.is_bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleComplete(res.id, res.title, res.is_completed)} title="Mark complete">
                  {res.is_completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </button>
              </div>
            </div>
            <h3 style={{ marginBottom: '0.3rem', fontSize: '1.05rem' }}>{res.title}</h3>
            <p className="section-subtitle" style={{ fontSize: '0.84rem', marginBottom: '0.75rem' }}>{res.description}</p>
            <div className="tags-container" style={{ marginBottom: '0.9rem' }}>
              {res.tags.slice(0, 5).map(t => <span key={t} className="tag-chip">{t}</span>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-subtitle" style={{ fontSize: '0.8rem' }}>{res.platform} · {res.difficulty}</span>
              <a href={res.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                Open <ExternalLink size={13} />
              </a>
            </div>
          </Reveal>
        ))}
        {visible.length === 0 && (
          <div className="empty-state"><p>No resources match your filters.</p></div>
        )}
      </div>
    </div>
  );
}
