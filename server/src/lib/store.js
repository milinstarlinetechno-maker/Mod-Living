import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import { DATA_DIR } from './paths.js';

// Everything the admin saves (website content, leads, admin login, employees,
// attendance, payroll…) lives in MongoDB, one document per name in the
// "documents" collection: { _id: 'content.json', value: … }.
//
// Reads are served from an in-memory copy that is loaded at start-up, so the
// route code stays simple. Every write updates that copy and is saved to
// MongoDB; `flush()` waits until MongoDB has confirmed it (see index.js).

const cache = new Map();
let collection = null;
let client = null;
let queue = Promise.resolve();
let lastError = null;

export async function initStore() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/modliving';
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
  } catch (err) {
    throw new Error(`Cannot connect to MongoDB (${uri.replace(/\/\/.*@/, '//***@')}): ${err.message}\nSet MONGODB_URI in server/.env (MongoDB Atlas link or a local MongoDB).`);
  }
  collection = client.db(process.env.MONGODB_DB || undefined).collection('documents');

  const rows = await collection.find({}).toArray();
  for (const row of rows) cache.set(row._id, row.value);

  // One-time import of the old data/*.json files into MongoDB.
  let imported = 0;
  if (fs.existsSync(DATA_DIR)) {
    for (const file of fs.readdirSync(DATA_DIR)) {
      if (!file.endsWith('.json') || cache.has(file)) continue;
      try {
        const value = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
        cache.set(file, value);
        await collection.replaceOne({ _id: file }, { _id: file, value, updatedAt: new Date() }, { upsert: true });
        imported += 1;
      } catch {
        /* unreadable legacy file: ignore */
      }
    }
  }
  console.log(`[db] Connected to MongoDB (${client.db().databaseName})${imported ? ` — imported ${imported} existing data file(s)` : ''}`);
}

export function readJson(name, fallback) {
  return cache.has(name) ? structuredClone(cache.get(name)) : structuredClone(fallback);
}

export function writeJson(name, value) {
  const copy = structuredClone(value);
  cache.set(name, copy);
  queue = queue
    .then(() => collection.replaceOne({ _id: name }, { _id: name, value: copy, updatedAt: new Date() }, { upsert: true }))
    .then(() => { lastError = null; })
    .catch((err) => { lastError = err; console.error('[db] save failed:', err.message); });
}

// Resolves when every write so far is stored; rejects if the last one failed.
export async function flush() {
  await queue;
  if (lastError) throw lastError;
}

export async function closeStore() {
  await queue;
  await client?.close();
}

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Objects merge key by key (so newly added default fields show up);
// arrays and primitives from `stored` replace the defaults.
export function deepMerge(defaults, stored) {
  if (!isPlainObject(defaults) || !isPlainObject(stored)) return stored === undefined ? defaults : stored;
  const out = { ...defaults };
  for (const key of Object.keys(stored)) out[key] = key in defaults ? deepMerge(defaults[key], stored[key]) : stored[key];
  return out;
}
