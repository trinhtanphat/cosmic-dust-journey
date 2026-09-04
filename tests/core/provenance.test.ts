import test from 'node:test';
import assert from 'node:assert/strict';

test('provenance manifest is deterministic and URL-sorted', async () => {
  const provenance = await import('../../scripts/lib/provenance.mjs').catch(() => null);
  assert.ok(provenance, 'provenance module should exist');
  const manifest = provenance!.canonicalManifest([
    { url: 'https://b.test/z', status: 'unknown-rights' },
    { url: 'https://a.test/a', status: 'inspect-only' },
  ]);
  assert.deepEqual(
    manifest.entries.map((entry: { url: string }) => entry.url),
    ['https://a.test/a', 'https://b.test/z'],
  );
  assert.equal(manifest.version, 1);
});
