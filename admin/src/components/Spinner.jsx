import { useEffect, useState, useSyncExternalStore } from 'react';
import { subscribePending, getPending } from '../api';

// Red → green → blue ring, same colours as the logo.
export function Spinner({ size = 44 }) {
  return <span className="spinner" style={{ '--size': `${size}px` }} role="status" aria-label="Loading" />;
}

// Full-screen gradient spinner that shows whenever any request to the server is waiting for a reply.
// It appears after a very short delay so quick requests do not flash it.
export function GlobalSpinner() {
  const pending = useSyncExternalStore(subscribePending, getPending);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!pending) { setShow(false); return undefined; }
    const t = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(t);
  }, [pending]);
  if (!show) return null;
  return <div className="busy"><Spinner size={56} /></div>;
}
