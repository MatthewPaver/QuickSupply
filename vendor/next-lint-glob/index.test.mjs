import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
// Exercise the installed override that Next actually loads, including its dependencies.
const configPath = require.resolve('eslint-config-next', {
  paths: [join(__dirname, '../../apps/web'), join(__dirname, '../..')],
});
const pluginRequire = createRequire(createRequire(configPath).resolve('@next/eslint-plugin-next'));
const { globSync } = pluginRequire('fast-glob');

test('Next lint root discovery preserves literal, wildcard and absolute directories', () => {
  const root = mkdtempSync(join(tmpdir(), 'lint-root-'));
  try {
    mkdirSync(join(root, 'apps/web'), { recursive: true });
    mkdirSync(join(root, 'apps/admin'), { recursive: true });
    assert.deepEqual(globSync('apps/web', { cwd: root, onlyDirectories: true }), ['apps/web']);
    assert.deepEqual(globSync('apps/*', { cwd: root, onlyDirectories: true }).sort(), ['apps/admin', 'apps/web']);
    assert.deepEqual(globSync(join(root, 'apps/web'), { cwd: root, onlyDirectories: true }), [join(root, 'apps/web').replaceAll('\\', '/')]);
    assert.deepEqual(globSync('missing', { cwd: root, onlyDirectories: true }), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('pathological or non-string lint patterns are rejected before glob parsing', () => {
  assert.throws(() => globSync('{'.repeat(1025), {}), SyntaxError);
  assert.throws(() => globSync(['apps/*'], {}), SyntaxError);
});
