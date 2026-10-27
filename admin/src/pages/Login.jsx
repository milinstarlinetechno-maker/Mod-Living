import { useState } from 'react';
import { CalendarCheck, Eye, EyeOff, Globe, Inbox, Lock, LogIn, Mail, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useAdmin } from '../context';
import { useTheme } from '../theme';

const FEATURES = [
  { icon: Globe, text: 'Edit every page, photo, video and button of your website' },
  { icon: CalendarCheck, text: 'Attendance, leaves and salary for your whole team' },
  { icon: Inbox, text: 'Customer enquiries in one inbox, ready to follow up' },
];

export default function Login() {
  const { signIn } = useAdmin();
  const [theme, toggleTheme] = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth__brand">
        <img src="/uploads/logo-white-600.png" alt="MOD LIVING" className="auth__logo" />
        <div className="auth__pitch">
          <h2>Run your whole business from <em>one place.</em></h2>
          <p>The control room for MOD LIVING. Manage the website, your team and your customers without touching any code.</p>
          <ul className="auth__feats">
            {FEATURES.map(({ icon: Icon, text }) => <li key={text}><Icon size={18} />{text}</li>)}
          </ul>
        </div>
        <p className="auth__foot">© {new Date().getFullYear()} MOD LIVING · Style that hits home</p>
      </aside>

      <main className="auth__panel">
        <button type="button" className="icon-btn auth__theme" onClick={toggleTheme} aria-label="Toggle dark mode">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
        <form className="auth__box" onSubmit={submit}>
          <img src="/uploads/logo-600.png" alt="MOD LIVING" className="auth__mobile-logo" />
          <span className="auth__badge"><ShieldCheck size={14} /> Secure admin area</span>
          <h1>Welcome back</h1>
          <p>Sign in with your admin account to continue.</p>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <div className="input-icon"><Mail size={17} /><input id="email" type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-icon">
              <Lock size={17} />
              <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
          {error && <p className="alert" role="alert">{error}</p>}
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}><LogIn size={17} /> {busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="auth__note"><Lock size={13} /> Your connection and password are protected.</p>
        </form>
      </main>
    </div>
  );
}
