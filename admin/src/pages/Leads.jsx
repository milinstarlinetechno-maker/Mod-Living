import { useEffect, useState } from 'react';
import { Download, MessageCircle, Phone, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAdmin } from '../context';

const STATUSES = ['new', 'contacted', 'closed'];

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function Leads() {
  const { notify } = useAdmin();
  const [leads, setLeads] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.listLeads().then(setLeads).catch((e) => notify(e.message, 'error')); }, [notify]);

  const setStatus = async (l, status) => {
    try {
      await api.updateLead(l.id, status);
      setLeads((x) => x.map((i) => (i.id === l.id ? { ...i, status } : i)));
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const remove = async (l) => {
    if (!window.confirm(`Delete the enquiry from ${l.name}?`)) return;
    try {
      await api.deleteLead(l.id);
      setLeads((x) => x.filter((i) => i.id !== l.id));
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const exportCsv = () => {
    const rows = [['Date', 'Name', 'Phone', 'City', 'Interested in', 'Message', 'Status'], ...leads.map((l) => [new Date(l.createdAt).toLocaleString(), l.name, l.phone, l.city, l.category, l.message, l.status])];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'mod-living-leads.csv' }).click();
    URL.revokeObjectURL(url);
  };

  const list = (leads || []).filter((l) => filter === 'all' || l.status === filter);

  return (
    <>
      <div className="page-head">
        <h1>Leads</h1>
        <p>Enquiries sent through the website contact form.</p>
      </div>
      <div className="toolbar">
        <div className="seg">
          {['all', ...STATUSES].map((s) => <button type="button" key={s} className={filter === s ? 'is-on' : ''} onClick={() => setFilter(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}
        </div>
        <button type="button" className="btn" onClick={exportCsv} disabled={!leads?.length}><Download size={16} /> Export CSV</button>
      </div>
      {!leads && <p className="muted">Loading…</p>}
      {leads && list.length === 0 && <p className="muted">No enquiries here.</p>}
      <div className="stack">
        {list.map((l) => {
          const digits = l.phone.replace(/\D/g, '');
          return (
            <article className="card lead" key={l.id}>
              <header className="card__head">
                <div>
                  <strong>{l.name}</strong>
                  <div className="muted small">{new Date(l.createdAt).toLocaleString()} · {l.city || '—'} · {l.category || 'General'}</div>
                </div>
                <select className={`pill pill--${l.status}`} value={l.status} onChange={(e) => setStatus(l, e.target.value)} aria-label="Status">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </header>
              {l.message && <p className="lead__msg">{l.message}</p>}
              <div className="row">
                <a className="btn btn--small" href={`tel:${l.phone}`}><Phone size={14} /> {l.phone}</a>
                <a className="btn btn--small" href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>
                <button type="button" className="btn btn--small btn--ghost" onClick={() => remove(l)}><Trash2 size={14} /> Delete</button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
