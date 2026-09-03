#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stableJson } from './lib/provenance.mjs';

const path = resolve(process.cwd(), 'public/generated/provenance.json');
const manifest = JSON.parse(await readFile(path, 'utf8'));
const timeoutMs = Number(process.env.CRAWL_TIMEOUT_MS ?? 8000);
let failures = 0;
for (const entry of manifest.entries ?? []) {
  if (entry.status === 'inspect-only') continue;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(entry.url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    entry.observed = {
      ok: response.ok,
      statusCode: response.status,
      mimeType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
    };
  } catch (error) {
    failures += 1;
    entry.observed = { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}
if (process.argv.includes('--write')) await writeFile(path, stableJson(manifest), 'utf8');
console.log(stableJson(manifest));
if (failures) process.exitCode = 1;
