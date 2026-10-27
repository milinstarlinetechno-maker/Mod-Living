import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getContent } from '../lib/content.js';
import { readJson, writeJson } from '../lib/store.js';

const router = Router();

router.get('/content', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(getContent());
});

const leadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try later.' },
});

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

router.post('/leads', leadLimiter, (req, res) => {
  const b = req.body || {};
  const lead = {
    id: crypto.randomUUID(),
    name: clean(b.name, 120),
    phone: clean(b.phone, 30),
    city: clean(b.city, 120),
    category: clean(b.category, 120),
    message: clean(b.message, 2000),
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  if (lead.name.length < 2 || lead.phone.replace(/\D/g, '').length < 8) {
    return res.status(400).json({ error: 'Name and a valid phone are required.' });
  }
  const leads = readJson('leads.json', []);
  leads.unshift(lead);
  writeJson('leads.json', leads);
  res.status(201).json({ ok: true });
});

export default router;
