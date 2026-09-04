import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  captureRelativePath,
  v32CaptureCases,
  v32CaptureProfiles,
  type CaptureKind,
  type CaptureProfileId,
} from '../tests/e2e/support/v3.2-capture-plan.ts';

export interface CaptureManifestEntry {
  id: string;
  profile: CaptureProfileId;
  kind: CaptureKind;
  chapterId: string;
  nextChapterId?: string;
  reducedMotion: boolean;
  file: string;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  bytes: number;
  sha256: string;
}

export interface CaptureManifest {
  version: 1;
  profile: CaptureProfileId;
  captures: CaptureManifestEntry[];
}

export interface CaptureProfileSummary {
  profile: CaptureProfileId;
  expectedCount: number;
  observedCount: number;
  passed: boolean;
}

export interface CaptureSummary {
  passed: boolean;
  expectedCount: number;
  observedCount: number;
  profiles: CaptureProfileSummary[];
  errors: string[];
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MIN_CAPTURE_BYTES = 4096;

export function readPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.byteLength < 24 || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function readManifest(rootDir: string, profile: CaptureProfileId, errors: string[]): CaptureManifest | null {
  const manifestPath = join(rootDir, profile, 'manifest.json');
  if (!existsSync(manifestPath)) {
    errors.push(`missing manifest for profile ${profile}`);
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as Partial<CaptureManifest>;
    if (parsed.version !== 1 || parsed.profile !== profile || !Array.isArray(parsed.captures)) {
      errors.push(`invalid manifest shape for profile ${profile}`);
      return null;
    }
    return parsed as CaptureManifest;
  } catch {
    errors.push(`invalid manifest JSON for profile ${profile}`);
    return null;
  }
}

function pathStaysInside(rootDir: string, candidate: string): boolean {
  const root = resolve(rootDir);
  const target = resolve(root, candidate);
  return target.startsWith(`${root}${sep}`);
}

function validateEntry(rootDir: string, entry: CaptureManifestEntry, errors: string[]) {
  const planned = v32CaptureCases.find((capture) => capture.id === entry.id);
  if (!planned) {
    errors.push(`unexpected capture id ${entry.id}`);
    return;
  }

  if (entry.profile !== planned.profile) errors.push(`profile mismatch for ${entry.id}`);
  if (entry.kind !== planned.kind) errors.push(`kind mismatch for ${entry.id}`);
  if (entry.chapterId !== planned.chapterId) errors.push(`chapter mismatch for ${entry.id}`);
  if (entry.nextChapterId !== planned.nextChapterId) errors.push(`next chapter mismatch for ${entry.id}`);
  if (entry.reducedMotion !== planned.reducedMotion) errors.push(`reduced-motion mismatch for ${entry.id}`);

  const expectedFile = captureRelativePath(planned);
  if (entry.file !== expectedFile) errors.push(`file path mismatch for ${entry.id}: expected ${expectedFile}`);
  if (!pathStaysInside(rootDir, entry.file)) {
    errors.push(`unsafe file path for ${entry.id}`);
    return;
  }

  const absoluteFile = resolve(rootDir, entry.file);
  if (!existsSync(absoluteFile)) {
    errors.push(`missing PNG file for ${entry.id}`);
    return;
  }

  const buffer = readFileSync(absoluteFile);
  const dimensions = readPngDimensions(buffer);
  if (!dimensions || buffer.byteLength < MIN_CAPTURE_BYTES) {
    errors.push(`invalid PNG evidence for ${entry.id}`);
  }
  if (entry.bytes !== buffer.byteLength) errors.push(`byte count mismatch for ${entry.id}`);
  if (!dimensions || entry.width !== dimensions.width || entry.height !== dimensions.height) {
    errors.push(`dimension mismatch for ${entry.id}`);
  }
  if (!Number.isInteger(entry.viewportWidth) || entry.viewportWidth <= 0 || !Number.isInteger(entry.viewportHeight) || entry.viewportHeight <= 0) {
    errors.push(`invalid viewport dimensions for ${entry.id}`);
  }
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  if (entry.sha256 !== sha256) errors.push(`SHA mismatch for ${entry.id}`);
}

export function validateCaptureEvidence(rootDir: string): CaptureSummary {
  const root = resolve(rootDir);
  const errors: string[] = [];
  const entries: CaptureManifestEntry[] = [];
  const profileObserved = new Map<CaptureProfileId, number>();

  for (const profile of v32CaptureProfiles) {
    const manifest = readManifest(root, profile, errors);
    const captures = manifest?.captures ?? [];
    profileObserved.set(profile, captures.length);
    entries.push(...captures);
  }

  const counts = new Map<string, number>();
  for (const entry of entries) counts.set(entry.id, (counts.get(entry.id) ?? 0) + 1);
  for (const [id, count] of counts) {
    if (count > 1) errors.push(`duplicate capture id ${id}`);
  }

  const expectedIds = new Set(v32CaptureCases.map((capture) => capture.id));
  for (const entry of entries) {
    if (!expectedIds.has(entry.id)) errors.push(`unexpected capture id ${entry.id}`);
  }
  for (const capture of v32CaptureCases) {
    if (!counts.has(capture.id)) errors.push(`missing capture ${capture.id}`);
  }

  for (const entry of entries) validateEntry(root, entry, errors);

  const profiles = v32CaptureProfiles.map((profile) => {
    const expectedCount = v32CaptureCases.filter((capture) => capture.profile === profile).length;
    const observedCount = profileObserved.get(profile) ?? 0;
    const profileErrors = errors.filter((error) => error.includes(profile));
    return { profile, expectedCount, observedCount, passed: expectedCount === observedCount && profileErrors.length === 0 };
  });

  return {
    passed: errors.length === 0 && entries.length === v32CaptureCases.length,
    expectedCount: v32CaptureCases.length,
    observedCount: entries.length,
    profiles,
    errors,
  };
}

function summaryMarkdown(summary: CaptureSummary): string {
  const lines = [
    '# V3.2 Capture Quality Summary',
    '',
    `Status: **${summary.passed ? 'PASS' : 'FAIL'}**`,
    '',
    `Coverage: **${summary.observedCount}/${summary.expectedCount}** captures`,
    '',
    '| Profile | Observed | Expected | Status |',
    '| --- | ---: | ---: | --- |',
    ...summary.profiles.map(
      (profile) => `| ${profile.profile} | ${profile.observedCount} | ${profile.expectedCount} | ${profile.passed ? 'PASS' : 'FAIL'} |`,
    ),
    '',
    '## Structural errors',
    '',
    ...(summary.errors.length ? summary.errors.map((error) => `- ${error}`) : ['- None']),
    '',
    '> V3.2 validates capture integrity and exact coverage; it is not a perceptual pixel-diff baseline gate.',
    '',
  ];
  return lines.join('\n');
}

export function writeCaptureSummary(rootDir: string): CaptureSummary {
  const root = resolve(rootDir);
  mkdirSync(root, { recursive: true });
  const summary = validateCaptureEvidence(root);
  writeFileSync(join(root, 'capture-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(join(root, 'capture-summary.md'), summaryMarkdown(summary));
  return summary;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  const rootDir = process.argv[2] ?? 'v3.2-captures';
  const summary = writeCaptureSummary(rootDir);
  console.log(`V3.2 capture quality: ${summary.passed ? 'PASS' : 'FAIL'} (${summary.observedCount}/${summary.expectedCount})`);
  for (const error of summary.errors) console.error(`- ${error}`);
  if (!summary.passed) process.exitCode = 1;
}
