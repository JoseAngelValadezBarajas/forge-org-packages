import assert from 'node:assert/strict';
import test from 'node:test';
import * as business from '../dist/theme-v2/theme-business/index.js';
import * as moduleApi from '../dist/theme-v2/theme-module/index.js';
import * as publicApi from '../dist/theme-v2/index.js';

test('theme business and module layers compose behind the unchanged public API', () => {
  for (const name of ['createTheme', 'generatePalette', 'validateTheme', 'contrastRatio']) {
    assert.equal(typeof business[name], 'function', `business.${name}`);
    assert.equal(moduleApi[name], business[name], `moduleApi.${name} reuses business.${name}`);
    assert.equal(publicApi[name], business[name], `publicApi.${name} re-exports business.${name}`);
  }

  for (const name of ['generateThemeCss', 'applyTheme']) {
    assert.equal(typeof moduleApi[name], 'function', `moduleApi.${name}`);
    assert.equal(publicApi[name], moduleApi[name], `publicApi.${name} re-exports moduleApi.${name}`);
  }

  assert.equal(moduleApi.presets, publicApi.presets);
});
