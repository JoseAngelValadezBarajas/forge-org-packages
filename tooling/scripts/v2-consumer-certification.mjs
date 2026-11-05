import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const evidenceDirectory = join(root, 'docs', 'evidence', 'button-v2');
const packages = ['@corefoundry-labs/forge-tokens', '@corefoundry-labs/forge-icons', '@corefoundry-labs/forge-ui'];
const presets = ['forge', 'formiai', 'autofund', 'neutral'];
const modes = ['light', 'dark', 'high-contrast'];
const variants = ['primary', 'secondary', 'ghost', 'danger'];
const sizes = { sm: '32px', md: '40px', lg: '48px' };
const axeVersion = '4.10.3';
const fills = {
  primary: { rest: 'actionPrimary', hover: 'actionPrimaryHover', pressed: 'actionPrimaryPressed', on: 'onActionPrimary' },
  secondary: { rest: 'surfaceContainer', hover: 'surfaceContainerHover', pressed: 'surfaceContainerPressed', on: 'onSurface' },
  ghost: { rest: null, hover: 'surfaceContainerHover', pressed: 'surfaceContainerPressed', on: 'onSurface' },
  danger: { rest: 'error', hover: 'errorHover', pressed: 'errorPressed', on: 'onError' },
};

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', shell: command === 'npm' && process.platform === 'win32' });
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed:\n${result.stdout}${result.stderr}`);
  return result.stdout;
}

const rgb = (hex) => `rgb(${[1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)).join(', ')})`;
const luminance = (color) => {
  const [red, green, blue] = color.match(/[\d.]+/g).slice(0, 3).map((channel) => {
    const value = Number(channel) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};
const contrast = (first, second) => {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

function packArchives(directory) {
  const archives = {};
  const contents = {};
  for (const name of packages) {
    const [packed] = JSON.parse(run('npm', ['pack', `--workspace=${name}`, '--json', `--pack-destination=${directory}`], root));
    assert.equal(packed.name, name);
    archives[name] = join(directory, packed.filename);
    contents[name] = { version: packed.version, files: packed.files.map((file) => file.path) };
  }
  const versions = new Set(Object.values(contents).map((entry) => entry.version));
  assert.equal(versions.size, 1, 'the three packages must share one release version');
  for (const file of ['dist/theme-v2/tokens.css', 'dist/theme-v2/tokens.css.d.ts', 'dist/theme-v2/index.js']) {
    assert.ok(contents['@corefoundry-labs/forge-tokens'].files.includes(file), `tokens tarball is missing ${file}`);
  }
  for (const file of ['dist/componentsV2/actions/ButtonV2/ButtonV2.js', 'dist/componentsV2/actions/ButtonV2/ButtonV2.d.ts', 'dist/componentsV2/actions/ButtonV2/ButtonV2.module.css']) {
    assert.ok(contents['@corefoundry-labs/forge-ui'].files.includes(file), `ui tarball is missing ${file}`);
  }
  return { archives, version: [...versions][0] };
}

async function installConsumer(directory, archives, version) {
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')).packages;
  const pinned = (name) => lock[`node_modules/${name}`].version;
  const dependencies = Object.fromEntries(Object.entries(archives).map(([name, archive]) => [
    name,
    `file:${relative(directory, archive).replaceAll('\\', '/')}`,
  ]));
  await mkdir(join(directory, 'src'), { recursive: true });
  await writeFile(join(directory, 'package.json'), `${JSON.stringify({
    name: 'corefoundry-v2-external-consumer',
    private: true,
    type: 'module',
    dependencies: { ...dependencies, react: pinned('react'), 'react-dom': pinned('react-dom') },
    devDependencies: {
      '@types/react': pinned('@types/react'),
      '@types/react-dom': pinned('@types/react-dom'),
      '@vitejs/plugin-react': pinned('@vitejs/plugin-react'),
      'axe-core': axeVersion,
      typescript: pinned('typescript'),
      vite: pinned('vite'),
    },
  }, null, 2)}\n`);
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', '--install-links=true', '--registry=https://registry.npmjs.org'], directory);

  for (const name of packages) {
    const installed = join(directory, 'node_modules', ...name.split('/'));
    assert.equal(lstatSync(installed).isSymbolicLink(), false, `${name} is a link`);
    const real = realpathSync(installed);
    assert.ok(real.startsWith(realpathSync(directory)), `${name} resolves outside the consumer`);
    assert.ok(!real.startsWith(`${root}${sep}`), `${name} resolves into the monorepo`);
    assert.equal(JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8')).version, version);
  }
}

async function writeConsumer(directory) {
  await writeFile(join(directory, 'vite.config.js'), "import react from '@vitejs/plugin-react';\nexport default { plugins: [react()] };\n");
  await writeFile(join(directory, 'index.html'), '<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>V2 consumer</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n');
  await writeFile(join(directory, 'tsconfig.json'), `${JSON.stringify({
    compilerOptions: {
      target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true,
      skipLibCheck: false, noEmit: true, types: [], allowArbitraryExtensions: true, ignoreDeprecations: '6.0',
    },
    include: ['src/main.tsx'],
  }, null, 2)}\n`);
  await writeFile(join(directory, 'tsconfig.negative.json'), `${JSON.stringify({
    extends: './tsconfig.json',
    include: ['src/negative.tsx'],
  }, null, 2)}\n`);
  await writeFile(join(directory, 'src', 'negative.tsx'), `import { ButtonV2 } from '@corefoundry-labs/forge-ui';
