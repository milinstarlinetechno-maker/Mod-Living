import crypto from 'node:crypto';
import { Router } from 'express';
import {
  STATUSES, computeMonth, getAttendance, getEmployees, getHrSettings, getPayroll, isDate, isMonth, saveAttendance, saveEmployees, saveHrSettings, savePayroll, todayStr,
} from '../lib/hr.js';

const router = Router();
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const num = (v, min = 0) => Math.max(min, Number(v) || 0);

// ───────── Employees ─────────
function readEmployee(body, existing = {}) {
  const off = Array.isArray(body.weeklyOff) ? body.weeklyOff.map(Number).filter((d) => d >= 0 && d <= 6) : existing.weeklyOff ?? [0];
  return {
    ...existing,
    empCode: str(body.empCode, 30) || existing.empCode,
    name: str(body.name, 120),
    phone: str(body.phone, 30),
    email: str(body.email, 120),
    designation: str(body.designation, 100),
    department: str(body.department, 100),
    joiningDate: isDate(body.joiningDate) ? body.joiningDate : '',
    address: str(body.address, 400),
    emergencyContact: str(body.emergencyContact, 120),
    idProof: str(body.idProof, 100),
    bankDetails: str(body.bankDetails, 300),
    monthlySalary: num(body.monthlySalary),
    paidLeavesPerMonth: num(body.paidLeavesPerMonth),
    weeklyOff: [...new Set(off)],
    status: body.status === 'inactive' ? 'inactive' : 'active',
    notes: str(body.notes, 600),
  };
}

const nextCode = (list) => {
  const max = list.reduce((m, e) => Math.max(m, Number(String(e.empCode).replace(/\D/g, '')) || 0), 0);
  return `EMP${String(max + 1).padStart(3, '0')}`;
};

router.get('/employees', (req, res) => res.json(getEmployees()));

router.post('/employees', (req, res) => {
  const list = getEmployees();
  const emp = readEmployee(req.body || {});
  if (emp.name.length < 2) return res.status(400).json({ error: 'Employee name is required.' });
  emp.empCode = emp.empCode || nextCode(list);
  if (list.some((e) => e.empCode.toLowerCase() === emp.empCode.toLowerCase())) return res.status(400).json({ error: `Employee number ${emp.empCode} already exists.` });
  emp.id = crypto.randomUUID();
  emp.createdAt = new Date().toISOString();
  saveEmployees([...list, emp]);
  res.status(201).json(emp);
});

router.put('/employees/:id', (req, res) => {
  const list = getEmployees();
  const i = list.findIndex((e) => e.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Employee not found.' });
  const emp = readEmployee(req.body || {}, list[i]);
  if (emp.name.length < 2) return res.status(400).json({ error: 'Employee name is required.' });
  if (list.some((e, n) => n !== i && e.empCode.toLowerCase() === emp.empCode.toLowerCase())) return res.status(400).json({ error: `Employee number ${emp.empCode} already exists.` });
  list[i] = emp;
  saveEmployees(list);
  res.json(emp);
});

// Deleting an employee also removes their attendance and salary notes.
router.delete('/employees/:id', (req, res) => {
  const { id } = req.params;
  saveEmployees(getEmployees().filter((e) => e.id !== id));
  const att = getAttendance();
  for (const k of Object.keys(att)) if (k.startsWith(`${id}|`)) delete att[k];
  saveAttendance(att);
  const pay = getPayroll();
  for (const m of Object.keys(pay)) delete pay[m][id];
  savePayroll(pay);
  res.json({ ok: true });
});

// ───────── Attendance ─────────
// ?month=YYYY-MM  or  ?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/attendance', (req, res) => {
  let from;
  let to;
  if (isMonth(req.query.month)) { from = `${req.query.month}-01`; to = `${req.query.month}-31`; }
  else if (isDate(req.query.from) && isDate(req.query.to)) { from = req.query.from; to = req.query.to; }
  else return res.status(400).json({ error: 'Give a month or a from/to range.' });
  res.json(Object.values(getAttendance()).filter((r) => r.date >= from && r.date <= to));
});

