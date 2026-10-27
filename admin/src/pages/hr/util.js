import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { useAdmin } from '../../context';

export const STATUS = {
  present: { label: 'Present', short: 'P' },
  absent: { label: 'Absent', short: 'A' },
  half: { label: 'Half day', short: 'H' },
  leave: { label: 'Leave', short: 'L' },
};
export const CATEGORIES = ['Sick', 'Casual', 'Family / Personal', 'Emergency', 'Travel', 'Other'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);
export const days = (n) => (Number.isInteger(n) ? n : n.toFixed(1));

const pad = (n) => String(n).padStart(2, '0');
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const monthOf = (date) => date.slice(0, 7);
export const shiftMonth = (month, by) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};
export const shiftDate = (date, by) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + by);
  return d.toISOString().slice(0, 10);
};
export const daysInMonth = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};
export const weekdayOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();
export const monthLabel = (month) => new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const dateLabel = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Returns why a day is not a working day for this employee ('' when it is a working day).
export const offReason = (emp, date, holidays) => {
  const h = holidays.find((x) => x.date === date);
  if (h) return `Holiday${h.name ? `: ${h.name}` : ''}`;
  return (emp.weeklyOff || []).includes(weekdayOf(date)) ? 'Weekly off' : '';
};

export function useEmployees() {
  const { notify } = useAdmin();
  const [employees, setEmployees] = useState(null);
  const reload = useCallback(() => api.listEmployees().then(setEmployees).catch((e) => notify(e.message, 'error')), [notify]);
  useEffect(() => { reload(); }, [reload]);
  return [employees, reload, setEmployees];
}

export function useHolidays() {
  const [settings, setSettings] = useState({ unmarked: 'unpaid', holidays: [] });
  useEffect(() => { api.getHrSettings().then(setSettings).catch(() => {}); }, []);
  return [settings, setSettings];
}

export const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export function downloadCsv(name, rows) {
  const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}
