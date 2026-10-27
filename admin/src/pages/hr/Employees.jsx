import { useState } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../api';
import { useAdmin } from '../../context';
import { HrHeader } from './Shared';
import { WEEKDAYS, money, todayStr, useEmployees } from './util';

const EMPTY = {
  empCode: '', name: '', phone: '', email: '', designation: '', department: '', joiningDate: todayStr(), monthlySalary: '', paidLeavesPerMonth: 1,
  weeklyOff: [0], address: '', emergencyContact: '', idProof: '', bankDetails: '', notes: '', status: 'active',
};

function EmployeeForm({ employee, onClose, onSaved }) {
  const { notify } = useAdmin();
  const [v, setV] = useState({ ...EMPTY, ...employee });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));
  const toggleDay = (d) => setV((x) => ({ ...x, weeklyOff: x.weeklyOff.includes(d) ? x.weeklyOff.filter((n) => n !== d) : [...x.weeklyOff, d] }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (employee?.id) await api.updateEmployee(employee.id, v);
      else await api.createEmployee(v);
      notify(employee?.id ? 'Employee updated' : 'Employee added');
      onSaved();
    } catch (err) {
      notify(err.message, 'error');
      setBusy(false);
    }
  };

  const f = (k, label, props = {}, half = true) => (
    <div className={`field ${half ? 'field--half' : ''}`}>
      <label htmlFor={`e-${k}`}>{label}</label>
      <input id={`e-${k}`} value={v[k] ?? ''} onChange={set(k)} {...props} />
    </div>
  );

  return (
    <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal__box modal__box--form" onSubmit={submit}>
        <header className="modal__head">
          <h3>{employee?.id ? 'Edit employee' : 'Add employee'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="modal__body">
          <h4 className="sub">Basic details</h4>
          <div className="fields">
            {f('name', 'Full name *', { required: true, autoFocus: true })}
            {f('empCode', 'Employee number', { placeholder: 'Auto (EMP001…)' })}
            {f('phone', 'Phone number', { type: 'tel' })}
            {f('email', 'Email', { type: 'email' })}
            {f('designation', 'Designation / role')}
            {f('department', 'Department')}
            {f('joiningDate', 'Joining date', { type: 'date' })}
            <div className="field field--half">
              <label htmlFor="e-status">Status</label>
              <select id="e-status" value={v.status} onChange={set('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive (left / on hold)</option>
              </select>
            </div>
          </div>
          <h4 className="sub">Salary & leave rules</h4>
          <div className="fields">
            {f('monthlySalary', 'Monthly salary (₹) *', { type: 'number', min: 0, required: true })}
            {f('paidLeavesPerMonth', 'Paid leaves per month', { type: 'number', min: 0, step: 0.5 })}
            <div className="field">
              <label>Weekly off days</label>
              <div className="chips">
                {WEEKDAYS.map((d, i) => (
                  <button type="button" key={d} className={`chip ${v.weeklyOff.includes(i) ? 'is-on' : ''}`} onClick={() => toggleDay(i)} aria-pressed={v.weeklyOff.includes(i)}>{d}</button>
                ))}
              </div>
              <p className="help">These days are not counted as working days and are paid as part of the monthly salary.</p>
            </div>
          </div>
          <h4 className="sub">Other details</h4>
          <div className="fields">
            {f('emergencyContact', 'Emergency contact')}
            {f('idProof', 'ID proof (Aadhaar / PAN no.)')}
            <div className="field"><label htmlFor="e-address">Address</label><textarea id="e-address" rows={2} value={v.address} onChange={set('address')} /></div>
            <div className="field"><label htmlFor="e-bank">Bank details (for salary transfer)</label><textarea id="e-bank" rows={2} value={v.bankDetails} onChange={set('bankDetails')} /></div>
            <div className="field"><label htmlFor="e-notes">Notes</label><textarea id="e-notes" rows={2} value={v.notes} onChange={set('notes')} /></div>
          </div>
        </div>
        <footer className="modal__foot">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : employee?.id ? 'Save changes' : 'Add employee'}</button>
        </footer>
      </form>
    </div>
  );
}

export default function Employees() {
  const { notify } = useAdmin();
  const [employees, reload] = useEmployees();
  const [editing, setEditing] = useState(null); // null = closed, {} = new
  const [q, setQ] = useState('');
  const [show, setShow] = useState('active');

  const list = (employees || []).filter((e) => (show === 'all' || e.status === show) && `${e.name} ${e.empCode} ${e.phone} ${e.designation}`.toLowerCase().includes(q.toLowerCase()));

  const remove = async (e) => {
    if (!window.confirm(`Delete ${e.name}? Their attendance and salary records will be deleted too. To keep the history, set the status to Inactive instead.`)) return;
    try {
      await api.deleteEmployee(e.id);
      notify('Employee deleted');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <HrHeader title="Employees" description="Add your staff with their salary. Attendance and salary are calculated from this.">
      <div className="toolbar">
        <div className="row">
          <div className="search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, number, phone…" aria-label="Search employees" /></div>
          <div className="seg">
            {['active', 'inactive', 'all'].map((s) => <button type="button" key={s} className={show === s ? 'is-on' : ''} onClick={() => setShow(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}
          </div>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setEditing({})}><Plus size={16} /> Add employee</button>
      </div>
      {!employees && <p className="muted">Loading…</p>}
      {employees && list.length === 0 && (
        <div className="card empty-state">
          <p><strong>{employees.length ? 'No employees match.' : 'No employees yet.'}</strong></p>
          {!employees.length && <p className="muted">Click “Add employee” to add your first one.</p>}
        </div>
      )}
      {list.length > 0 && (
        <div className="table-wrap card card--flush">
          <table className="table">
            <thead><tr><th>No.</th><th>Name</th><th>Phone</th><th>Role</th><th>Joined</th><th className="num">Salary / month</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td>{e.empCode}</td>
                  <td><strong>{e.name}</strong>{e.email && <div className="muted small">{e.email}</div>}</td>
                  <td>{e.phone || '—'}</td>
                  <td>{e.designation || '—'}{e.department && <div className="muted small">{e.department}</div>}</td>
                  <td>{e.joiningDate || '—'}</td>
                  <td className="num">{money(e.monthlySalary)}</td>
                  <td><span className={`pill pill--${e.status === 'active' ? 'closed' : 'contacted'}`}>{e.status}</span></td>
                  <td className="actions">
                    <button type="button" className="icon-btn" onClick={() => setEditing(e)} aria-label={`Edit ${e.name}`}><Pencil size={16} /></button>
                    <button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(e)} aria-label={`Delete ${e.name}`}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <EmployeeForm employee={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </HrHeader>
  );
}
