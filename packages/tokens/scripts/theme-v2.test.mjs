import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { createTheme, generatePalette, generateThemeCss, generateTokensCss, geometry, validateTheme, applyTheme, presets, contrastRatio } from '../dist/theme-v2/index.js';

const packageRoot = resolve(import.meta.dirname, '..');

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

const statefulFills = [
  ['actionPrimary', 'actionPrimaryHover', 'actionPrimaryPressed', 'onActionPrimary'],
  ['error', 'errorHover', 'errorPressed', 'onError'],
  ['surfaceContainer', 'surfaceContainerHover', 'surfaceContainerPressed', 'onSurface'],
];

function assertInteractionContract(theme, label) {
  for (const [rest, hover, pressed, on] of statefulFills) {
    for (const fill of [rest, hover, pressed]) {
      assert.ok(contrastRatio(theme.roles[on], theme.roles[fill]) >= 4.5, `${label}: ${on} on ${fill}`);
    }
    assert.ok(contrastRatio(theme.roles[hover], theme.roles[rest]) >= 1.1, `${label}: ${hover} from ${rest}`);
    assert.ok(contrastRatio(theme.roles[pressed], theme.roles[hover]) >= 1.1, `${label}: ${pressed} from ${hover}`);
  }
  for (const fill of ['actionPrimary', 'actionPrimaryHover', 'actionPrimaryPressed', 'error', 'errorHover', 'errorPressed']) {
    assert.ok(contrastRatio(theme.roles[fill], theme.roles.surface) >= 3, `${label}: ${fill} on surface`);
  }
  for (const fill of ['surfaceContainer', 'surfaceContainerHover', 'surfaceContainerPressed']) {
    assert.ok(contrastRatio(theme.roles.outline, theme.roles[fill]) >= 3, `${label}: outline on ${fill}`);
  }
}

test('status roles carry a foreground and read as text on neutral containers', () => {
  for (const preset of Object.values(presets)) for (const mode of ['light', 'dark', 'high-contrast']) {
    const { roles } = createTheme({ ...preset, mode });
    const label = `${preset.name} ${mode}`;
    for (const [fill, on] of [['success', 'onSuccess'], ['warning', 'onWarning'], ['info', 'onInfo']]) {
      assert.ok(contrastRatio(roles[on], roles[fill]) >= 4.5, `${label}: ${on} on ${fill}`);
    }
    for (const tone of ['actionPrimary', 'error', 'warning', 'success', 'info']) {
      assert.ok(contrastRatio(roles[tone], roles.surfaceContainer) >= 4.5, `${label}: ${tone} on surfaceContainer`);
    }
  }
});

test('interaction roles keep their contrast contract in every preset and mode', () => {
  for (const preset of Object.values(presets)) for (const mode of ['light', 'dark', 'high-contrast']) {
    assertInteractionContract(createTheme({ ...preset, mode }), `${preset.name} ${mode}`);
  }
});

test('interaction roles hold for arbitrary seeds', () => {
  let state = 20261104;
  const seed = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return `#${Math.floor(state / 256).toString(16).padStart(6, '0')}`;
  };
  for (let index = 0; index < 150; index += 1) {
    const colors = { primary: seed(), secondary: seed(), neutral: seed(), error: seed() };
    for (const mode of ['light', 'dark', 'high-contrast']) {
      assertInteractionContract(createTheme({ name: 'sweep', mode, colors }), `${JSON.stringify(colors)} ${mode}`);
    }
  }
  for (const value of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff']) {
    const colors = { primary: value, secondary: value, neutral: value, error: value };
    for (const mode of ['light', 'dark', 'high-contrast']) {
      assertInteractionContract(createTheme({ name: 'edge', mode, colors }), `${value} ${mode}`);
    }
  }
});

test('interaction fills step down the tonal palette in every mode', () => {
  const expected = { light: [40, 35, 30], dark: [80, 75, 70], 'high-contrast': [90, 85, 80] };
  for (const [mode, [rest, hover, pressed]] of Object.entries(expected)) {
    const theme = createTheme({ ...presets.forge, mode });
    assert.equal(theme.roles.actionPrimary, theme.palettes.primary[rest]);
    assert.equal(theme.roles.actionPrimaryHover, theme.palettes.primary[hover]);
    assert.equal(theme.roles.actionPrimaryPressed, theme.palettes.primary[pressed]);
  }
});

