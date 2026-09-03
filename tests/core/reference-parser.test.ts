import test from 'node:test';
import assert from 'node:assert/strict';

test('reference parser normalizes public text and asset URLs without treating JS bundles as reusable assets', async () => {
  const parser = await import('../../scripts/lib/reference-parser.mjs').catch(() => null);
  assert.ok(parser, 'parser module should exist');
  const html = `<!doctype html><html><head><title>Dust</title><meta name="description" content="A star story"></head><body><h1>Born from dust</h1><p>Cold hydrogen gathers.</p><button>Sound on</button><img src="/nebula.webp"><script src="/_next/static/chunk.js"></script></body></html>`;
  const parsed = parser!.extractReference(html, 'https://example.test/journey');
  assert.equal(parsed.title, 'Dust');
  assert.deepEqual(parsed.headings, ['Born from dust']);
  assert.deepEqual(parsed.paragraphs, ['Cold hydrogen gathers.']);
  assert.ok(parsed.assetUrls.includes('https://example.test/nebula.webp'));
  assert.ok(parsed.inspectOnlyUrls.includes('https://example.test/_next/static/chunk.js'));
  assert.ok(!parsed.assetUrls.includes('https://example.test/_next/static/chunk.js'));
});
