import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES, STATUS } from './util';

const TABS = [
  { to: '/attendance/daily', label: 'Daily Attendance' },
  { to: '/attendance/monthly', label: 'Monthly Sheet' },
  { to: '/attendance/salary', label: 'Salary' },
  { to: '/attendance/leaves', label: 'Leaves' },
  { to: '/attendance/employees', label: 'Employees' },
  { to: '/attendance/settings', label: 'Holidays & Rules' },
];

export function HrHeader({ title, description, children }) {
  return (
    <>
      <div className="page-head">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <nav className="tabs" aria-label="Attendance sections">
        {TABS.map((t) => <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'is-active' : '')}>{t.label}</NavLink>)}
      </nav>
      {children}
    </>
  );
}

// Previous / next stepper around a month or date input.
export function Stepper({ type, value, onChange, onPrev, onNext, label }) {
  return (
    <div className="stepper">
      <button type="button" className="icon-btn" onClick={onPrev} aria-label="Previous"><ChevronLeft size={18} /></button>
      <input type={type} value={value} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label={label} />
      <button type="button" className="icon-btn" onClick={onNext} aria-label="Next"><ChevronRight size={18} /></button>
    </div>
  );
}

export function StatusBadge({ status, leaveType }) {
  if (!status) return null;
  const text = status === 'leave' ? `${leaveType === 'paid' ? 'Paid' : 'Unpaid'} leave` : STATUS[status].label;
  return <span className={`st st--${status}`}>{text}</span>;
}

// Status buttons plus leave type / category / reason. `onChange` receives the full new record (or null to clear).
export function AttendanceEditor({ record, onChange, paidLeaveLeft }) {
  const [reason, setReason] = useState(record?.reason || '');
  const status = record?.status || '';
  const send = (patch) => onChange({ status, leaveType: record?.leaveType || 'paid', category: record?.category || '', reason, ...patch });
  const pick = (s) => (s === status ? onChange(null) : send({ status: s, leaveType: s === 'leave' ? record?.leaveType || 'paid' : '' }));
  const needsDetail = status === 'leave' || status === 'absent' || status === 'half';

  return (
    <div className="att">
      <div className="att__btns" role="group" aria-label="Attendance status">
        {Object.entries(STATUS).map(([key, s]) => (
          <button type="button" key={key} className={`att__btn att__btn--${key} ${status === key ? 'is-on' : ''}`} onClick={() => pick(key)} aria-pressed={status === key}>{s.label}</button>
        ))}
      </div>
      {needsDetail && (
        <div className="att__detail">
          {status === 'leave' && (
            <select value={record.leaveType || 'paid'} onChange={(e) => send({ leaveType: e.target.value })} aria-label="Leave type">
              <option value="paid">Paid leave</option>
              <option value="unpaid">Unpaid leave</option>
            </select>
          )}
          <select value={record.category || ''} onChange={(e) => send({ category: e.target.value })} aria-label="Reason type">
            <option value="">Reason type…</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input value={reason} placeholder="Why? (reason)" onChange={(e) => setReason(e.target.value)} onBlur={() => reason !== (record.reason || '') && send({ reason })} aria-label="Reason" />
          {status === 'leave' && record.leaveType === 'paid' && paidLeaveLeft === 0 && <p className="help att__warn">Paid leave quota is over for this month — this day will be unpaid.</p>}
        </div>
      )}
    </div>
  );
}
