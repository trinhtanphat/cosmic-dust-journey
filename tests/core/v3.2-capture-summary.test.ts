import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import {
  readPngDimensions,
  validateCaptureEvidence,
  writeCaptureSummary,
  type CaptureManifest,
  type CaptureManifestEntry,
} from '../../scripts/write-capture-summary.ts';
import {
  captureRelativePath,
  v32CaptureCases,
  v32CaptureProfiles,
  type CaptureCase,
  type CaptureProfileId,
} from '../e2e/support/v3.2-capture-plan.ts';

function pngBuffer(width = 1280, height = 720, bytes = 4096) {
  const buffer = Buffer.alloc(bytes);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function manifestEntry(capture: CaptureCase, buffer: Buffer): CaptureManifestEntry {
  const dimensions = readPngDimensions(buffer);
  assert.ok(dimensions);
  return {
    id: capture.id,
    profile: capture.profile,
    kind: capture.kind,
    chapterId: capture.chapterId,
    ...(capture.nextChapterId ? { nextChapterId: capture.nextChapterId } : {}),
    reducedMotion: capture.reducedMotion,
    file: captureRelativePath(capture),
    width: dimensions.width,
    height: dimensions.height,
    viewportWidth: 1280,
    viewportHeight: 720,
    bytes: buffer.byteLength,
    sha256: createHash('sha256').update(buffer).digest('hex'),
  };
}

function createCompleteEvidence() {
  const root = mkdtempSync(join(tmpdir(), 'v32-captures-'));
  const entries = new Map<CaptureProfileId, CaptureManifestEntry[]>();
  for (const profile of v32CaptureProfiles) entries.set(profile, []);

  for (const capture of v32CaptureCases) {
    const buffer = pngBuffer();
    const relative = captureRelativePath(capture);
    const absolute = join(root, relative);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, buffer);
    entries.get(capture.profile)?.push(manifestEntry(capture, buffer));
  }

  for (const profile of v32CaptureProfiles) {
    writeManifest(root, profile, entries.get(profile) ?? []);
  }

  return { root, entries };
}

function writeManifest(root: string, profile: CaptureProfileId, captures: CaptureManifestEntry[]) {
  const manifest: CaptureManifest = { version: 1, profile, captures };
  const directory = join(root, profile);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

function withEvidence(run: (root: string, entries: Map<CaptureProfileId, CaptureManifestEntry[]>) => void) {
  const evidence = createCompleteEvidence();
  try {
    run(evidence.root, evidence.entries);
  } finally {
    rmSync(evidence.root, { recursive: true, force: true });
  }
}

test('complete V3.2 evidence validates and writes deterministic summaries', () => {
  withEvidence((root) => {
    const validated = validateCaptureEvidence(root);
    assert.equal(validated.passed, true);
    assert.equal(validated.expectedCount, 23);
    assert.equal(validated.observedCount, 23);
    assert.deepEqual(validated.errors, []);

    const written = writeCaptureSummary(root);
    assert.deepEqual(written, validated);
  });
});

test('missing capture or PNG file fails closed', () => {
  withEvidence((root, entries) => {
    const desktop = entries.get('desktop') ?? [];
    desktop.pop();
    writeManifest(root, 'desktop', desktop);
    const summary = validateCaptureEvidence(root);
    assert.equal(summary.passed, false);
    assert.ok(summary.errors.some((error) => error.includes('missing')));
  });
});

test('duplicate and unexpected capture IDs fail closed', () => {
  withEvidence((root, entries) => {
    const mobile = entries.get('mobile') ?? [];
    mobile.push({ ...mobile[0] });
    mobile[1] = { ...mobile[1], id: 'mobile-unexpected-capture' };
    writeManifest(root, 'mobile', mobile);
    const summary = validateCaptureEvidence(root);
    assert.equal(summary.passed, false);
    assert.ok(summary.errors.some((error) => error.includes('duplicate') || error.includes('unexpected')));
  });
});

test('wrong filename and path traversal are rejected', () => {
  withEvidence((root, entries) => {
    const desktop = entries.get('desktop') ?? [];
    desktop[0] = { ...desktop[0], file: 'desktop/wrong.png' };
    desktop[1] = { ...desktop[1], file: '../escape.png' };
    writeManifest(root, 'desktop', desktop);
    const summary = validateCaptureEvidence(root);
    assert.equal(summary.passed, false);
    assert.ok(summary.errors.some((error) => error.includes('file')));
  });
});

test('corrupt or truncated PNG evidence is rejected', () => {
  withEvidence((root) => {
    const capture = v32CaptureCases[0];
    writeFileSync(join(root, captureRelativePath(capture)), Buffer.alloc(24));
    const summary = validateCaptureEvidence(root);
    assert.equal(summary.passed, false);
    assert.ok(summary.errors.some((error) => error.includes('PNG')));
  });
});

test('byte count dimension and SHA mismatches are rejected', () => {
  withEvidence((root, entries) => {
    const desktop = entries.get('desktop') ?? [];
    desktop[0] = { ...desktop[0], bytes: desktop[0].bytes + 1 };
    desktop[1] = { ...desktop[1], width: desktop[1].width + 1 };
    desktop[2] = { ...desktop[2], sha256: '0'.repeat(64) };
    writeManifest(root, 'desktop', desktop);
    const summary = validateCaptureEvidence(root);
    assert.equal(summary.passed, false);
    assert.ok(summary.errors.some((error) => error.includes('byte')));
    assert.ok(summary.errors.some((error) => error.includes('dimension')));
    assert.ok(summary.errors.some((error) => error.includes('SHA')));
  });
});
