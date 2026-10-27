import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '../../api';
import { useAdmin } from '../../context';
import { HrHeader, StatusBadge } from './Shared';
import { dateLabel, downloadCsv, todayStr, useEmployees } from './util';

export default function Leaves() {
  const { notify } = useAdmin();
  const [employees] = useEmployees();
  const [year, setYear] = useState(() => Number(todayStr().slice(0, 4)));
  const [empId, setEmpId] = useState('');
  const [kind, setKind] = useState('all');
  const [records, setRecords] = useState(null);

  useEffect(() => {
    setRecords(null);
    api.getAttendance({ from: `${year}-01-01`, to: `${year}-12-31` }).then(setRecords).catch((e) => notify(e.message, 'error'));
  }, [year, notify]);

  const byId = useMemo(() => Object.fromEntries((employees || []).map((e) => [e.id, e])), [employees]);
  const absences = useMemo(
    () => (records || []).filter((r) => r.status !== 'present' && byId[r.employeeId]).sort((a, b) => b.date.localeCompare(a.date)),
    [records, byId],
  );
  const list = absences.filter((r) => (!empId || r.employeeId === empId) && (kind === 'all' || (kind === 'paid' || kind === 'unpaid' ? r.status === 'leave' && r.leaveType === kind : r.status === kind)));

  // One summary row per employee for the year.
  const summary = (employees || []).map((e) => {
    const mine = absences.filter((r) => r.employeeId === e.id);
    const n = (fn) => mine.filter(fn).length;
    return { e, paid: n((r) => r.status === 'leave' && r.leaveType === 'paid'), unpaid: n((r) => r.status === 'leave' && r.leaveType === 'unpaid'), absent: n((r) => r.status === 'absent'), half: n((r) => r.status === 'half') };
  }).filter((s) => s.paid + s.unpaid + s.absent + s.half > 0 && (!empId || s.e.id === empId));

  const exportCsv = () => downloadCsv(`leaves-${year}.csv`, [
    ['Date', 'Employee no.', 'Name', 'Type', 'Reason type', 'Reason'],
    ...list.map((r) => [r.date, byId[r.employeeId].empCode, byId[r.employeeId].name, r.status === 'leave' ? `${r.leaveType} leave` : r.status, r.category, r.reason]),
  ]);

  return (
    <HrHeader title="Leaves & Absences" description="Who took leave, on which day and why. Reasons are entered while marking attendance.">
      <div className="toolbar">
        <div className="row">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year" className="select-auto">
            {Array.from({ length: 6 }, (_, i) => Number(todayStr().slice(0, 4)) + 1 - i).map((y) => <option key={y}>{y}</option>)}
          </select>
          <select value={empId} onChange={(e) => setEmpId(e.target.value)} aria-label="Employee" className="select-auto">
            <option value="">All employees</option>
            {(employees || []).map((e) => <option key={e.id} value={e.id}>{e.name} ({e.empCode})</option>)}
          </select>
          <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type" className="select-auto">
            <option value="all">All types</option>
            <option value="paid">Paid leave</option>
            <option value="unpaid">Unpaid leave</option>
            <option value="absent">Absent</option>
            <option value="half">Half day</option>
          </select>
        </div>
        <button type="button" className="btn" onClick={exportCsv} disabled={!list.length}><Download size={16} /> Export CSV</button>
      </div>

      {!records && <p className="muted">Loading…</p>}
      {records && summary.length > 0 && (
        <div className="table-wrap card card--flush spaced">
          <table className="table">
            <thead><tr><th>Employee</th><th className="num">Paid leave</th><th className="num">Unpaid leave</th><th className="num">Absent</th><th className="num">Half days</th><th className="num">Total days off</th></tr></thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.e.id}>
                  <td><strong>{s.e.name}</strong><div className="muted small">{s.e.empCode}</div></td>
                  <td className="num">{s.paid}</td><td className="num">{s.unpaid}</td><td className="num">{s.absent}</td><td className="num">{s.half}</td>
                  <td className="num"><strong>{s.paid + s.unpaid + s.absent + s.half * 0.5}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {records && list.length === 0 && <div className="card empty-state"><p><strong>No leaves or absences found.</strong></p></div>}
      {list.length > 0 && (
        <div className="table-wrap card card--flush">
          <table className="table">
            <thead><tr><th>Date</th><th>Employee</th><th>Type</th><th>Reason type</th><th>Reason</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={`${r.employeeId}|${r.date}`}>
                  <td>{dateLabel(r.date)}</td>
                  <td><strong>{byId[r.employeeId].name}</strong></td>
                  <td><StatusBadge status={r.status} leaveType={r.leaveType} /></td>
                  <td>{r.category || '—'}</td>
                  <td>{r.reason || <span className="muted">No reason given</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </HrHeader>
  );
}
