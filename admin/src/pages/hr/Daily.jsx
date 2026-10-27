import { useCallback, useEffect, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { api } from '../../api';
import { useAdmin } from '../../context';
import { AttendanceEditor, HrHeader, Stepper } from './Shared';
import { STATUS, dateLabel, offReason, shiftDate, todayStr, useEmployees, useHolidays } from './util';

export default function Daily() {
  const { notify } = useAdmin();
  const [date, setDate] = useState(todayStr);
  const [employees] = useEmployees();
  const [{ holidays }] = useHolidays();
  const [records, setRecords] = useState({}); // employeeId -> record
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.getAttendance({ from: date, to: date })
      .then((list) => setRecords(Object.fromEntries(list.map((r) => [r.employeeId, r]))))
      .catch((e) => notify(e.message, 'error'));
  }, [date, notify]);
  useEffect(() => { setRecords({}); load(); }, [load]);

  const save = async (emp, next) => {
    const before = records[emp.id];
    setRecords((r) => { const n = { ...r }; if (next) n[emp.id] = { ...next, employeeId: emp.id, date }; else delete n[emp.id]; return n; });
    try {
      await api.setAttendance({ employeeId: emp.id, date, ...(next || { status: '' }) });
    } catch (e) {
      notify(e.message, 'error');
      setRecords((r) => { const n = { ...r }; if (before) n[emp.id] = before; else delete n[emp.id]; return n; });
    }
  };

  const markAll = async () => {
    setBusy(true);
    try {
      const { marked } = await api.markAllPresent(date);
      notify(marked ? `${marked} employee${marked > 1 ? 's' : ''} marked present` : 'Everyone is already marked');
      load();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const active = (employees || []).filter((e) => e.status === 'active' && (!e.joiningDate || e.joiningDate <= date));
  const working = active.filter((e) => !offReason(e, date, holidays));
  const count = (s) => working.filter((e) => records[e.id]?.status === s).length;
  const unmarked = working.filter((e) => !records[e.id]).length;

  return (
    <HrHeader title="Daily Attendance" description="Mark each employee Present, Absent, Half day or Leave. Changes save instantly.">
      <div className="toolbar">
        <Stepper type="date" value={date} onChange={setDate} onPrev={() => setDate(shiftDate(date, -1))} onNext={() => setDate(shiftDate(date, 1))} label="Date" />
        <div className="row">
          {date !== todayStr() && <button type="button" className="btn" onClick={() => setDate(todayStr())}>Today</button>}
          <button type="button" className="btn btn--primary" onClick={markAll} disabled={busy || !working.length}><CheckCheck size={16} /> Mark all present</button>
        </div>
      </div>
      <p className="datebar">{dateLabel(date)}</p>
      <div className="summary">
        {Object.entries(STATUS).map(([k, s]) => <span key={k} className={`st st--${k}`}>{s.label}: {count(k)}</span>)}
        <span className="st st--none">Not marked: {unmarked}</span>
      </div>
      {!employees && <p className="muted">Loading…</p>}
      {employees && active.length === 0 && <div className="card empty-state"><p><strong>No active employees for this date.</strong></p><p className="muted">Add employees from the Employees tab.</p></div>}
      <div className="stack">
        {active.map((e) => {
          const off = offReason(e, date, holidays);
          return (
            <article className={`card att-row ${off ? 'is-off' : ''}`} key={e.id}>
              <div className="att-row__who">
                <strong>{e.name}</strong>
                <span className="muted small">{e.empCode}{e.designation ? ` · ${e.designation}` : ''}</span>
                {off && <span className="st st--off">{off}</span>}
              </div>
              <AttendanceEditor key={`${e.id}-${date}`} record={records[e.id]} onChange={(next) => save(e, next)} />
            </article>
          );
        })}
      </div>
    </HrHeader>
  );
}