test('the validator rejects interaction roles that break the contract', () => {
  const broken = (role, value) => {
    const theme = createTheme(presets.forge);
    theme.roles[role] = value(theme.roles);
    return validateTheme(theme);
  };
  assert.match(broken('onError', (roles) => roles.error).errors.join(' '), /onError on error/);
  assert.match(broken('onInfo', (roles) => roles.info).errors.join(' '), /onInfo on info/);
  assert.match(broken('actionPrimaryHover', (roles) => roles.actionPrimary).errors.join(' '), /actionPrimaryHover on actionPrimary/);
  assert.match(broken('surfaceContainerPressed', (roles) => roles.onSurface).errors.join(' '), /onSurface on surfaceContainerPressed/);
  assert.match(broken('errorPressed', () => '').errors.join(' '), /errorPressed/);
});

test('interaction roles are serialized as scoped variables', () => {
  const css = generateThemeCss(createTheme(presets.forge), '.example');
  for (const name of ['on-error', 'error-hover', 'error-pressed', 'action-primary-hover', 'action-primary-pressed', 'surface-container-hover', 'surface-container-pressed']) {
    assert.match(css, new RegExp(`--cf-v2-${name}: #[0-9a-f]{6};`));
  }
});

test('V2 geometry matches the ButtonV2 contract and ships in its own stylesheet', async () => {
  assert.deepEqual(geometry.button, {
    heightSm: '32px',
    heightMd: '40px',
    heightLg: '48px',
    paddingSm: '12px',
    paddingMd: '16px',
    paddingLg: '20px',
    radius: '10px',
    gap: '8px',
    fontSizeSm: '12px',
    fontSizeMd: '14px',
    fontSizeLg: '16px',
    fontWeight: '500',
    iconSize: '16px',
    focusWidth: '2px',
    focusOffset: '3px',
    borderWidth: '1px',
    spinnerWidth: '2px',
    spinnerDuration: '800ms',
    transitionDuration: '120ms',
    disabledOpacity: '0.7',
    disabledContentOpacity: '0.68',
  });
  const css = await readFile(resolve(packageRoot, 'dist/theme-v2/tokens.css'), 'utf8');
  assert.equal(css, generateTokensCss());
  for (const [name, value] of [['height-sm', '32px'], ['height-md', '40px'], ['height-lg', '48px'], ['padding-sm', '12px'], ['padding-md', '16px'], ['padding-lg', '20px'], ['radius', '10px'], ['gap', '8px'], ['font-size-sm', '12px'], ['font-size-md', '14px'], ['font-size-lg', '16px'], ['font-weight', '500'], ['icon-size', '16px'], ['focus-width', '2px'], ['focus-offset', '3px'], ['border-width', '1px'], ['spinner-width', '2px'], ['spinner-duration', '800ms'], ['transition-duration', '120ms'], ['disabled-opacity', '0.7'], ['disabled-content-opacity', '0.68']]) {
    assert.ok(css.includes(`--cf-v2-button-${name}: ${value};`), name);
  }
  for (const [name, value] of [['field-height-sm', '32px'], ['field-height-md', '40px'], ['field-height-lg', '48px'], ['field-padding', '12px'], ['field-radius', '10px'], ['field-gap', '8px'], ['field-state-border-width', '2px'], ['select-icon-size', '16px'], ['selection-target-size', '44px'], ['checkbox-size', '20px'], ['checkbox-radius', '5px'], ['switch-width', '44px'], ['switch-height', '26px'], ['switch-thumb-size', '18px'], ['switch-thumb-offset-on', '22px'], ['card-padding', '20px'], ['card-radius', '14px'], ['card-gap', '12px'], ['badge-padding', '10px'], ['badge-radius', '999px'], ['badge-height-md', '30px'], ['tabs-gap', '8px'], ['tabs-height-md', '44px'], ['tabs-indicator-height', '3px'], ['alert-padding', '16px'], ['alert-radius', '12px'], ['alert-icon-size', '26px']]) {
    assert.ok(css.includes(`--cf-v2-${name}: ${value};`), name);
  }
  const manifest = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'));
  assert.equal(manifest.exports['./theme-v2/tokens.css'].default, './dist/theme-v2/tokens.css');
});

