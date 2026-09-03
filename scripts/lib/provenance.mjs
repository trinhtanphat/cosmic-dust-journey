import { createHash } from 'node:crypto';

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function canonicalManifest(entries, metadata = {}) {
  const normalized = entries
    .map((entry) => ({ ...entry }))
    .sort((a, b) => String(a.url).localeCompare(String(b.url)));
  return { version: 1, ...metadata, entries: normalized };
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
