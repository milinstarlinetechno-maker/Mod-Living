const TOKEN_KEY = 'modliving:admin-token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

// How many requests are waiting for the server (drives the gradient spinner).
let pending = 0;
const listeners = new Set();
const setPending = (n) => { pending = n; listeners.forEach((l) => l()); };
export const getPending = () => pending;
export const subscribePending = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  let data;
  setPending(pending + 1);
  try {
    try {
      res = await fetch(`/api/admin${path}`, { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
    } catch {
      throw new Error('Cannot reach the server. Is it running?');
    }
    data = await res.json().catch(() => ({}));
  } finally {
    setPending(pending - 1);
  }
  if (res.status === 401 && path !== '/login') onUnauthorized();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  me: () => request('/me'),
  updateAccount: (body) => request('/account', { method: 'PUT', body }),
  getContent: () => request('/content'),
  saveSection: (key, value) => request(`/content/${key}`, { method: 'PUT', body: { value } }),
  resetContent: () => request('/content/reset', { method: 'POST' }),
  listMedia: () => request('/media'),
  uploadMedia: (files) => {
    const form = new FormData();
    [...files].forEach((f) => form.append('files', f));
    return request('/media', { method: 'POST', form });
  },
  deleteMedia: (name) => request(`/media/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  listLeads: () => request('/leads'),
  updateLead: (id, status) => request(`/leads/${id}`, { method: 'PATCH', body: { status } }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
  // Attendance module
  listEmployees: () => request('/hr/employees'),
  createEmployee: (body) => request('/hr/employees', { method: 'POST', body }),
  updateEmployee: (id, body) => request(`/hr/employees/${id}`, { method: 'PUT', body }),
  deleteEmployee: (id) => request(`/hr/employees/${id}`, { method: 'DELETE' }),
  getAttendance: (query) => request(`/hr/attendance?${new URLSearchParams(query)}`),
  setAttendance: (body) => request('/hr/attendance', { method: 'PUT', body }),
  markAllPresent: (date) => request('/hr/attendance/mark-all-present', { method: 'POST', body: { date } }),
  getHrSettings: () => request('/hr/settings'),
  saveHrSettings: (body) => request('/hr/settings', { method: 'PUT', body }),
  getPayroll: (month) => request(`/hr/payroll?month=${month}`),
  savePayroll: (month, id, body) => request(`/hr/payroll/${month}/${id}`, { method: 'PUT', body }),
};
