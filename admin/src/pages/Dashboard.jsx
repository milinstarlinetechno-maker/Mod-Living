import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarCheck, ExternalLink, FolderOpen, Image as ImageIcon, Inbox, Layers, Mail, Users, Wallet } from 'lucide-react';
import { api } from '../api';
import { useAdmin } from '../context';
import { dateLabel, money, monthOf, monthLabel, todayStr } from './hr/util';

const SITE_URL = import.meta.env.VITE_SITE_URL || (import.meta.env.DEV ? 'http://localhost:5173' : '/');

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function Dashboard() {
  const { content } = useAdmin();
  const [leads, setLeads] = useState([]);
  const [media, setMedia] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [today, setToday] = useState([]);
  const [payroll, setPayroll] = useState(null);

  useEffect(() => {
    const day = todayStr();
    api.listLeads().then(setLeads).catch(() => {});
    api.listMedia().then(setMedia).catch(() => {});
    api.listEmployees().then(setEmployees).catch(() => {});
    api.getAttendance({ from: day, to: day }).then(setToday).catch(() => {});
    api.getPayroll(monthOf(day)).then(setPayroll).catch(() => {});
  }, []);

  const newLeads = leads.filter((l) => l.status === 'new').length;
  const projectsShown = content.projects.filter((p) => p.visible !== false).length;
  const active = employees.filter((e) => e.status === 'active');
  const count = (s) => today.filter((r) => r.status === s && active.some((e) => e.id === r.employeeId)).length;
  const marked = count('present') + count('absent') + count('half') + count('leave');
  const pct = (n) => (active.length ? (n / active.length) * 100 : 0);
  const pages = [{ name: 'Home', on: true }, { name: 'Projects', on: content.pages.projects.enabled }, { name: 'Contact', on: content.pages.contact.enabled }];

  const kpis = [
    { to: '/leads', icon: Inbox, tone: 'red', value: newLeads, label: 'New enquiries', note: `${leads.length} total` },
    { to: '/attendance/employees', icon: Users, tone: 'blue', value: active.length, label: 'Active employees', note: `${employees.length - active.length} inactive` },
    { to: '/attendance/salary', icon: Wallet, tone: 'green', value: payroll ? money(payroll.totals.net).replace(/\.00$/, '') : '—', label: 'Net salary this month', note: monthLabel(monthOf(todayStr())) },
    { to: '/projects', icon: FolderOpen, tone: 'brand', value: projectsShown, label: 'Projects on website', note: `${content.projects.length} added · ${media.length} files` },
  ];

  const actions = [
    { to: '/attendance/daily', icon: CalendarCheck, label: 'Mark attendance' },
    { to: '/home', icon: Layers, label: 'Edit home page' },
    { to: '/projects', icon: FolderOpen, label: 'Add a project' },
    { to: '/media', icon: ImageIcon, label: 'Upload media' },
    { to: '/contact', icon: Mail, label: 'Contact page' },
    { to: '/attendance/employees', icon: Users, label: 'Add employee' },
  ];

  return (
    <>
      <div className="hello">
        <div>
          <h1>{greeting()} 👋</h1>
          <p>Here is what is happening with MOD LIVING today.</p>
        </div>
        <span className="date">{dateLabel(todayStr())}</span>
      </div>

      <div className="kpis">
        {kpis.map(({ to, icon: Icon, tone, value, label, note }) => (
          <Link key={label} to={to} className={`kpi tone-${tone}`}>
            <span className="kpi__icon"><Icon size={20} /></span>
            <strong>{value}</strong>
            <span>{label}</span>
            <small>{note}</small>
          </Link>
        ))}
      </div>

      <div className="dash-grid">
        <section className="card">
          <div className="panel__head"><h2>Today’s attendance</h2><Link to="/attendance/daily" className="link">Mark attendance</Link></div>
          {active.length === 0 ? (
            <p className="muted">No employees yet. <Link to="/attendance/employees" className="link">Add your first employee</Link></p>
          ) : (
            <>
              <div className="big-num">{marked}<span className="muted" style={{ fontSize: "1.1rem", fontWeight: 600 }}>{` / ${active.length} marked`}</span></div>
              <div className="meter" role="img" aria-label="Attendance today">
                <i className="m-present" style={{ width: `${pct(count('present'))}%` }} />
                <i className="m-half" style={{ width: `${pct(count('half'))}%` }} />
                <i className="m-leave" style={{ width: `${pct(count('leave'))}%` }} />
                <i className="m-absent" style={{ width: `${pct(count('absent'))}%` }} />
              </div>
              <div className="legend-row">
                <span><i className="m-present" /> Present <b>{count('present')}</b></span>
                <span><i className="m-absent" /> Absent <b>{count('absent')}</b></span>
                <span><i className="m-half" /> Half day <b>{count('half')}</b></span>
                <span><i className="m-leave" /> On leave <b>{count('leave')}</b></span>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <div className="panel__head"><h2>Latest enquiries</h2><Link to="/leads" className="link">View all</Link></div>
          {leads.length === 0 && <p className="muted">No enquiries yet. They appear here when someone uses the website contact form.</p>}
          {leads.slice(0, 5).map((l) => (
            <div className="mini" key={l.id}>
              <div><strong>{l.name}</strong><div className="muted small">{l.category || 'General'}{l.city ? ` · ${l.city}` : ''}</div></div>
              <span className={`pill pill--${l.status}`}>{l.status}</span>
            </div>
          ))}
        </section>
      </div>

      <div className="dash-grid">
        <section className="card">
          <div className="panel__head"><h2>Quick actions</h2></div>
          <div className="tiles">
            {actions.map(({ to, icon: Icon, label }) => <Link key={label} to={to} className="tile"><Icon size={20} />{label}</Link>)}
          </div>
        </section>
        <section className="card">
          <div className="panel__head"><h2>Website status</h2><a href={SITE_URL} target="_blank" rel="noreferrer" className="link">Open website <ExternalLink size={12} style={{ verticalAlign: '-1px' }} /></a></div>
          <div className="page-chips">
            {pages.map((p) => <span key={p.name} className={`st ${p.on ? 'st--present' : 'st--off'}`}>{p.name} · {p.on ? 'Live' : 'Hidden'}</span>)}
          </div>
          <p className="muted small" style={{ margin: '.9rem 0 1rem' }}>Every text, photo, video and button on the website is managed from this panel. Changes go live as soon as you press Save.</p>
          <Link to="/pages" className="btn btn--small">Manage pages & menu <ArrowUpRight size={14} /></Link>
        </section>
      </div>
    </>
  );
}
