import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Spinner from '../components/Spinner';

const CACHE_KEY = 'modliving:content';
const ContentContext = createContext(null);

export const useContent = () => useContext(ContentContext);

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
};

// Everything the website shows (text, images, menus, pages on/off, the offer banner) comes
// from the admin panel through /api/content. A spinner is shown until the server answers, so
// visitors never see out-of-date text. The last copy is only a fallback if the server is down.
export function ContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    fetch('/api/content', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((data) => {
        setContent(data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          /* storage unavailable: skip caching */
        }
      })
      .catch(() => {
        const cached = readCache();
        if (cached) setContent((c) => c || cached);
        else setFailed(true);
      });
  }, []);

  useEffect(load, [load]);

  // Pick up admin changes when a visitor returns to an already open tab.
  const ready = content !== null;
  useEffect(() => {
    if (!ready) return undefined;
    const onShow = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [ready, load]);

  if (!content) {
    return (
      <div className="boot">
        {failed ? (
          <>
            <p>The website could not be loaded.</p>
            <button className="btn" onClick={load}>Try again</button>
          </>
        ) : (
          <Spinner size={52} />
        )}
      </div>
    );
  }
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}