test('the V2 stylesheet ships the Forge preset as its default theme in every mode', async () => {
  const css = await readFile(resolve(packageRoot, 'dist/theme-v2/tokens.css'), 'utf8');
  const rule = (selector) => {
    const start = css.indexOf(`${selector} {`);
    assert.notEqual(start, -1, selector);
    return css.slice(start, css.indexOf('}', start));
  };
  const blocks = {
    dark: rule(':root, [data-cf-theme-mode="dark"]'),
    light: rule('[data-cf-theme-mode="light"]'),
    'high-contrast': rule('[data-cf-theme-mode="high-contrast"]'),
  };
  for (const [mode, block] of Object.entries(blocks)) {
    const theme = createTheme({ ...presets.forge, mode });
    for (const [role, value] of Object.entries(theme.roles)) {
      const name = role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      assert.ok(block.includes(`--cf-v2-${name}: ${value};`), `${mode} ${role}`);
    }
  }
});

test('the V2 stylesheet leaves color-scheme on :root to the V1 stylesheet', async () => {
  const css = await readFile(resolve(packageRoot, 'dist/theme-v2/tokens.css'), 'utf8');
  for (const [selector, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g).map((match) => [match[1], match[2]])) {
    if (selector.includes(':root')) assert.doesNotMatch(body, /color-scheme/, selector);
  }
  assert.match(css, /\[data-cf-theme-mode="light"\] \{\n {2}color-scheme: light;/);
  assert.match(css, /\[data-cf-theme-mode="dark"\], \[data-cf-theme-mode="high-contrast"\] \{\n {2}color-scheme: dark;/);
});

test('high contrast is a stricter mode, not a darker dark', () => {
  for (const preset of Object.values(presets)) {
    const high = createTheme({ ...preset, mode: 'high-contrast' });
    const dark = createTheme({ ...preset, mode: 'dark' });
    const changed = Object.keys(high.roles).filter((role) => high.roles[role] !== dark.roles[role]);
    assert.ok(changed.length >= 18, `${preset.name} changed ${changed.length} roles`);
    assert.ok(contrastRatio(high.roles.onSurface, high.roles.surfaceContainer) > contrastRatio(dark.roles.onSurface, dark.roles.surfaceContainer));
    assert.ok(contrastRatio(high.roles.outline, high.roles.surfaceContainer) > contrastRatio(dark.roles.outline, dark.roles.surfaceContainer));
    assert.ok(validateTheme(high).contrasts.filter((check) => check.minimum === 7).length >= 17);
    assert.equal(high.roles.outline, high.palettes.neutralVariant[90]);
    assert.equal(high.roles.outlineVariant, high.palettes.neutralVariant[70]);
  }
});

test('the high contrast contract holds for arbitrary seeds', () => {
  let seed = 7;
  const random = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const color = () => `#${[0, 0, 0].map(() => Math.floor(random() * 256).toString(16).padStart(2, '0')).join('')}`;
  for (let index = 0; index < 500; index += 1) {
    assert.doesNotThrow(() => createTheme({ name: 'Seed', colors: { primary: color(), secondary: color(), neutral: color() }, mode: 'high-contrast' }));
  }
});

test('the validator enforces the high contrast contract only in that mode', () => {
  const theme = createTheme({ ...presets.forge, mode: 'high-contrast' });
  const weak = { ...theme, roles: { ...theme.roles, outline: '#6f6f6f' } };
  assert.equal(validateTheme(weak).valid, false);
  assert.equal(validateTheme({ ...theme, mode: 'dark', roles: { ...theme.roles } }).valid, true);
});

test('V2 follows data-theme unless an explicit mode is set', async () => {
  const css = await readFile(resolve(packageRoot, 'dist/theme-v2/tokens.css'), 'utf8');
  for (const mode of ['light', 'dark']) {
    const selector = `[data-theme="${mode}"]:not([data-cf-theme-mode]) {`;
    const start = css.indexOf(selector);
    assert.notEqual(start, -1, selector);
    const block = css.slice(start, css.indexOf('}', start));
    assert.match(block, new RegExp(`--cf-v2-surface: ${createTheme({ ...presets.forge, mode }).roles.surface};`));
    assert.doesNotMatch(block, /color-scheme/);
  }
});

test('shadow and scrim are roles, and geometry holds no colors', () => {
  for (const mode of ['light', 'dark', 'high-contrast']) {
    const { roles } = createTheme({ ...presets.forge, mode });
    assert.match(roles.scrim, /^#[\da-f]{6}$/);
    assert.match(roles.shadow, /^#[\da-f]{6}$/);
  }
  for (const [group, values] of Object.entries(geometry)) {
    for (const [name, value] of Object.entries(values)) assert.doesNotMatch(value, /#|rgb|hsl/, `${group}.${name}`);
  }
});

test('the public role names stay stable', () => {
  assert.deepEqual(Object.keys(createTheme(presets.forge).roles).sort(), [
    'actionPrimary', 'actionPrimaryHover', 'actionPrimaryPressed', 'background', 'disabled', 'error', 'errorHover',
    'errorPressed', 'focusRing', 'info', 'onActionPrimary', 'onError', 'onInfo', 'onPrimary', 'onPrimaryContainer',
    'onSecondary', 'onSuccess', 'onSurface', 'onSurfaceVariant', 'onWarning', 'outline', 'outlineVariant', 'primary',
    'primaryContainer', 'scrim', 'secondary', 'selection', 'shadow', 'success', 'surface', 'surfaceContainer',
    'surfaceContainerHover', 'surfaceContainerPressed', 'surfaceRaised', 'surfaceSunken', 'surfaceVariant', 'warning',
  ]);
});

test('V1 token artifacts stay free of V2 tokens', async () => {
  for (const file of ['src/tokens.css', 'tokens.json', 'dist/tokens.css', 'dist/tokens.json']) {
    assert.doesNotMatch(await readFile(resolve(packageRoot, file), 'utf8'), /cf-v2/, file);
  }
  assert.equal('v2' in JSON.parse(await readFile(resolve(packageRoot, 'tokens.json'), 'utf8')), false);
});

test('themes can be applied to separate scopes without a document', () => {
  const variables = () => { const map = new Map(); return { map, setProperty: (key, value) => map.set(key, value) }; };
  const first = variables();
  const second = variables();
  applyTheme({ style: first }, createTheme(presets.forge));
  applyTheme({ style: second }, createTheme(presets.formiai));
  assert.notEqual(first.map.get('--cf-v2-primary'), second.map.get('--cf-v2-primary'));
});

test('surfaceSunken sits below the page and keeps its contrast in every preset and mode', () => {
  for (const preset of Object.values(presets)) {
    for (const mode of ['light', 'dark', 'high-contrast']) {
      const theme = createTheme({ ...preset, mode });
      const { surface, surfaceSunken, onSurface, outline, focusRing } = theme.roles;
      assert.match(surfaceSunken, /^#[0-9a-f]{6}$/);
      assert.ok(contrastRatio(onSurface, surfaceSunken) >= 4.5, `${preset.name} ${mode}: text`);
      assert.ok(contrastRatio(outline, surfaceSunken) >= 3, `${preset.name} ${mode}: outline`);
      assert.ok(contrastRatio(focusRing, surfaceSunken) >= 3, `${preset.name} ${mode}: focus`);
      if (mode !== 'light') assert.ok(luminance(surfaceSunken) <= luminance(surface), `${preset.name} ${mode}: not darker`);
    }
  }
  assert.match(generateThemeCss(createTheme(presets.formiai), '.x'), /--cf-v2-surface-sunken: #[0-9a-f]{6};/);
});

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const lin = (value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
