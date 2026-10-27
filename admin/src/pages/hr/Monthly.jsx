import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import { api } from '../../api';
import { useAdmin } from '../../context';
import { AttendanceEditor, HrHeader, Stepper } from './Shared';
import { STATUS, dateLabel, daysInMonth, downloadCsv, monthLabel, monthOf, offReason, shiftMonth, todayStr, useEmployees, useHolidays, weekdayOf, WEEKDAYS } from './util';

export default function Monthly() {
  const { notify } = useAdmin();
  const [month, setMonth] = useState(() => monthOf(todayStr()));
  const [employees] = useEmployees();
  const [{ holidays }] = useHolidays();
  const [records, setRecords] = useState({}); // "empId|date" -> record
  const [cell, setCell] = useState(null); // { emp, date }

  const load = useCallback(() => {
    api.getAttendance({ month })
      .then((list) => setRecords(Object.fromEntries(list.map((r) => [`${r.employeeId}|${r.date}`, r]))))
      .catch((e) => notify(e.message, 'error'));
  }, [month, notify]);
  useEffect(() => { setRecords({}); load(); }, [load]);

  const total = daysInMonth(month);
  const dates = useMemo(() => Array.from({ length: total }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`), [month, total]);
  const list = (employees || []).filter((e) => (e.status === 'active' || dates.some((d) => records[`${e.id}|${d}`])) && (!e.joiningDate || e.joiningDate.slice(0, 7) <= month));

  const save = async (emp, date, next) => {
    const key = `${emp.id}|${date}`;
    const before = records[key];
    setRecords((r) => { const n = { ...r }; if (next) n[key] = { ...next, employeeId: emp.id, date }; else delete n[key]; return n; });
    try {
      await api.setAttendance({ employeeId: emp.id, date, ...(next || { status: '' }) });
    } catch (e) {
      notify(e.message, 'error');
      setRecords((r) => { const n = { ...r }; if (before) n[key] = before; else delete n[key]; return n; });
    }
  };

  const countFor = (emp, status) => dates.filter((d) => !offReason(emp, d, holidays) && records[`${emp.id}|${d}`]?.status === status).length;

  const exportCsv = () => downloadCsv(`attendance-${month}.csv`, [
    ['Employee no.', 'Name', ...dates.map((d) => d.slice(8)), 'Present', 'Half', 'Absent', 'Leave'],
    ...list.map((e) => [e.empCode, e.name, ...dates.map((d) => STATUS[records[`${e.id}|${d}`]?.status]?.short || (offReason(e, d, holidays) ? 'OFF' : '')), countFor(e, 'present'), countFor(e, 'half'), countFor(e, 'absent'), countFor(e, 'leave')]),
  ]);

  const editing = cell && records[`${cell.emp.id}|${cell.date}`];

  return (
    <HrHeader title="Monthly Sheet" description="The whole month at a glance. Click any day to mark or change it.">
      <div className="toolbar">
        <Stepper type="month" value={month} onChange={setMonth} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} label="Month" />
        <button type="button" className="btn" onClick={exportCsv} disabled={!list.length}><Download size={16} /> Export CSV</button>
      </div>
      <div className="legend">
        {Object.entries(STATUS).map(([k, s]) => <span key={k}><i className={`dot dot--${k}`} /> {s.short} = {s.label}</span>)}
        <span><i className="dot dot--off" /> Off / holiday</span>
        <span><i className="dot dot--none" /> Not marked</span>
      </div>
      {!employees && <p className="muted">Loading…</p>}
      {employees && list.length === 0 && <div className="card empty-state"><p><strong>No employees for this month.</strong></p></div>}
      {list.length > 0 && (
        <div className="table-wrap card card--flush">
          <table className="sheet">
            <thead>
              <tr>
                <th className="sticky">{monthLabel(month)}</th>
                {dates.map((d) => <th key={d} className="sheet__day"><span>{Number(d.slice(8))}</span><small>{WEEKDAYS[weekdayOf(d)][0]}</small></th>)}
                <th className="num">P</th><th className="num">H</th><th className="num">A</th><th className="num">L</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td className="sticky"><strong>{e.name}</strong><small>{e.empCode}</small></td>
                  {dates.map((d) => {
                    const r = records[`${e.id}|${d}`];
                    const off = offReason(e, d, holidays);
                    return (
                      <td key={d} className="sheet__cell">
                        <button type="button" className={`cell ${r ? `cell--${r.status}` : off ? 'cell--off' : 'cell--none'}`} title={`${dateLabel(d)}${off ? ` — ${off}` : ''}${r?.reason ? ` — ${r.reason}` : ''}`} onClick={() => setCell({ emp: e, date: d })}>
                          {r ? STATUS[r.status].short : off ? '·' : ''}
                        </button>
                      </td>
                    );
                  })}
                  <td className="num">{countFor(e, 'present')}</td>
                  <td className="num">{countFor(e, 'half')}</td>
                  <td className="num">{countFor(e, 'absent')}</td>
                  <td className="num">{countFor(e, 'leave')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {cell && (
        <div className="modal" role="dialog" aria-modal="true" onMouseDown={(ev) => ev.target === ev.currentTarget && setCell(null)}>
          <div className="modal__box modal__box--sm">
            <header className="modal__head">
              <div><h3>{cell.emp.name}</h3><p className="muted small">{dateLabel(cell.date)}{offReason(cell.emp, cell.date, holidays) ? ` · ${offReason(cell.emp, cell.date, holidays)}` : ''}</p></div>
              <button type="button" className="icon-btn" onClick={() => setCell(null)} aria-label="Close"><X size={18} /></button>
            </header>
            <div className="modal__body">
              <AttendanceEditor key={`${cell.emp.id}|${cell.date}`} record={editing} onChange={(next) => save(cell.emp, cell.date, next)} />
            </div>
            <footer className="modal__foot"><button type="button" className="btn btn--primary" onClick={() => setCell(null)}>Done</button></footer>
          </div>
        </div>
      )}
    </HrHeader>
  );
}
