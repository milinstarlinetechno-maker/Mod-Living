import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { CONTENT_KEYS, getContent, resetContent, saveSection } from '../lib/content.js';
import { getAdmin, login, requireAdmin, updateAdmin } from '../lib/auth.js';
import { UPLOAD_DIR } from '../lib/paths.js';
import { readJson, writeJson } from '../lib/store.js';
import { resolveMap } from '../lib/maps.js';
import hrRoutes from './hr.js';

const router = Router();

// ───────── Login ─────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, (req, res) => {
  const token = login(req.body?.email, req.body?.password);
  if (!token) return res.status(401).json({ error: 'Wrong email or password.' });
  res.json({ token, email: getAdmin().email });
});

// Everything below needs a valid token.
router.use(requireAdmin);

router.get('/me', (req, res) => res.json(req.admin));

router.put('/account', (req, res) => {
  const result = updateAdmin(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

// ───────── Employees, attendance & salary ─────────
router.use('/hr', hrRoutes);

// ───────── Content ─────────
router.get('/content', (req, res) => res.json(getContent()));

router.post('/content/reset', (req, res) => res.json(resetContent()));

router.put('/content/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!CONTENT_KEYS.includes(key)) return res.status(404).json({ error: 'Unknown section.' });
    if (!req.body || !('value' in req.body)) return res.status(400).json({ error: 'Missing value.' });
    let { value } = req.body;
    // The pasted Google Maps link is converted once, here, into an embeddable map and a "start directions" link.
    if (key === 'site' && value && typeof value === 'object') {
      const previous = getContent().site;
      if (String(value.mapUrl || '').trim() !== String(previous.mapUrl || '').trim() || (value.mapUrl && !value.mapEmbed)) {
        const map = await resolveMap(value.mapUrl, value.address);
        value = { ...value, mapUrl: String(value.mapUrl || '').trim(), mapEmbed: map.embed, mapDirections: map.directions };
      }
    }
    res.json({ ok: true, content: saveSection(key, value) });
  } catch (err) {
    next(err);
  }
});

// ───────── Media library ─────────
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.ogv', '.mov', '.m4v']);
const isMedia = (name) => {
  const ext = path.extname(name).toLowerCase();
  return IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext);
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base =
        path
          .basename(file.originalname, path.extname(file.originalname))
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50) || 'file';
      cb(null, `${base}-${crypto.randomBytes(3).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => {
    if (isMedia(file.originalname)) return cb(null, true);
    cb(new Error('Only images (jpg, png, webp, gif, avif) and videos (mp4, webm, mov) are allowed.'));
  },
});

const describe = (name) => {
  const stat = fs.statSync(path.join(UPLOAD_DIR, name));
  const type = VIDEO_EXT.has(path.extname(name).toLowerCase()) ? 'video' : 'image';
  return { name, url: `/uploads/${name}`, type, size: stat.size, createdAt: stat.mtime.toISOString() };
};

router.get('/media', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR).filter(isMedia).map(describe);
  files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(files);
});

router.post('/media', (req, res) => {
  upload.array('files', 20)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json((req.files || []).map((f) => describe(f.filename)));
  });
});

router.delete('/media/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(UPLOAD_DIR, name);
  if (!isMedia(name) || !fs.existsSync(file)) return res.status(404).json({ error: 'File not found.' });
  fs.unlinkSync(file);
  res.json({ ok: true });
});

// ───────── Leads (contact form enquiries) ─────────
router.get('/leads', (req, res) => res.json(readJson('leads.json', [])));

router.patch('/leads/:id', (req, res) => {
  const leads = readJson('leads.json', []);
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  if (['new', 'contacted', 'closed'].includes(req.body?.status)) lead.status = req.body.status;
  writeJson('leads.json', leads);
  res.json(lead);
});

router.delete('/leads/:id', (req, res) => {
  writeJson('leads.json', readJson('leads.json', []).filter((l) => l.id !== req.params.id));
  res.json({ ok: true });
});

export default router;