export const missingName = <ButtonV2 iconStart={<svg />} />;
`);
  await writeFile(join(directory, 'src', 'main.tsx'), `import { useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ButtonV2, FeedbackStateV2, ThemeScope, type ButtonV2Props, type ButtonV2Size, type ButtonV2Variant } from '@corefoundry-labs/forge-ui';
import { Search } from '@corefoundry-labs/forge-icons';
import { createTheme, presets, type ThemeMode } from '@corefoundry-labs/forge-tokens/theme-v2';

const variants: ButtonV2Variant[] = ['primary', 'secondary', 'ghost', 'danger'];
const sizes: ButtonV2Size[] = ['sm', 'md', 'lg'];
const modes: ThemeMode[] = ['light', 'dark', 'high-contrast'];
const props: ButtonV2Props = { variant: 'primary', children: 'Typed' };

function Counter({ id, ...rest }: { id: string; variant: ButtonV2Variant; children: ReactNode; disabled?: boolean; loading?: boolean }) {
  const [count, setCount] = useState(0);
  return <ButtonV2 {...rest} data-testid={id} data-count={count} onClick={() => setCount(count + 1)} />;
}

function Scope({ id }: { id: string }) {
  return <>
    {variants.map((variant) => <Counter key={variant} id={id + '-' + variant} variant={variant}>{variant + ' action'}</Counter>)}
    {variants.map((variant) => <Counter key={variant} id={id + '-' + variant + '-disabled'} variant={variant} disabled>{variant + ' disabled'}</Counter>)}
    {variants.map((variant) => <Counter key={variant} id={id + '-' + variant + '-loading'} variant={variant} loading>{variant + ' loading'}</Counter>)}
    <FeedbackStateV2 data-testid={id + '-loading-state'} state="loading" title="Loading" headingLevel={2} />
    <FeedbackStateV2 data-testid={id + '-empty-state'} state="empty" title={id + ' empty'} description="Nothing here yet." headingLevel={2} />
    <FeedbackStateV2 data-testid={id + '-error-state'} state="error" title={id + ' error'} description="It failed." headingLevel={2} />
    <FeedbackStateV2 data-testid={id + '-readonly-state'} state="readOnly" title={id + ' read only'} description="View only." headingLevel={2} />
  </>;
}

