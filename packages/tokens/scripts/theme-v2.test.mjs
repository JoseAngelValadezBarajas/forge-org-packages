import assert from 'node:assert/strict';
import test from 'node:test';
import { createTheme, generatePalette, generateThemeCss, validateTheme, applyTheme, presets, contrastRatio } from '../dist/theme-v2/index.js';

test('themes are deterministic, seed-sensitive and have accessible semantic roles', () => {
  const config = { name: 'example', colors: { primary: '#008e83', secondary: '#75bba7', neutral: '#253330' }, mode: 'light' };
  const theme = createTheme(config);
  assert.deepEqual(theme, createTheme(config));
  assert.notDeepEqual(generatePalette('#008e83'), generatePalette('#3458bc'));
  assert.notEqual(theme.roles.primary, createTheme({ ...config, mode: 'dark' }).roles.primary);
  assert.ok(validateTheme(theme).valid);
  assert.match(generateThemeCss(theme, '.example'), /--cf-v2-primary:/);
  assert.throws(() => createTheme({ ...config, colors: { ...config.colors, primary: 'nope' } }), /color/i);
});

test('all presets and modes generate complete valid colors and contrast diagnostics', () => {
  for (const preset of Object.values(presets)) for (const mode of ['light', 'dark', 'high-contrast']) {
    const theme = createTheme({ ...preset, mode });
    assert.ok(validateTheme(theme).valid, `${preset.name} ${mode}`);
    for (const value of Object.values(theme.roles)) assert.match(value, /^#[0-9a-f]{6}$/i);
    for (const palette of Object.values(theme.palettes)) for (const value of Object.values(palette)) assert.match(value, /^#[0-9a-f]{6}$/i);
    assert.ok(contrastRatio(theme.roles.onPrimary, theme.roles.primary) >= 4.5);
  }
  const broken = createTheme(presets.neutral);
  broken.roles.onSurface = broken.roles.surface;
  assert.equal(validateTheme(broken).valid, false);
  assert.match(validateTheme(broken).errors.join(' '), /onSurface/);
  assert.throws(() => generateThemeCss(broken, '.example'), /invalid/i);
  assert.throws(() => generateThemeCss(createTheme(presets.neutral), 'body { color:red }'), /selector/i);
  assert.equal(validateTheme({ roles: {} }).valid, false);
  for (const seed of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff']) {
    const theme = createTheme({ name: 'edge', mode: 'light', colors: { primary: seed, secondary: seed, neutral: seed } });
    assert.ok(validateTheme(theme).valid, seed);
  }
  assert.throws(() => createTheme({ ...presets.neutral, mode: 'system' }), /mode/i);
  assert.throws(() => generatePalette('#1234'), /color/i);
});

test('themes can be applied to separate scopes without a document', () => {
  const variables = () => { const map = new Map(); return { map, setProperty: (key, value) => map.set(key, value) }; };
  const first = variables();
  const second = variables();
  applyTheme({ style: first }, createTheme(presets.forge));
  applyTheme({ style: second }, createTheme(presets.formiai));
  assert.notEqual(first.map.get('--cf-v2-primary'), second.map.get('--cf-v2-primary'));
});
