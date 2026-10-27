import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DATA_DIR } from './paths.js';
import { readJson, writeJson } from './store.js';

// The signing secret is kept in MongoDB (unless JWT_SECRET is set), so it survives restarts and redeploys.
function loadSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  let secret = readJson('secret.json', null);
  if (!secret) {
    try {
      secret = fs.readFileSync(path.join(DATA_DIR, '.secret'), 'utf8').trim();
    } catch {
      secret = '';
    }
    if (!secret) secret = crypto.randomBytes(48).toString('hex');
    writeJson('secret.json', secret);
  }
  return secret;
}

let SECRET;
const secret = () => (SECRET ||= loadSecret());
const TOKEN_TTL = '12h';

const sign = (admin) => jwt.sign({ sub: admin.email, v: admin.tokenVersion }, secret(), { expiresIn: TOKEN_TTL });

export function ensureAdmin() {
  const admin = readJson('admin.json', null);
  if (admin?.email) return;
  const email = (process.env.ADMIN_EMAIL || 'admin@modliving.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  writeJson('admin.json', { email, passwordHash: bcrypt.hashSync(password, 10), tokenVersion: 1 });
  console.log(`[admin] Created admin account: ${email}`);
  if (!process.env.ADMIN_PASSWORD) console.log('[admin] Using the default password "Admin@123" — change it after logging in.');
}

export function login(email, password) {
  const admin = readJson('admin.json', null);
  if (!admin) return null;
  const okEmail = String(email || '').trim().toLowerCase() === admin.email;
  // Always run the hash comparison so timing does not reveal whether the email exists.
  const okPass = bcrypt.compareSync(String(password || ''), admin.passwordHash);
  return okEmail && okPass ? sign(admin) : null;
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    const payload = jwt.verify(token, secret());
    const admin = readJson('admin.json', null);
    if (!admin || payload.v !== admin.tokenVersion) throw new Error('stale token');
    req.admin = { email: admin.email };
    next();
  } catch {
    res.status(401).json({ error: 'Please log in again.' });
  }
}

export function getAdmin() {
  const admin = readJson('admin.json', null);
  return admin ? { email: admin.email } : null;
}

// Changing credentials bumps tokenVersion, which signs out every other session.
export function updateAdmin({ currentPassword, newEmail, newPassword }) {
  const admin = readJson('admin.json', null);
  if (!admin || !bcrypt.compareSync(String(currentPassword || ''), admin.passwordHash)) return { error: 'Current password is wrong.' };
  if (newPassword) {
    if (String(newPassword).length < 8) return { error: 'New password must be at least 8 characters.' };
    admin.passwordHash = bcrypt.hashSync(String(newPassword), 10);
  }
  if (newEmail) {
    const email = String(newEmail).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email.' };
    admin.email = email;
  }
  admin.tokenVersion += 1;
  writeJson('admin.json', admin);
  return { token: sign(admin), email: admin.email };
}
