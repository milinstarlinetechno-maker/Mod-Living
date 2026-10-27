// Red → green → blue ring, same gradient as the logo. Shown while the website waits for the server.
export default function Spinner({ size = 44, label = 'Loading' }) {
  return <span className="spinner" style={{ '--size': `${size}px` }} role="status" aria-label={label} />;
}
