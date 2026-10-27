import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CalendarOff, Info, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { useAdmin } from '../../context';
import { HrHeader } from './Shared';
import { WEEKDAYS, dateLabel, todayStr, useEmployees } from './util';

// Fixed-date holidays that can be added in one click (festival dates change every year, so add those by hand).
const COMMON = [
  { md: '01-01', name: 'New Year’s Day' },
  { md: '01-26', name: 'Republic Day' },
  { md: '05-01', name: 'Labour Day' },
  { md: '08-15', name: 'Independence Day' },
  { md: '10-02', name: 'Gandhi Jayanti' },
  { md: '12-25', name: 'Christmas' },
];

const daysUntil = (date) => Math.round((new Date(`${date}T00:00:00Z`) - new Date(`${todayStr()}T00:00:00Z`)) / 86400000);

export default function HrSettings() {
  const { notify } = useAdmin();
  const [employees] = useEmployees();
  const [s, setS] = useState(null);
  const [saved, setSaved] = useState('');
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const year = todayStr().slice(0, 4);

  useEffect(() => { api.getHrSettings().then((x) => { setS(x); setSaved(JSON.stringify(x)); }).catch((e) => notify(e.message, 'error')); }, [notify]);

  const add = (d, n) => {
    if (!d) return notify('Pick the holiday date first.', 'error');
    if (s.holidays.some((h) => h.date === d)) return notify('That date is already a holiday.', 'error');
    setS((x) => ({ ...x, holidays: [...x.holidays, { date: d, name: n.trim() }].sort((a, b) => a.date.localeCompare(b.date)) }));
  };

  const addFromForm = () => { add(date, name); if (date && !s.holidays.some((h) => h.date === date)) { setDate(''); setName(''); } };

  const save = async () => {
    setBusy(true);
    try {
      const res = await api.saveHrSettings(s);
      setS(res);
      setSaved(JSON.stringify(res));
      notify('Saved');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const upcoming = useMemo(() => (s ? s.holidays.filter((h) => h.date >= todayStr()) : []), [s]);
  const active = (employees || []).filter((e) => e.status === 'active');

  if (!s) return <HrHeader title="Holidays & Rules"><p className="muted">Loading…</p></HrHeader>;
  const dirty = JSON.stringify(s) !== saved;
  const next = upcoming[0];
  const thisYear = s.holidays.filter((h) => h.date.startsWith(year)).length;

  return (
    <HrHeader title="Holidays & Rules" description="Company holidays are not counted as working days. Choose how un-marked days are treated in salary.">
      <div className="account">
        <div className="stack">
          <section className="card form-wide">
            <header className="card__head"><span className="card__title"><Sparkles size={18} /> Days not marked</span></header>
            <label className={`radio radio--card ${s.unmarked === 'unpaid' ? 'is-on' : ''}`}>
              <input type="radio" name="unmarked" checked={s.unmarked === 'unpaid'} onChange={() => setS({ ...s, unmarked: 'unpaid' })} />
              <span><strong>Count as unpaid</strong><small>Safest. Salary is paid only for the days you marked.</small></span>
            </label>
            <label className={`radio radio--card ${s.unmarked === 'present' ? 'is-on' : ''}`}>
              <input type="radio" name="unmarked" checked={s.unmarked === 'present'} onChange={() => setS({ ...s, unmarked: 'present' })} />
              <span><strong>Count as present</strong><small>Mark only absences and leaves; everything else is paid.</small></span>
            </label>
          </section>

          <section className="card form-wide">
            <header className="card__head"><span className="card__title"><CalendarOff size={18} /> Company holidays</span><span className="st">{s.holidays.length} added</span></header>
            <div className="fields">
              <div className="field field--half"><label htmlFor="hd">Date</label><input id="hd" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="field field--half"><label htmlFor="hn">Holiday name</label><input id="hn" value={name} placeholder="e.g. Diwali" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFromForm())} /></div>
            </div>
            <button type="button" className="btn btn--small" onClick={addFromForm} style={{ marginTop: '.9rem' }}><Plus size={14} /> Add holiday</button>
            <div className="list" style={{ marginTop: '1rem', marginBottom: 0 }}>
              {s.holidays.length === 0 && <p className="muted">No holidays added yet.</p>}
              {s.holidays.map((h) => {
                const d = daysUntil(h.date);
                return (
                  <div className={`holiday ${d < 0 ? 'is-past' : ''}`} key={h.date}>
                    <span className="holiday__date"><b>{Number(h.date.slice(8))}</b>{new Date(`${h.date}T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })}</span>
                    <div><strong>{h.name || 'Holiday'}</strong><div className="muted small">{dateLabel(h.date)}</div></div>
                    <span className="muted small holiday__when">{d === 0 ? 'Today' : d > 0 ? `in ${d} day${d > 1 ? 's' : ''}` : 'Past'}</span>
                    <button type="button" className="icon-btn icon-btn--danger" onClick={() => setS({ ...s, holidays: s.holidays.filter((x) => x.date !== h.date) })} aria-label="Remove holiday"><Trash2 size={16} /></button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="stack">
          <section className="card profile">
            <span className="avatar avatar--lg kpi-icon"><CalendarDays size={28} /></span>
            <div>
              <strong>{next ? next.name || 'Holiday' : 'No upcoming holiday'}</strong>
              <p className="muted">{next ? `${dateLabel(next.date)} · ${daysUntil(next.date) === 0 ? 'today' : `in ${daysUntil(next.date)} days`}` : 'Add a holiday to see it here'}</p>
            </div>
            <div className="profile__tags">
              <span className="st st--leave">{thisYear} in {year}</span>
              <span className="st st--present">{upcoming.length} upcoming</span>
            </div>
          </section>

          <section className="card">
            <header className="card__head"><span className="card__title"><Sparkles size={18} /> Quick add for {year}</span></header>
            <p className="help" style={{ margin: '.6rem 0' }}>One click adds a fixed-date holiday. Festival dates change every year, so add those yourself.</p>
            <div className="chips">
              {COMMON.map((c) => {
                const d = `${year}-${c.md}`;
                const have = s.holidays.some((h) => h.date === d);
                return <button type="button" key={c.md} className={`chip ${have ? 'is-on' : ''}`} disabled={have} onClick={() => add(d, c.name)}>{have ? '✓ ' : '+ '}{c.name}</button>;
              })}
            </div>
          </section>

          <section className="card">
            <header className="card__head"><span className="card__title"><CalendarDays size={18} /> Weekly offs</span></header>
            <p className="help" style={{ margin: '.6rem 0' }}>Set per employee in the Employees tab.</p>
            {active.length === 0 && <p className="muted small">No active employees.</p>}
            {active.map((e) => (
              <div className="mini" key={e.id}>
                <strong>{e.name}</strong>
                <span className="chips">{(e.weeklyOff || []).length ? e.weeklyOff.map((d) => <span className="st" key={d}>{WEEKDAYS[d]}</span>) : <span className="muted small">No weekly off</span>}</span>
              </div>
            ))}
          </section>

          <section className="card note-card">
            <Info size={18} />
            <p>Holidays and weekly offs are paid as part of the fixed monthly salary. They are simply left out when the per-day rate is calculated.</p>
          </section>
        </aside>
      </div>

      <div className={`savebar ${dirty ? 'is-dirty' : ''}`}>
        <span>{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        <button type="button" className="btn btn--primary" onClick={save} disabled={!dirty || busy}><Save size={16} /> {busy ? 'Saving…' : 'Save changes'}</button>
      </div>
    </HrHeader>
  );
}
