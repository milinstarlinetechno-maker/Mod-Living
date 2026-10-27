import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';

const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);

export function AdminProvider({ children }) {
  const [email, setEmail] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [content, setContent] = useState(null);
  const [toast, setToast] = useState(null);

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
    setContent(null);
  }, []);

  useEffect(() => { setUnauthorizedHandler(logout); }, [logout]);

  // Resume an existing session.
  useEffect(() => {
    if (!getToken()) return;
    api.me().then((m) => setEmail(m.email)).catch(() => setToken(null)).finally(() => setChecking(false));
  }, []);

  // Load the site content once logged in.
  useEffect(() => {
    if (email) api.getContent().then(setContent).catch((e) => notify(e.message, 'error'));
  }, [email]);

  const notify = useCallback((message, kind = 'ok') => {
    setToast({ message, kind, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const signIn = async (mail, password) => {
    const res = await api.login(mail, password);
    setToken(res.token);
    setEmail(res.email);
  };

  const value = useMemo(
    () => ({ email, setEmail, checking, content, setContent, toast, notify, signIn, logout }),
    [email, checking, content, toast, notify, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
