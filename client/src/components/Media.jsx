import { Link } from 'react-router-dom';

export const isVideo = (src = '') => /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i.test(src);

// Shows a photo or a video depending on the file the admin picked.
export function Media({ src, alt = '', className, loading = 'lazy' }) {
  if (!src) return null;
  if (isVideo(src)) {
    return <video className={className} src={src} autoPlay muted loop playsInline preload="metadata" aria-label={alt} />;
  }
  return <img className={className} src={src} alt={alt} loading={loading} />;
}

const EXTERNAL = /^(https?:|mailto:|tel:|\/\/)/i;

// Internal paths use the router; full URLs, mailto: and tel: become normal links.
export function SmartLink({ to = '/', children, ...rest }) {
  if (EXTERNAL.test(to)) {
    const web = /^(https?:|\/\/)/i.test(to);
    return (
      <a href={to} {...(web ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return <Link to={to} {...rest}>{children}</Link>;
}
