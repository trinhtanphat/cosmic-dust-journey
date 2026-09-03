#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { canonicalManifest, stableJson } from './lib/provenance.mjs';

const inputPath = resolve(process.cwd(), 'public/generated/reference-content.json');
const outputPath = resolve(process.cwd(), 'public/generated/provenance.json');
const snapshot = JSON.parse(await readFile(inputPath, 'utf8'));
const entries = [];
for (const source of snapshot.sources ?? []) {
  for (const url of source.assetUrls ?? []) entries.push({ url, sourcePage: source.sourceUrl, status: 'unknown-rights' });
  for (const url of source.inspectOnlyUrls ?? []) entries.push({ url, sourcePage: source.sourceUrl, status: 'inspect-only' });
}
const unique = [...new Map(entries.map((entry) => [`${entry.status}:${entry.url}`, entry])).values()];
const manifest = canonicalManifest(unique, {
  retrievedAt: snapshot.retrievedAt ?? null,
  sourceCount: snapshot.sources?.length ?? 0,
});
await writeFile(outputPath, stableJson(manifest), 'utf8');
console.log(`Wrote ${manifest.entries.length} provenance entries.`);
