#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { extractReference } from './lib/reference-parser.mjs';
import { canonicalManifest, stableJson } from './lib/provenance.mjs';

const defaults = ['https://ten-billion-years.vercel.app/', 'https://dust.blue/'];
const requested = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const urls = requested.length ? requested : (process.env.REFERENCE_URLS?.split(',').map((value) => value.trim()).filter(Boolean) ?? defaults);
const outputPath = resolve(process.cwd(), 'public/generated/reference-content.json');
const provenancePath = resolve(process.cwd(), 'public/generated/provenance.json');
const timeoutMs = Number(process.env.CRAWL_TIMEOUT_MS ?? 12000);
const deterministicNow = process.env.SOURCE_DATE_EPOCH
  ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
  : new Date().toISOString();

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'cosmic-dust-journey/0.1 (+public metadata inspection)' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { html: await response.text(), finalUrl: response.url, contentType: response.headers.get('content-type') ?? '' };
  } finally {
    clearTimeout(timer);
  }
}

const sources = [];
const errors = [];
const entries = [];
for (const url of urls) {
  try {
    const fetched = await fetchText(url);
    const parsed = extractReference(fetched.html, fetched.finalUrl);
    sources.push({ ...parsed, requestedUrl: url, contentType: fetched.contentType });
    for (const assetUrl of parsed.assetUrls) entries.push({ url: assetUrl, sourcePage: fetched.finalUrl, status: 'unknown-rights' });
    for (const inspectUrl of parsed.inspectOnlyUrls) entries.push({ url: inspectUrl, sourcePage: fetched.finalUrl, status: 'inspect-only' });
  } catch (error) {
    errors.push({ url, error: error instanceof Error ? error.message : String(error) });
  }
}

sources.sort((a, b) => a.requestedUrl.localeCompare(b.requestedUrl));
errors.sort((a, b) => a.url.localeCompare(b.url));
const result = {
  schemaVersion: 1,
  retrievedAt: deterministicNow,
  cleanRoomNotice: 'Public text/metadata inspection only. Proprietary JavaScript is never converted into project source.',
  sources,
  retrievalErrors: errors,
};
const manifest = canonicalManifest(entries, { retrievedAt: deterministicNow, sourceCount: sources.length });
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, stableJson(result), 'utf8');
await writeFile(provenancePath, stableJson(manifest), 'utf8');
console.log(`Wrote ${sources.length} source snapshot(s) to ${outputPath}`);
console.log(`Catalogued ${manifest.entries.length} public URL(s) in ${provenancePath}`);
if (errors.length) {
  for (const item of errors) console.error(`Fetch failed: ${item.url}: ${item.error}`);
  process.exitCode = 1;
}
