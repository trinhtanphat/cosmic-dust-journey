import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../../.github/workflows/v2-ci.yml', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
  scripts?: Record<string, string>;
};

test('V3.2 CI summarizes captures only after browser generation', () => {
  const browserIndex = workflow.indexOf('Browser and visual QA');
  const captureSummaryIndex = workflow.indexOf('Summarize V3.2 captures');
  assert.ok(browserIndex >= 0, 'browser QA step must remain present');
  assert.ok(captureSummaryIndex > browserIndex, 'capture summary must run after browser capture generation');
  assert.match(workflow, /- name: Summarize V3\.2 captures[\s\S]*?run: npm run capture:summary/);
  assert.equal(
    packageJson.scripts?.['capture:summary'],
    'node --experimental-strip-types scripts/write-capture-summary.ts v3.2-captures',
  );
});

test('V3.2 CI always uploads the dedicated capture artifact', () => {
  assert.match(
    workflow,
    /- name: Upload V3\.2 capture evidence\n\s+if: always\(\)\n\s+uses: actions\/upload-artifact@v4[\s\S]*?name: v3\.2-capture-quality[\s\S]*?path: v3\.2-captures/,
  );
});

test('existing diagnostics and Playwright evidence upload remain intact', () => {
  assert.match(workflow, /- name: Summarize V2\.1 diagnostics[\s\S]*?run: npm run diagnostics:summary/);
  assert.match(workflow, /name: v2-playwright-results/);
  assert.match(workflow, /v2\.1-diagnostics/);
  assert.match(workflow, /visual-checkpoints/);
  assert.match(workflow, /test-results/);
});
