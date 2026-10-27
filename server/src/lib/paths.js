import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(here, '..', '..');
export const DATA_DIR = path.join(SERVER_ROOT, 'data');
export const UPLOAD_DIR = path.join(SERVER_ROOT, 'uploads');
export const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');
export const CLIENT_DIST = path.join(PROJECT_ROOT, 'client', 'dist');
export const ADMIN_DIST = path.join(PROJECT_ROOT, 'admin', 'dist');
