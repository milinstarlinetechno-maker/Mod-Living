import { useMemo, useState } from 'react';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, ChevronRight, ExternalLink, FolderOpen, Home, Image as ImageIcon, Inbox, Layers, LayoutDashboard, LogOut, Mail, Menu, Moon, Settings, Sun, Tag, UserCog, X, XCircle } from 'lucide-react';
import { GlobalSpinner, Spinner } from './components/Spinner';
import { AdminProvider, useAdmin } from './context';
import Editor from './components/Editor';
import Account from './pages/Account';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Login from './pages/Login';
import MediaLibrary from './pages/MediaLibrary';
import Daily from './pages/hr/Daily';
import Employees from './pages/hr/Employees';
import HrSettings from './pages/hr/HrSettings';
import Leaves from './pages/hr/Leaves';
import Monthly from './pages/hr/Monthly';
import Salary from './pages/hr/Salary';
import { useTheme } from './theme';
import { contactPage, homePage, menuPage, offerPage, projectsPage, sitePage } from './schemas';

const SITE_URL = import.meta.env.VITE_SITE_URL || (import.meta.env.DEV ? 'http://localhost:5173' : '/');

const NAV_GROUPS = [
  { label: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    label: 'Website',
    items: [
      { to: '/pages', label: 'Pages & Menu', icon: Layers },
      { to: '/home', label: 'Home Page', icon: Home },
      { to: '/projects', label: 'Projects', icon: FolderOpen },
      { to: '/contact', label: 'Contact & Map', icon: Mail },
      { to: '/offer', label: 'Offer Banner', icon: Tag },
      { to: '/site', label: 'Site Settings', icon: Settings },
      { to: '/media', label: 'Media Library', icon: ImageIcon },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/leads', label: 'Leads', icon: Inbox },
      { to: '/attendance', label: 'Attendance & Salary', icon: CalendarCheck },
    ],
  },
  { label: 'System', items: [{ to: '/account', label: 'Account', icon: UserCog }] },
];
const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));

function Shell() {
  const { email, logout, content } = useAdmin();
  const [open, setOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const { pathname } = useLocation();
  const wide = pathname.startsWith('/attendance');
  const current = ALL_NAV.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to) && i.to !== '/')) || ALL_NAV[0];
  const initial = (email || 'A')[0];

  return (
    <div className="shell">
      <aside className={`side ${open ? 'is-open' : ''}`}>
        <div className="side__brand">
          <img src="/uploads/logo-white-300.png" alt="MOD LIVING" />
          <span>Admin</span>
        </div>
        <div className="side__scroll" onClick={() => setOpen(false)}>
          {NAV_GROUPS.map((g) => (
            <div key={g.label}>
              <p className="side__group">{g.label}</p>
              <nav>
                {g.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'is-active' : '')}><Icon size={18} /> {label}</NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="side__user">
          <span className="avatar">{initial}</span>
          <div><strong>Administrator</strong><small>{email}</small></div>
          <button type="button" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={17} /></button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-toggle" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={22} /> : <Menu size={22} />}</button>
          <div className="crumbs"><span>{current.group}</span><ChevronRight size={14} /><strong>{current.label}</strong></div>
          <span className="topbar__space" />
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          <a href={SITE_URL} target="_blank" rel="noreferrer" className="btn"><ExternalLink size={15} /> <span>View website</span></a>
          <span className="avatar" title={email}>{initial}</span>
        </header>
        <main className={`content ${wide ? 'content--wide' : ''}`} key={pathname.split('/')[1]}>{content ? <Outlet /> : <p className="muted">Loading…</p>}</main>
      </div>
    </div>
  );
}

function ProjectsEditor() {
  const { content } = useAdmin();
  const page = useMemo(() => projectsPage(content), []); // eslint-disable-line react-hooks/exhaustive-deps
  return <Editor key="projects" page={page} />;
}

// Nothing in the admin panel is reachable without logging in: every address except /login
// sends visitors to the login page first, and brings them back to the page they asked for.
function RequireAuth() {
  const { email, checking } = useAdmin();
  const location = useLocation();
  if (checking) return <div className="auth"><div className="page-loading" style={{ margin: 'auto' }}><Spinner size={52} /></div></div>;
  if (!email) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Shell />;
}

function LoginRoute() {
  const { email, checking } = useAdmin();
  const { state } = useLocation();
  if (checking) return <div className="auth"><div className="page-loading" style={{ margin: 'auto' }}><Spinner size={52} /></div></div>;
  if (email) return <Navigate to={state?.from?.pathname && state.from.pathname !== '/login' ? state.from.pathname : '/'} replace />;
  return <Login />;
}

function Routed() {
  const { toast } = useAdmin();
  return (
    <>
      <Routes>
        <Route path="login" element={<LoginRoute />} />
        <Route element={<RequireAuth />}>
          <Route index element={<Dashboard />} />
          <Route path="pages" element={<Editor key="pages" page={menuPage} />} />
          <Route path="home" element={<Editor key="home" page={homePage} />} />
          <Route path="projects" element={<ProjectsEditor />} />
          <Route path="contact" element={<Editor key="contact" page={contactPage} />} />
          <Route path="offer" element={<Editor key="offer" page={offerPage} />} />
          <Route path="site" element={<Editor key="site" page={sitePage} />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="leads" element={<Leads />} />
          <Route path="attendance" element={<Navigate to="daily" replace />} />
          <Route path="attendance/daily" element={<Daily />} />
          <Route path="attendance/monthly" element={<Monthly />} />
          <Route path="attendance/salary" element={<Salary />} />
          <Route path="attendance/leaves" element={<Leaves />} />
          <Route path="attendance/employees" element={<Employees />} />
          <Route path="attendance/settings" element={<HrSettings />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {toast && (
        <div className={`toast toast--${toast.kind}`} role="status" key={toast.id}>
          {toast.kind === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />} {toast.message}
        </div>
      )}
      <GlobalSpinner />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AdminProvider>
        <Routed />
      </AdminProvider>
    </BrowserRouter>
  );
}
