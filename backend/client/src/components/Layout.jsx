import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserCircle, Briefcase, FileSearch, Map, BookOpen,
  MessageSquareText, History, Settings as SettingsIcon, LogOut, Sparkles, Menu
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Career Profile', icon: UserCircle },
  { to: '/roles', label: 'Role Recommendations', icon: Briefcase },
  { to: '/job-description', label: 'JD Analyzer', icon: FileSearch },
  { to: '/roadmap', label: 'Learning Roadmap', icon: Map },
  { to: '/resources', label: 'Resources', icon: BookOpen },
  { to: '/interviews/new', label: 'New Mock Interview', icon: MessageSquareText },
  { to: '/interviews/history', label: 'Interview History', icon: History },
  { to: '/settings', label: 'Settings', icon: SettingsIcon }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-container">
      <aside className="sidebar" style={collapsed ? { width: 0, overflow: 'hidden', borderRight: 'none' } : {}}>
        <div className="sidebar-header">
          <div className="brand-logo">
            <span className="brand-icon"><Sparkles size={20} /></span>
            IntervAI
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0
            }}>
              {(user?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className={`top-header${scrolled ? ' is-scrolled' : ''}`}>
          <div className="header-left">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setCollapsed(c => !c)}>
              <Menu size={16} />
            </button>
          </div>
          <div className="header-right">
            <span className="badge badge-primary">{user?.targetRole || 'Full Stack Developer'}</span>
          </div>
        </header>
        <div className="page-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
