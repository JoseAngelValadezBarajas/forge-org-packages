import assert from 'node:assert/strict';
import test from 'node:test';

import { comparePublicSurface } from './public-compatibility.mjs';

const baseline = {
  name: '@corefoundry-labs/forge-ui',
  exports: {
    '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    './styles.css': { types: './dist/styles.css.d.ts', default: './dist/styles.css' },
    './package.json': './package.json',
  },
  runtimeExports: ['Button', 'TextInput', 'Input'],
  typeExports: ['ButtonProps', 'TextInputProps', 'InputProps'],
  aliases: { Input: 'TextInput', InputProps: 'TextInputProps' },
  peerDependencies: { react: '^19.0.0' },
  cssVariables: { '--forge-accent': '#d8874d' },
  tokenValues: { 'semantic.dark.accent': '#d8874d' },
};

test('public surface comparison detects removed V1 exports, aliases, CSS tokens and token contracts', () => {
  const candidate = structuredClone(baseline);
  delete candidate.exports['./styles.css'];
  candidate.runtimeExports = ['Button', 'TextInput'];
  candidate.typeExports = ['ButtonProps', 'TextInputProps'];
  candidate.aliases = {};
  candidate.cssVariables = {};
  candidate.tokenValues = {};

  const failures = comparePublicSurface(baseline, candidate);

  assert.ok(failures.some((failure) => failure.includes('./styles.css')));
  assert.ok(failures.some((failure) => failure.includes('runtime export Input')));
  assert.ok(failures.some((failure) => failure.includes('type export InputProps')));
  assert.ok(failures.some((failure) => failure.includes('alias Input')));
  assert.ok(failures.some((failure) => failure.includes('--forge-accent')));
  assert.ok(failures.some((failure) => failure.includes('semantic.dark.accent')));
});

test('public surface comparison rejects a newly required peer dependency', () => {
  const candidate = structuredClone(baseline);
  candidate.peerDependencies['react-dom'] = '^19.0.0';

  const failures = comparePublicSurface(baseline, candidate);

  assert.ok(failures.some((failure) => failure.includes('peer dependency contract react-dom was added')));
});