// Set (or clear, with an empty status) one employee's attendance for one day.
router.put('/attendance', (req, res) => {
  const b = req.body || {};
  if (!isDate(b.date)) return res.status(400).json({ error: 'Invalid date.' });
  if (!getEmployees().some((e) => e.id === b.employeeId)) return res.status(404).json({ error: 'Employee not found.' });
  const map = getAttendance();
  const key = `${b.employeeId}|${b.date}`;
  if (!b.status) {
    delete map[key];
    saveAttendance(map);
    return res.json({ ok: true, record: null });
  }
  if (!STATUSES.includes(b.status)) return res.status(400).json({ error: 'Invalid status.' });
  const record = {
    employeeId: b.employeeId,
    date: b.date,
    status: b.status,
    leaveType: b.status === 'leave' ? (b.leaveType === 'paid' ? 'paid' : 'unpaid') : '',
    category: b.status === 'leave' || b.status === 'absent' || b.status === 'half' ? str(b.category, 40) : '',
    reason: str(b.reason, 500),
    updatedAt: new Date().toISOString(),
  };
  map[key] = record;
  saveAttendance(map);
  res.json({ ok: true, record });
});

// Mark every active employee present for a day (only those not already marked, and not on their weekly off).
router.post('/attendance/mark-all-present', (req, res) => {
  const { date } = req.body || {};
  if (!isDate(date)) return res.status(400).json({ error: 'Invalid date.' });
  const holidays = new Set(getHrSettings().holidays.map((h) => h.date));
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  const map = getAttendance();
  let marked = 0;
  for (const e of getEmployees()) {
    const key = `${e.id}|${date}`;
    if (e.status !== 'active' || map[key] || holidays.has(date) || (e.weeklyOff || []).includes(dow)) continue;
    if (e.joiningDate && date < e.joiningDate) continue;
    map[key] = { employeeId: e.id, date, status: 'present', leaveType: '', category: '', reason: '', updatedAt: new Date().toISOString() };
    marked += 1;
  }
  saveAttendance(map);
  res.json({ ok: true, marked });
});

// ───────── Holidays & settings ─────────
router.get('/settings', (req, res) => res.json(getHrSettings()));

router.put('/settings', (req, res) => {
  const b = req.body || {};
  const holidays = (Array.isArray(b.holidays) ? b.holidays : [])
    .filter((h) => isDate(h?.date))
    .map((h) => ({ date: h.date, name: str(h.name, 100) }))
    .sort((a, c) => a.date.localeCompare(c.date));
  const settings = { unmarked: b.unmarked === 'present' ? 'present' : 'unpaid', holidays };
  saveHrSettings(settings);
  res.json(settings);
});

// ───────── Payroll ─────────
router.get('/payroll', (req, res) => {
  const month = isMonth(req.query.month) ? req.query.month : todayStr().slice(0, 7);
  res.json(computeMonth(month));
});

router.put('/payroll/:month/:employeeId', (req, res) => {
  const { month, employeeId } = req.params;
  if (!isMonth(month) || !getEmployees().some((e) => e.id === employeeId)) return res.status(404).json({ error: 'Not found.' });
  const all = getPayroll();
  const cur = (all[month] ||= {});
  const prev = cur[employeeId] || {};
  const b = req.body || {};
  const paid = 'paid' in b ? Boolean(b.paid) : Boolean(prev.paid);
  cur[employeeId] = {
    bonus: 'bonus' in b ? num(b.bonus) : prev.bonus || 0,
    deduction: 'deduction' in b ? num(b.deduction) : prev.deduction || 0,
    note: 'note' in b ? str(b.note, 300) : prev.note || '',
    paid,
    paidOn: paid ? prev.paidOn || todayStr() : '',
  };
  savePayroll(all);
  res.json(computeMonth(month));
});

export default router;
