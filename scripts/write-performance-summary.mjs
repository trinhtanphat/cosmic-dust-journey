import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { evaluateDiagnostics } from '../src/observability/diagnostics.ts';

const root = resolve(process.argv[2] ?? 'v2.1-diagnostics');
const projects = ['chromium-desktop', 'chromium-mobile'];
mkdirSync(root, { recursive: true });

const rows = [];
const details = [];
let hardFailure = false;

for (const project of projects) {
  const file = join(root, project, 'performance-diagnostics.json');
  if (!existsSync(file)) {
    hardFailure = true;
    rows.push(`| ${project} | FAIL | — | — | — |`);
    details.push(`## ${project}\n\n- FAIL: missing performance-diagnostics.json\n`);
    continue;
  }

  try {
    const snapshot = JSON.parse(readFileSync(file, 'utf8'));
    const report = evaluateDiagnostics(snapshot, project);
    if (report.status === 'fail') hardFailure = true;
    rows.push(
      `| ${project} | ${report.status.toUpperCase()} | ${snapshot.frameMs.p95} ms | ${Number(snapshot.frameMs.over50Percent).toFixed(2)}% | ${snapshot.longTasks.over1000} |`,
    );
    const lines = [`## ${project}`, ''];
    if (report.failures.length === 0 && report.warnings.length === 0) lines.push('- PASS: all evaluated budgets satisfied');
    for (const failure of report.failures) lines.push(`- FAIL: ${failure}`);
    for (const warning of report.warnings) lines.push(`- WARN: ${warning}`);
    details.push(`${lines.join('\n')}\n`);
  } catch (error) {
    hardFailure = true;
    const errorClass = error instanceof Error ? error.name : 'UnknownError';
    rows.push(`| ${project} | FAIL | — | — | — |`);
    details.push(`## ${project}\n\n- FAIL: unreadable diagnostics (${errorClass})\n`);
  }
}

const markdown = [
  '# V2.1 Performance Diagnostics',
  '',
  '| Project | Status | Frame p95 | Frames >50ms | Long tasks >1000ms |',
  '| --- | --- | ---: | ---: | ---: |',
  ...rows,
  '',
  ...details,
].join('\n');

writeFileSync(join(root, 'performance-summary.md'), `${markdown.trim()}\n`, 'utf8');
process.stdout.write(`${markdown.trim()}\n`);
if (hardFailure) process.exitCode = 1;
