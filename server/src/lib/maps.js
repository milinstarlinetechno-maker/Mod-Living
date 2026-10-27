// Turns whatever the admin pastes from Google Maps (share link, short link, address bar URL,
// the <iframe> embed code, or just an address) into:
//   embed      – a URL that can be shown inside an <iframe> on the website
//   directions – a link that opens Google Maps (app on phones) and starts the route

const SHORT_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl', 'g.co']);
const dec = (s) => {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
};

async function expand(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (!SHORT_HOSTS.has(u.hostname)) return url;
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'Mozilla/5.0' } });
    const final = new URL(res.url);
    // Google may route through a consent page that keeps the real address in `continue`.
    return final.searchParams.get('continue') || res.url;
  } catch {
    return url;
  }
}

function coordinates(text) {
  const m = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || text.match(/[?&](?:q|ll|query|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (m) return `${m[1]},${m[2]}`;
  const e = text.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/); // embed links list longitude first
  return e ? `${e[2]},${e[1]}` : '';
}

function placeName(url) {
  const place = url.match(/\/maps\/place\/([^/@?]+)/);
  if (place) return dec(place[1]);
  const q = url.match(/[?&](?:q|query|destination)=([^&]+)/);
  return q ? dec(q[1]) : '';
}

const embedOf = (q) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
const directionsOf = (q) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;

export async function resolveMap(input, fallbackAddress = '') {
  let raw = String(input || '').trim();
  if (!raw) return { embed: '', directions: '' };

  const iframe = raw.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframe) raw = iframe[1].replace(/&amp;/g, '&');

  // Plain text (an address) instead of a link.
  if (!/^https?:\/\//i.test(raw)) return { embed: embedOf(raw), directions: directionsOf(raw) };

  const url = await expand(raw);
  const coords = coordinates(url);
  const name = placeName(url);
  const query = coords || name || fallbackAddress;
  const isEmbedUrl = /\/maps\/embed/.test(url);

  return {
    embed: isEmbedUrl ? url : query ? embedOf(query) : '',
    directions: query ? directionsOf(coords && name ? `${name} ${coords}` : query) : raw,
  };
}
