import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ensureAdmin } from './lib/auth.js';
import { flush, initStore } from './lib/store.js';
import { ADMIN_DIST, CLIENT_DIST, UPLOAD_DIR } from './lib/paths.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
try {
  await initStore();
} catch (err) {
  console.error(`[db] ${err.message}`);
  process.exit(1);
}
ensureAdmin();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: origins.length ? origins : false }));
app.use(express.json({ limit: '2mb' }));

// A save is only reported as successful once MongoDB has really stored it.
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  const send = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400) return send(body);
    flush().then(() => send(body), () => { res.status(500); send({ error: 'Could not save to the database. Please try again.' }); });
    return res;
  };
  next();
});

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// In production the built admin panel and website are served from this same server.
function serveSpa(mount, dist) {
  if (!fs.existsSync(path.join(dist, 'index.html'))) return;
  app.use(mount, express.static(dist, { index: false, maxAge: '1h' }));
  app.get(mount === '/' ? '*' : `${mount}/*`, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}
serveSpa('/admin', ADMIN_DIST);
serveSpa('/', CLIENT_DIST);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status && err.status < 500 ? err.message : 'Server error.' });
});

app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
