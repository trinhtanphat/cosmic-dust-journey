import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('GitHub Pages deploy builds Vite output instead of serving TSX source', () => {
  const workflowPath = '.github/workflows/deploy-pages.yml';
  assert.equal(existsSync(new URL(`../../${workflowPath}`, import.meta.url)), true, 'Pages workflow must exist');

  const workflow = read(workflowPath);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /path:\s*dist/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /Verify Pages artifact/);
  assert.match(workflow, /grep -q ['"]\/cosmic-dust-journey\/assets\/['"] dist\/index\.html/);
  assert.match(workflow, /! grep -q ['"]\/src\/main\.tsx['"] dist\/index\.html/);
  assert.match(workflow, /npm run test:core/);
  assert.ok(workflow.indexOf('npm run test:core') < workflow.indexOf('actions/upload-pages-artifact@v4'));
});

test('GitHub Pages build uses a repository base path while other hosts default to root', () => {
  const vite = read('vite.config.ts');
  const workflow = read('.github/workflows/deploy-pages.yml');

  assert.match(vite, /process\.env\.VITE_BASE_PATH\s*\?\?\s*['"]\/['"]/);
  assert.match(workflow, /VITE_BASE_PATH:\s*\/cosmic-dust-journey\//);
});

test('favicon is emitted from public and referenced through Vite BASE_URL', () => {
  const index = read('index.html');
  assert.match(index, /%BASE_URL%favicon\.svg/);
  assert.equal(existsSync(new URL('../../public/favicon.svg', import.meta.url)), true);
});
