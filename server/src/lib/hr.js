import { readJson, writeJson } from './store.js';

// ───────── Storage ─────────
export const getEmployees = () => readJson('employees.json', []);
export const saveEmployees = (list) => writeJson('employees.json', list);

// Attendance is one map: "employeeId|YYYY-MM-DD" -> record.
export const getAttendance = () => readJson('attendance.json', {});
export const saveAttendance = (map) => writeJson('attendance.json', map);

// Payroll adjustments: { "YYYY-MM": { employeeId: { bonus, deduction, note, paid, paidOn } } }
export const getPayroll = () => readJson('payroll.json', {});
export const savePayroll = (p) => writeJson('payroll.json', p);

export const DEFAULT_HR_SETTINGS = { unmarked: 'unpaid', holidays: [] };
export const getHrSettings = () => ({ ...DEFAULT_HR_SETTINGS, ...readJson('hr-settings.json', {}) });
export const saveHrSettings = (s) => writeJson('hr-settings.json', s);

// ───────── Dates (plain strings, no timezone surprises) ─────────
const pad = (n) => String(n).padStart(2, '0');
export const isMonth = (s) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s || '');
export const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const weekday = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();
export const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
};

export const STATUSES = ['present', 'absent', 'half', 'leave'];

const round2 = (n) => Math.round(n * 100) / 100;

// Everything the salary sheet needs for one month, calculated from the marked attendance.
export function computeMonth(month) {
  const [y, m] = month.split('-').map(Number);
  const total = daysInMonth(y, m);
  const today = todayStr();
  const monthEnd = `${month}-${pad(total)}`;
  const settings = getHrSettings();
  const holidays = new Set(settings.holidays.map((h) => h.date));
  const attendance = getAttendance();
  const payroll = getPayroll()[month] || {};

  const rows = [];
  for (const emp of getEmployees()) {
    if (emp.joiningDate && emp.joiningDate > monthEnd) continue;
    const hasRecords = Object.keys(attendance).some((k) => k.startsWith(`${emp.id}|${month}`));
    if (emp.status !== 'active' && !hasRecords) continue;

    const off = emp.weeklyOff || [];
    const c = { fullWorking: 0, working: 0, offDays: 0, present: 0, half: 0, absent: 0, paidLeaves: 0, unpaidLeaves: 0, pending: 0, upcoming: 0 };
    for (let d = 1; d <= total; d += 1) {
      const date = `${month}-${pad(d)}`;
      if (off.includes(weekday(y, m, d)) || holidays.has(date)) { c.offDays += 1; continue; }
      c.fullWorking += 1;
      if (emp.joiningDate && date < emp.joiningDate) continue;
      c.working += 1;
      const rec = attendance[`${emp.id}|${date}`];
      if (!rec) { if (date <= today) c.pending += 1; else c.upcoming += 1; continue; }
      if (rec.status === 'present') c.present += 1;
      else if (rec.status === 'half') c.half += 1;
      else if (rec.status === 'absent') c.absent += 1;
      else if (rec.status === 'leave') { if (rec.leaveType === 'paid') c.paidLeaves += 1; else c.unpaidLeaves += 1; }
    }

    // Paid leave is limited per month; anything above the quota is unpaid.
    const quota = Number(emp.paidLeavesPerMonth) || 0;
    const paidLeavesUsed = Math.min(c.paidLeaves, quota);
    const extraLeaves = c.paidLeaves - paidLeavesUsed;
    const pendingPaid = settings.unmarked === 'present' ? c.pending : 0;
    const salary = Number(emp.monthlySalary) || 0;
    const perDay = c.fullWorking ? salary / c.fullWorking : 0;
    const paidDays = c.present + c.half * 0.5 + paidLeavesUsed + pendingPaid;
    const earned = round2(perDay * paidDays);
    const adj = payroll[emp.id] || {};
    const bonus = Number(adj.bonus) || 0;
    const deduction = Number(adj.deduction) || 0;

    rows.push({
      employee: { id: emp.id, empCode: emp.empCode, name: emp.name, designation: emp.designation, status: emp.status },
      salary,
      ...c,
      paidLeavesUsed,
      unpaidLeaves: c.unpaidLeaves + extraLeaves,
      perDay: round2(perDay),
      paidDays,
      earned,
      bonus,
      deduction,
      adjustNote: adj.note || '',
      net: round2(earned + bonus - deduction),
      paid: Boolean(adj.paid),
      paidOn: adj.paidOn || '',
    });
  }
  const sum = (k) => round2(rows.reduce((a, r) => a + r[k], 0));
  return { month, unmarkedPolicy: settings.unmarked, rows, totals: { salary: sum('salary'), earned: sum('earned'), bonus: sum('bonus'), deduction: sum('deduction'), net: sum('net') } };
}
