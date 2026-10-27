import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Download, Printer, Undo2 } from 'lucide-react';
import { api } from '../../api';
import { useAdmin } from '../../context';
import { HrHeader, Stepper } from './Shared';
import { days, downloadCsv, money, monthLabel, monthOf, shiftMonth, todayStr } from './util';

// Number box that saves when you leave it.
function Adjust({ value, onSave, label }) {
  const [v, setV] = useState(String(value || ''));
  useEffect(() => setV(String(value || '')), [value]);
  return (
    <input type="number" min="0" className="mini-input" value={v} placeholder="0" aria-label={label} onChange={(e) => setV(e.target.value)} onBlur={() => Number(v || 0) !== Number(value || 0) && onSave(Number(v || 0))} />
  );
}

export default function Salary() {
  const { notify } = useAdmin();
  const [month, setMonth] = useState(() => monthOf(todayStr()));
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    api.getPayroll(month).then(setData).catch((e) => notify(e.message, 'error'));
  }, [month, notify]);
  useEffect(() => { setData(null); load(); }, [load]);

  const update = async (id, body) => {
    try {
      setData(await api.savePayroll(month, id, body));
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const rows = data?.rows || [];
  const pending = rows.reduce((a, r) => a + r.pending, 0);

  const exportCsv = () => downloadCsv(`salary-${month}.csv`, [
    ['Employee no.', 'Name', 'Monthly salary', 'Working days', 'Present', 'Half days', 'Absent', 'Paid leave', 'Unpaid leave', 'Not marked', 'Paid days', 'Per day', 'Earned', 'Bonus', 'Deduction', 'Net salary', 'Note', 'Paid'],
    ...rows.map((r) => [r.employee.empCode, r.employee.name, r.salary, r.fullWorking, r.present, r.half, r.absent, r.paidLeavesUsed, r.unpaidLeaves, r.pending, r.paidDays, r.perDay, r.earned, r.bonus, r.deduction, r.net, r.adjustNote, r.paid ? `Paid ${r.paidOn}` : 'Pending']),
  ]);

  return (
    <HrHeader title="Salary" description="Salary is worked out automatically from the attendance you marked. Add bonus or deductions (advance, fine) if needed.">
      <div className="toolbar">
        <Stepper type="month" value={month} onChange={setMonth} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} label="Month" />
        <div className="row">
          <button type="button" className="btn" onClick={exportCsv} disabled={!rows.length}><Download size={16} /> Export CSV</button>
          <button type="button" className="btn" onClick={() => window.print()} disabled={!rows.length}><Printer size={16} /> Print</button>
        </div>
      </div>
      <h2 className="print-title">Salary sheet — {monthLabel(month)}</h2>
      {data && pending > 0 && (
        <p className="alert alert--warn" role="status">
          <AlertTriangle size={16} /> {pending} working day{pending > 1 ? 's are' : ' is'} not marked yet. {data.unmarkedPolicy === 'present' ? 'They are counted as present.' : 'They are counted as unpaid until you mark them.'} (Change this rule in Holidays & Rules.)
        </p>
      )}
      {!data && <p className="muted">Loading…</p>}
      {data && rows.length === 0 && <div className="card empty-state"><p><strong>No employees for {monthLabel(month)}.</strong></p><p className="muted">Add employees first, then mark their attendance.</p></div>}
      {rows.length > 0 && (
        <>
          <div className="stats stats--sm">
            <div className="stat"><small>Total monthly salary</small><strong>{money(data.totals.salary)}</strong></div>
            <div className="stat"><small>Earned as per attendance</small><strong>{money(data.totals.earned)}</strong></div>
            <div className="stat"><small>Bonus − Deductions</small><strong>{money(data.totals.bonus - data.totals.deduction)}</strong></div>
            <div className="stat stat--accent"><small>Net payable</small><strong>{money(data.totals.net)}</strong></div>
          </div>
          <div className="table-wrap card card--flush">
            <table className="table table--salary">
              <thead>
                <tr>
                  <th className="sticky">Employee</th><th className="num">Salary</th><th className="num">Per day</th>
                  <th className="num" title="Working days in the month">Work days</th><th className="num">Present</th><th className="num">Half</th><th className="num">Absent</th>
                  <th className="num" title="Paid leave used / unpaid leave">Leave (paid/unpaid)</th><th className="num">Not marked</th>
                  <th className="num">Paid days</th><th className="num">Earned</th><th className="num">Bonus</th><th className="num">Deduction</th><th className="num">Net salary</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employee.id}>
                    <td className="sticky"><strong>{r.employee.name}</strong><small>{r.employee.empCode}</small></td>
                    <td className="num">{money(r.salary)}</td>
                    <td className="num">{money(r.perDay)}</td>
                    <td className="num">{r.fullWorking}</td>
                    <td className="num">{r.present}</td>
                    <td className="num">{r.half}</td>
                    <td className="num">{r.absent}</td>
                    <td className="num">{r.paidLeavesUsed} / {r.unpaidLeaves}</td>
                    <td className="num">{r.pending ? <span className="warn-text">{r.pending}</span> : 0}</td>
                    <td className="num">{days(r.paidDays)}</td>
                    <td className="num">{money(r.earned)}</td>
                    <td className="num"><Adjust value={r.bonus} label={`Bonus for ${r.employee.name}`} onSave={(bonus) => update(r.employee.id, { bonus })} /></td>
                    <td className="num"><Adjust value={r.deduction} label={`Deduction for ${r.employee.name}`} onSave={(deduction) => update(r.employee.id, { deduction })} /></td>
                    <td className="num net">{money(r.net)}</td>
                    <td>
                      {r.paid ? (
                        <button type="button" className="btn btn--small" onClick={() => update(r.employee.id, { paid: false })} title={`Paid on ${r.paidOn}`}><Undo2 size={13} /> Paid {r.paidOn.slice(5)}</button>
                      ) : (
                        <button type="button" className="btn btn--small btn--primary" onClick={() => update(r.employee.id, { paid: true })}><Check size={13} /> Mark paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td className="sticky">Total</td><td className="num">{money(data.totals.salary)}</td><td colSpan={7} /><td />
                  <td className="num">{money(data.totals.earned)}</td><td className="num">{money(data.totals.bonus)}</td><td className="num">{money(data.totals.deduction)}</td><td className="num net">{money(data.totals.net)}</td><td /></tr>
              </tfoot>
            </table>
          </div>
          <div className="card note">
            <strong>How it is calculated</strong>
            <p>Per-day salary = monthly salary ÷ working days of the month (weekly offs and holidays are not counted). Paid days = present + ½ per half day + paid leaves (up to the employee’s monthly paid-leave limit). Earned = per-day salary × paid days. Net = earned + bonus − deduction.</p>
          </div>
        </>
      )}
    </HrHeader>
  );
}
