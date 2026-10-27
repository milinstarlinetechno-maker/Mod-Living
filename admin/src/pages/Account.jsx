import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Database, Inbox, KeyRound, Image as ImageIcon, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { api, setToken } from '../api';
import { useAdmin } from '../context';

// 0-4 score from length and character variety.
function strength(pw) {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return { score, label: ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][score] };
}

export default function Account() {
  const { email, setEmail, setContent, content, notify } = useAdmin();
  const [form, setForm] = useState({ currentPassword: '', newEmail: email, newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pw = useMemo(() => strength(form.newPassword), [form.newPassword]);

  useEffect(() => {
    Promise.allSettled([api.listEmployees(), api.listLeads(), api.listMedia()]).then(([emp, leads, media]) => setCounts({
      employees: emp.value?.length, leads: leads.value?.length, media: media.value?.length,
    }));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirm) return notify('The new passwords do not match.', 'error');
    setBusy(true);
    try {
      const res = await api.updateAccount({ currentPassword: form.currentPassword, newPassword: form.newPassword, newEmail: form.newEmail !== email ? form.newEmail : '' });
      setToken(res.token);
      setEmail(res.email);
      setForm({ currentPassword: '', newEmail: res.email, newPassword: '', confirm: '' });
      notify('Account updated. Other devices were signed out.');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset ALL website content (texts, menus, projects, settings) to the original defaults? Uploaded files, leads and attendance are kept. This cannot be undone.')) return;
    try {
      setContent(await api.resetContent());
      notify('Website content reset to defaults.');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const tips = [
    { ok: form.newPassword.length >= 8, text: 'At least 8 characters' },
    { ok: /[a-z]/.test(form.newPassword) && /[A-Z]/.test(form.newPassword), text: 'Upper and lower case letters' },
    { ok: /\d/.test(form.newPassword) && /[^A-Za-z0-9]/.test(form.newPassword), text: 'A number and a symbol' },
  ];
  const stats = [
    { icon: Users, label: 'Employees', value: counts.employees },
    { icon: Inbox, label: 'Enquiries', value: counts.leads },
    { icon: ImageIcon, label: 'Media files', value: counts.media },
    { icon: Database, label: 'Projects', value: content.projects.length },
  ];

  return (
    <>
      <div className="page-head">
        <h1>Account</h1>
        <p>Manage your login details and keep the admin area secure.</p>
      </div>
      <div className="account">
        <div className="stack">
          <form className="card account__form" onSubmit={submit}>
            <header className="card__head"><span className="card__title"><KeyRound size={18} /> Login details</span></header>
            <div className="field"><label htmlFor="ne">Login email</label><input id="ne" type="email" value={form.newEmail} onChange={set('newEmail')} autoComplete="username" required /></div>
            <div className="field--row">
              <div className="field">
                <label htmlFor="np">New password</label>
                <input id="np" type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" minLength={8} placeholder="Leave empty to keep current" />
              </div>
              <div className="field"><label htmlFor="cp">Confirm new password</label><input id="cp" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></div>
            </div>
            {form.newPassword && (
              <div className="strength" aria-live="polite">
                <div className="strength__bar">{[1, 2, 3, 4].map((n) => <i key={n} className={pw.score >= n ? `on s${pw.score}` : ''} />)}</div>
                <span>{pw.label}</span>
              </div>
            )}
            <div className="field"><label htmlFor="cur">Current password <span className="muted">(required to save)</span></label><input id="cur" type="password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" required /></div>
            <button type="submit" className="btn btn--primary" disabled={busy}><KeyRound size={16} /> {busy ? 'Saving…' : 'Update account'}</button>
          </form>

          <section className="card danger-zone">
            <header className="card__head"><span className="card__title"><RotateCcw size={18} /> Reset website content</span></header>
            <p className="muted">Puts all texts, menus, pages and projects back to the original defaults. Uploaded files, leads and attendance are not touched.</p>
            <button type="button" className="btn btn--danger" onClick={reset}><RotateCcw size={16} /> Reset content</button>
          </section>
        </div>

        <aside className="stack">
          <section className="card profile">
            <span className="avatar avatar--lg">{(email || 'A')[0]}</span>
            <div>
              <strong>Administrator</strong>
              <p className="muted">{email}</p>
            </div>
            <div className="profile__tags">
              <span className="st st--present">Full access</span>
              <span className="st st--leave">Session: 12 hours</span>
            </div>
          </section>

          <section className="card">
            <header className="card__head"><span className="card__title"><ShieldCheck size={18} /> Strong password checklist</span></header>
            <ul className="checks">
              {tips.map((t) => <li key={t.text} className={t.ok ? 'is-ok' : ''}>{t.ok ? <CheckCircle2 size={16} /> : <Circle size={16} />}{t.text}</li>)}
            </ul>
            <p className="help">Changing your email or password signs out every other device. Never share these details with anyone.</p>
          </section>

          <section className="card">
            <header className="card__head"><span className="card__title"><Database size={18} /> Your data</span></header>
            <div className="data-grid">
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label}><Icon size={16} /><strong>{value ?? '—'}</strong><span>{label}</span></div>
              ))}
            </div>
            <p className="help">Stored on your server in <code>server/data</code> and <code>server/uploads</code>. Take regular backups of these folders.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
