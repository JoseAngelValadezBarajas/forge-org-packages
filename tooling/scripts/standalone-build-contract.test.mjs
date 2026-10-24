import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');

test('tokens build uses a generator contained in the standalone repository', () => {
  const buildScript = readFileSync(resolve(root, 'packages/tokens/scripts/build.mjs'), 'utf8');
  assert.equal(existsSync(resolve(root, 'packages/tokens/scripts/generate-tokens.mjs')), true);
  assert.doesNotMatch(buildScript, /tooling[\\/]scripts[\\/]generate-tokens\.mjs/);
});