function App() {
  return <main>
    <h1>External consumer</h1>
    <Button data-testid="v1-button">V1 action</Button>
    <ButtonV2 {...props} data-testid="typed" />
    {sizes.map((size) => <ButtonV2 key={size} size={size} data-testid={'size-' + size}>Size</ButtonV2>)}
    {sizes.map((size) => <ButtonV2 key={size} size={size} variant="ghost" aria-label={'Search ' + size} iconStart={<Search />} data-testid={'icon-' + size} />)}
    <section aria-label="default" data-testid="default" style={{ background: 'var(--cf-v2-surface)', padding: 16 }}><Scope id="default" /></section>
    {Object.entries(presets).flatMap(([key, preset]) => modes.map((mode) => (
      <ThemeScope key={key + mode} theme={createTheme({ ...preset, mode })} data-testid={key + '-' + mode} aria-label={key + ' ' + mode} role="region" style={{ background: 'var(--cf-v2-surface)', color: 'var(--cf-v2-on-surface)', padding: 16 }}>
        <Scope id={key + '-' + mode} />
      </ThemeScope>
    )))}
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
`);
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createNetServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

async function waitForServer(url) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      await new Promise((done) => setTimeout(done, 200));
    }
  }
  throw new Error(`preview did not start at ${url}`);
}

async function certifyScope(page, id, roles, report) {
  const button = (name) => page.getByTestId(`${id}-${name}`);
  const style = (locator, property) => locator.evaluate((element, key) => getComputedStyle(element)[key], property);
  const surface = await style(page.getByTestId(id), 'backgroundColor');
  assert.equal(surface, rgb(roles.surface), `${id} surface`);

  for (const variant of variants) {
    const target = button(variant);
    const role = fills[variant];
    const check = (fill, label) => {
      const ratio = contrast(rgb(roles[role.on]), fill);
      report.minimumText = Math.min(report.minimumText, ratio);
      assert.ok(ratio >= 4.5, `${id} ${variant} ${label} text ${ratio.toFixed(2)}`);
      report.checks += 1;
    };
    assert.equal(await style(target, 'color'), rgb(roles[role.on]), `${id} ${variant} foreground`);
    const rest = await style(target, 'backgroundColor');
    if (role.rest) assert.equal(rest, rgb(roles[role.rest]), `${id} ${variant} rest`);
    else assert.equal(rest, 'rgba(0, 0, 0, 0)', `${id} ghost rest`);
    check(role.rest ? rest : surface, 'rest');

    await target.hover();
    assert.equal(await style(target, 'backgroundColor'), rgb(roles[role.hover]), `${id} ${variant} hover`);
    check(rgb(roles[role.hover]), 'hover');
    await page.mouse.down();
    assert.equal(await style(target, 'backgroundColor'), rgb(roles[role.pressed]), `${id} ${variant} pressed`);
    check(rgb(roles[role.pressed]), 'pressed');
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await target.evaluate((element) => { element.dataset.baseline = element.dataset.count; });

    if (variant === 'primary' || variant === 'danger') {
      for (const fill of [role.rest, role.hover, role.pressed]) {
        const ratio = contrast(rgb(roles[fill]), surface);
        report.minimumBoundary = Math.min(report.minimumBoundary, ratio);
        assert.ok(ratio >= 3, `${id} ${fill} boundary ${ratio.toFixed(2)}`);
      }
    }
    if (variant === 'secondary') {
      assert.equal(await style(target, 'borderTopColor'), rgb(roles.outline), `${id} outline`);
      for (const fill of [role.rest, role.hover, role.pressed]) {
        const ratio = contrast(rgb(roles.outline), rgb(roles[fill]));
        report.minimumBoundary = Math.min(report.minimumBoundary, ratio);
        assert.ok(ratio >= 3, `${id} outline on ${fill} ${ratio.toFixed(2)}`);
      }
    }

    const before = Number(await target.getAttribute('data-count'));
    await target.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    assert.equal(Number(await target.getAttribute('data-count')), before + 2, `${id} ${variant} keyboard activation`);

    const disabled = button(`${variant}-disabled`);
    assert.equal(await disabled.isDisabled(), true);
    assert.equal(await style(disabled, 'backgroundColor'), rgb(roles.disabled), `${id} ${variant} disabled`);
    await disabled.click({ force: true });
    assert.equal(await disabled.getAttribute('data-count'), '0', `${id} ${variant} disabled click`);

    const loading = button(`${variant}-loading`);
    assert.equal(await loading.getAttribute('aria-busy'), 'true');
    assert.equal(await loading.getAttribute('aria-disabled'), 'true');
    assert.equal(await loading.textContent(), 'Saving…');
    assert.equal(await loading.locator('[data-button-spinner]').count(), 1);
    await loading.click({ force: true });
    await loading.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    assert.equal(await loading.getAttribute('data-count'), '0', `${id} ${variant} loading activation`);
    assert.equal(await loading.evaluate((element) => document.activeElement === element), true, `${id} ${variant} loading focus`);
    report.states += 6;
  }

  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('Tab');
  await button('primary').focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const focused = button('primary');
  assert.equal(await focused.evaluate((element) => document.activeElement === element), true, `${id} tab order`);
  assert.equal(await style(focused, 'outlineStyle'), 'solid');
  assert.equal(await style(focused, 'outlineWidth'), '2px');
  assert.equal(await style(focused, 'outlineOffset'), '3px');
  assert.equal(await style(focused, 'outlineColor'), rgb(roles.focusRing));
  const ring = contrast(rgb(roles.focusRing), surface);
  report.minimumFocus = Math.min(report.minimumFocus, ring);
  assert.ok(ring >= 3, `${id} focus ring ${ring.toFixed(2)}`);

  const order = await page.getByTestId(id).evaluate((element) => [...element.querySelectorAll('button')].filter((node) => node.tabIndex >= 0 && !node.disabled).length);
  assert.equal(order, 8, `${id} focusable buttons`);

  for (const [state, role] of [['loading-state', 'status'], ['empty-state', 'region'], ['error-state', 'alert'], ['readonly-state', 'region']]) {
    const panel = page.getByTestId(`${id}-${state}`);
    assert.equal(await panel.getAttribute('role'), role, `${id} ${state} role`);
    assert.ok(await panel.getAttribute('aria-labelledby'), `${id} ${state} name`);
    const color = await style(panel.getByRole('heading'), 'color');
    assert.equal(color, rgb(roles.onSurface), `${id} ${state} heading`);
    report.feedback += 1;
  }
  assert.equal(await style(page.getByTestId(`${id}-empty-state`), 'backgroundColor'), rgb(roles.surface), `${id} feedback surface`);
}

async function certifyBrowser(url, directory, evidence) {
  const engine = await import(pathToFileURL(join(directory, 'node_modules/@corefoundry-labs/forge-tokens/dist/theme-v2/index.js')).href);
  const axeSource = readFileSync(join(directory, 'node_modules/axe-core/axe.min.js'), 'utf8');
  const browser = await chromium.launch({ headless: true });
  const report = { scopes: 0, states: 0, feedback: 0, checks: 0, minimumText: Infinity, minimumBoundary: Infinity, minimumFocus: Infinity, axeViolations: 0, axeRulesPassed: 0 };
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) errors.push(message.text());
    });
    await page.goto(url);
    await page.getByTestId('default-primary').waitFor();

    const style = (id, property) => page.getByTestId(id).evaluate((element, key) => getComputedStyle(element)[key], property);
    for (const [size, height] of Object.entries(sizes)) {
      assert.equal(await style(`size-${size}`, 'height'), height);
      assert.equal(await style(`size-${size}`, 'borderTopLeftRadius'), '10px');
      assert.equal(await style(`icon-${size}`, 'height'), height);
      assert.equal(await style(`icon-${size}`, 'width'), height);
      assert.equal(await page.getByRole('button', { name: `Search ${size}` }).count(), 1);
      assert.equal(await page.getByTestId(`icon-${size}`).locator('svg').evaluate((element) => getComputedStyle(element).width), '16px');
    }
    assert.equal(await page.getByTestId('typed').getAttribute('type'), 'button');

    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    assert.equal(await style('size-md', 'fontFamily'), body, 'ButtonV2 must inherit the consumer font family');

    assert.equal(await page.locator('html').evaluate((element) => getComputedStyle(element).colorScheme), 'light', 'V2 stylesheet must not override the V1 color scheme');
    assert.equal(await style('v1-button', 'backgroundColor'), rgb(await page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--forge-accent').trim())), 'V1 Button color changed');

    await certifyScope(page, 'default', engine.createTheme(engine.presets.forge).roles, report);
    report.scopes += 1;
    for (const preset of presets) {
      for (const mode of modes) {
        await certifyScope(page, `${preset}-${mode}`, engine.createTheme({ ...engine.presets[preset], mode }).roles, report);
        report.scopes += 1;
      }
    }
    assert.equal(await style('default-primary-loading', 'cursor'), 'progress');
    assert.equal(await page.getByTestId('default-primary-loading').locator('[data-button-spinner]').evaluate((element) => getComputedStyle(element).animationName), 'none', 'reduced motion must stop the spinner');

    await page.addScriptTag({ content: axeSource });
    const axe = await page.evaluate(async () => {
      const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
      return {
        passes: result.passes.map((rule) => rule.id),
        incomplete: result.incomplete.map((rule) => ({ id: rule.id, nodes: rule.nodes.length, sample: rule.nodes[0]?.target.join(' ') })),
        violations: result.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => `${node.target.join(' ')} ${node.failureSummary ?? ''}`.slice(0, 220)) })),
      };
    });
    report.axeViolations = axe.violations.length;
    report.axeRulesPassed = axe.passes.length;
    report.axeIncomplete = axe.incomplete;
    assert.deepEqual(axe.violations, [], 'axe found WCAG violations');
    assert.ok(axe.passes.includes('color-contrast'), 'axe must evaluate color contrast');

    await page.setViewportSize({ width: 375, height: 800 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'horizontal overflow at 375px');
    assert.deepEqual(errors, [], 'browser console reported problems');

    if (evidence) {
      await mkdir(evidenceDirectory, { recursive: true });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.getByTestId('forge-light').screenshot({ path: join(evidenceDirectory, 'forge-light.png') });
      await page.getByTestId('forge-high-contrast').screenshot({ path: join(evidenceDirectory, 'forge-high-contrast.png') });
    }

    const motion = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const animated = await motion.newPage();
    await animated.goto(url);
    await animated.getByTestId('default-primary-loading').waitFor();
    assert.notEqual(await animated.getByTestId('default-primary-loading').locator('[data-button-spinner]').evaluate((element) => getComputedStyle(element).animationName), 'none', 'spinner must animate by default');
  } finally {
    await browser.close();
  }
  return report;
}

export async function runV2ConsumerCertification({ evidence = false } = {}) {
  const work = await mkdtemp(join(tmpdir(), 'corefoundry-v2-consumer-'));
  assert.ok(!realpathSync(work).startsWith(`${root}${sep}`), 'the consumer must live outside the monorepo');
  const consumer = join(work, 'consumer');
  await mkdir(consumer, { recursive: true });
  let preview;
  try {
    const { archives, version } = packArchives(work);
    await installConsumer(consumer, archives, version);
    await writeConsumer(consumer);

    const tsc = join('node_modules', 'typescript', 'bin', 'tsc');
    run(process.execPath, [tsc, '--project', 'tsconfig.json'], consumer);
    const negative = spawnSync(process.execPath, [tsc, '--project', 'tsconfig.negative.json'], { cwd: consumer, encoding: 'utf8' });
    assert.notEqual(negative.status, 0, 'an icon-only ButtonV2 without aria-label must not compile');
    assert.match(`${negative.stdout}${negative.stderr}`, /aria-label/);

    const vite = join('node_modules', 'vite', 'bin', 'vite.js');
    run(process.execPath, [vite, 'build'], consumer);
    const port = await freePort();
    preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: consumer, stdio: 'ignore' });
    const url = `http://127.0.0.1:${port}/`;
    await waitForServer(url);
    const report = await certifyBrowser(url, consumer, evidence);
    const result = {
      version,
      installedFrom: 'npm pack tarballs, no workspace links',
      production: 'vite build + vite preview in Chromium',
      typeChecks: ['strict consumer compiled', 'icon-only without aria-label rejected'],
      ...report,
      minimumText: Number(report.minimumText.toFixed(2)),
      minimumBoundary: Number(report.minimumBoundary.toFixed(2)),
      minimumFocus: Number(report.minimumFocus.toFixed(2)),
      result: 'passed',
    };
    if (evidence) await writeFile(join(evidenceDirectory, 'certification.json'), `${JSON.stringify(result, null, 2)}\n`);
    return result;
  } finally {
    preview?.kill();
    await rm(work, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 }).catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await runV2ConsumerCertification({ evidence: process.argv.includes('--evidence') });
    console.log(`V2 consumer certification passed: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
