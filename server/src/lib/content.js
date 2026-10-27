import { defaultContent } from '../defaultContent.js';
import { deepMerge, readJson, writeJson } from './store.js';

export const CONTENT_KEYS = Object.keys(defaultContent);

export function getContent() {
  return deepMerge(structuredClone(defaultContent), readJson('content.json', {}));
}

export function saveSection(key, value) {
  const stored = readJson('content.json', {});
  stored[key] = value;
  writeJson('content.json', stored);
  return getContent();
}

export function resetContent() {
  writeJson('content.json', {});
  return getContent();
}
