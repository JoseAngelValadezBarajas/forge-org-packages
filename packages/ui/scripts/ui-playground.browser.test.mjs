import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { catalog } from '../../../playground/ui/catalog.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

test('UI host applies dynamic themes to V2 while keeping V1 readable', async () => {
  const server = await createServer({
    configFile: false,
    root: join(root, 'playground/ui'),
    server: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(`${server.resolvedUrls.local[0]}#/FeedbackStateV2`);
    const v1 = page.getByRole('region', { name: 'V1 examples' });
    const v2 = page.getByRole('region', { name: 'V2 examples' });
    await v2.waitFor();
    const panel = v2.locator('[data-state="empty"]');
    const background = await panel.evaluate((element) => getComputedStyle(element).backgroundColor);
    const v1Button = v1.getByRole('button', { name: 'Create project' });
    const v1Color = await v1Button.evaluate((element) => getComputedStyle(element).backgroundColor);

    await page.getByLabel('Theme preset').selectOption('autofund');
    await page.waitForFunction(
      (previous) => getComputedStyle(document.querySelector('.version--v2 [data-state="empty"]')).backgroundColor !== previous,
      background,
    );
    assert.equal(await v1Button.evaluate((element) => getComputedStyle(element).backgroundColor), v1Color);
    const label = v1.locator('.example .eyebrow').first();
    assert.equal(await label.evaluate((element) => getComputedStyle(element).color), 'rgb(158, 165, 173)');
    const spinner = v2.locator('[data-feedback-spinner]');
    const accent = await spinner.evaluate((element) => getComputedStyle(element).borderTopColor);
    await page.getByLabel('Primary seed').fill('#168866');
    await page.waitForFunction(
      (previous) => getComputedStyle(document.querySelector('.version--v2 [data-feedback-spinner]')).borderTopColor !== previous,
      accent,
    );
    await page.setViewportSize({ width: 375, height: 800 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
});

test('UI host lists every component on its own page, with V2 first and search', async () => {
  const server = await createServer({
    configFile: false,
    root: join(root, 'playground/ui'),
    server: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(server.resolvedUrls.local[0]);
    const nav = page.getByRole('navigation', { name: 'Components' });
    await page.getByRole('heading', { level: 1, name: 'ButtonV2' }).waitFor();
    assert.equal(await nav.locator('h2').first().textContent(), 'V2 components');

    for (const { name, version } of catalog) {
      await nav.getByRole('link', { name, exact: true }).click();
      await page.getByRole('heading', { level: 1, name, exact: true }).waitFor();
      assert.equal(await page.evaluate(() => decodeURIComponent(location.hash)), `#/${name}`);
      assert.equal(await nav.locator('[aria-current="page"]').textContent(), name);
      assert.equal(await page.getByLabel('Theme preset').count(), version === 'V1' ? 0 : 1, name);
      assert.ok((await page.locator('.component-code code').textContent()).includes(name), name);
    }

    await page.getByLabel('Find a component').fill('buttonv');
    assert.deepEqual(await nav.getByRole('link').allTextContents(), ['ButtonV2']);
    await page.getByLabel('Find a component').fill('nothing');
    await nav.getByText('No components found').waitFor();

    await page.goto(`${server.resolvedUrls.local[0]}#/Tabs`);
    await page.reload();
    await page.getByRole('heading', { level: 1, name: 'Tabs' }).waitFor();

    await page.setViewportSize({ width: 375, height: 800 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
});

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

test('V2 form controls render every state in the component host and follow the theme controls', async () => {
  const server = await createServer({
    configFile: false,
    root: join(root, 'playground/ui'),
    server: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const open = async (name, testId) => {
      await page.goto(`${server.resolvedUrls.local[0]}#/${name}`);
      await page.getByRole('heading', { level: 1, name, exact: true }).waitFor();
      await page.getByTestId(testId).waitFor();
    };
    const role = (name) => page.locator('.theme-preview').evaluate((element, token) => getComputedStyle(element).getPropertyValue(token).trim(), `--cf-v2-${name}`);
    const style = (id, property) => page.getByTestId(id).evaluate((element, key) => getComputedStyle(element)[key], property);
    const sibling = (id, property) => page.getByTestId(id).locator('xpath=following-sibling::span[1]').evaluate((element, key) => getComputedStyle(element)[key], property);

    await open('TextInputV2', 'text-md');
    for (const [size, height] of [['sm', '32px'], ['md', '40px'], ['lg', '48px']]) {
      assert.equal(await style(`text-${size}`, 'height'), height);
    }
    assert.equal(await style('text-default', 'backgroundColor'), rgb(await role('surface-container')));
    assert.equal(await style('text-invalid', 'outlineColor'), rgb(await role('error')));
    assert.equal(await style('text-disabled', 'backgroundColor'), rgb(await role('disabled')));
    await page.getByTestId('text-default').fill('hello');
    assert.equal(await page.getByTestId('text-default').inputValue(), 'hello');
    await page.getByRole('textbox', { name: 'Email address' }).first().waitFor();
    assert.equal(await page.getByTestId('matrix-neutral-dark').locator('input').count(), 3);

    const before = await role('surface-container');
    await page.getByLabel('Theme preset').selectOption('formiai');
    await page.getByLabel('Theme mode').selectOption('light');
    await page.waitForFunction(
      (color) => getComputedStyle(document.querySelector('.theme-preview')).getPropertyValue('--cf-v2-surface-container').trim() !== color,
      before,
    );
    assert.equal(await style('text-default', 'backgroundColor'), rgb(await role('surface-container')));

    await open('SelectV2', 'select-md');
    for (const [size, height] of [['sm', '32px'], ['md', '40px'], ['lg', '48px']]) {
      assert.equal(await style(`select-${size}`, 'height'), height);
    }
    await page.getByTestId('select-default').selectOption('Option C');
    assert.equal(await page.getByTestId('select-default').inputValue(), 'Option C');
    assert.equal(await page.getByTestId('matrix-forge-light').locator('select').count(), 3);

    await open('CheckboxV2', 'checkbox-unchecked');
    assert.equal(await sibling('checkbox-checked', 'backgroundColor'), rgb(await role('action-primary')));
    assert.equal(await page.getByTestId('checkbox-mixed').evaluate((element) => element.indeterminate), true);
    assert.equal(await page.getByTestId('checkbox-all').evaluate((element) => element.indeterminate), true);
    await page.getByTestId('checkbox-engineering').click();
    assert.equal(await page.getByTestId('checkbox-all').isChecked(), true);
    assert.equal(await page.getByTestId('checkbox-all').evaluate((element) => element.indeterminate), false);
    await page.getByTestId('checkbox-all').click();
    assert.equal(await page.getByTestId('checkbox-design').isChecked(), false);
    await page.getByText('Unchecked', { exact: true }).click();
    assert.equal(await page.getByTestId('checkbox-unchecked').isChecked(), true);

    await open('SwitchV2', 'switch-off');
    assert.equal(await sibling('switch-on', 'backgroundColor'), rgb(await role('action-primary')));
    assert.equal(await page.getByTestId('switch-off').getAttribute('role'), 'switch');
    await page.getByTestId('switch-off').click();
    assert.equal(await page.getByTestId('switch-off').isChecked(), true);
    await page.getByTestId('switch-disabled').click({ force: true });
    assert.equal(await page.getByTestId('switch-disabled').isChecked(), true);
    assert.equal(await page.getByRole('switch', { name: 'Notifications' }).evaluate((element) => element.getAttribute('aria-describedby')), 'switch-hint');

    await page.setViewportSize({ width: 375, height: 800 });
    for (const [name, testId] of [['TextInputV2', 'text-md'], ['SelectV2', 'select-md'], ['CheckboxV2', 'checkbox-unchecked'], ['SwitchV2', 'switch-off']]) {
      await open(name, testId);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, name);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
});

test('V2 display components render every state in the component host', async () => {
  const server = await createServer({
    configFile: false,
    root: join(root, 'playground/ui'),
    server: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const open = async (name, testId) => {
      await page.goto(`${server.resolvedUrls.local[0]}#/${name}`);
      await page.getByRole('heading', { level: 1, name, exact: true }).waitFor();
      await page.getByTestId(testId).waitFor();
    };
    const role = (name) => page.locator('.theme-preview').evaluate((element, token) => getComputedStyle(element).getPropertyValue(token).trim(), `--cf-v2-${name}`);
    const style = (id, property) => page.getByTestId(id).evaluate((element, key) => getComputedStyle(element)[key], property);

    await open('CardV2', 'card-default');
    assert.equal(await style('card-default', 'backgroundColor'), rgb(await role('surface-container')));
    assert.equal(await style('card-outlined', 'backgroundColor'), rgb(await role('surface')));
    assert.notEqual(await style('card-elevated', 'boxShadow'), 'none');
    await page.getByTestId('card-button').click();
    assert.equal(await page.getByTestId('card-button').getAttribute('data-count'), '1');
    assert.equal(await page.getByTestId('card-disabled').isDisabled(), true);
    assert.equal(await page.getByTestId('card-link').evaluate((element) => element.tagName), 'A');
    assert.equal(await page.getByTestId('matrix-formiai-dark').locator('[data-variant="outlined"]').count(), 1);

    await open('BadgeV2', 'badge-primary-solid');
    assert.equal(await style('badge-primary-solid', 'backgroundColor'), rgb(await role('action-primary')));
    assert.equal(await style('badge-success-solid', 'color'), rgb(await role('on-success')));
    assert.equal(await style('badge-info-outline', 'borderTopColor'), rgb(await role('info')));
    assert.equal(await style('badge-sm', 'height'), '24px');
    assert.equal(await style('badge-md', 'height'), '30px');
    assert.equal(await page.getByTestId('badge-long').evaluate((element) => element.firstElementChild.scrollWidth > element.firstElementChild.clientWidth), true);

    await open('TabsV2', 'tabs-underline-md');
    const tabs = page.getByTestId('tabs-underline-md');
    await tabs.getByRole('tab', { name: 'Overview' }).focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await tabs.getByRole('tab', { name: 'Activity' }).getAttribute('aria-selected'), 'true');
    await page.keyboard.press('ArrowRight');
    assert.equal(await tabs.getByRole('tab', { name: 'Settings' }).getAttribute('aria-selected'), 'true');
    await page.getByTestId('tabs-controlled').getByRole('tab', { name: 'Overview' }).click();
    assert.equal(await page.getByTestId('tabs-value').textContent(), 'Selected: overview');
    const manual = page.getByTestId('tabs-manual');
    await manual.getByRole('tab', { name: 'Overview' }).focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await manual.getByRole('tab', { name: 'Overview' }).getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Enter');
    assert.equal(await manual.getByRole('tab', { name: 'Activity' }).getAttribute('aria-selected'), 'true');

    await open('AlertV2', 'alert-info-soft');
    assert.equal(await style('alert-info-solid', 'backgroundColor'), rgb(await role('info')));
    assert.equal(await style('alert-success-solid', 'color'), rgb(await role('on-success')));
    assert.equal(await style('alert-error-outline', 'borderTopColor'), rgb(await role('error')));
    await page.getByTestId('alert-dismissible').getByRole('button', { name: 'Close' }).click();
    await page.getByTestId('alert-restore').click();
    await page.getByTestId('alert-dismissible').waitFor();

    await page.setViewportSize({ width: 375, height: 800 });
    for (const [name, testId] of [['CardV2', 'card-default'], ['BadgeV2', 'badge-primary-solid'], ['TabsV2', 'tabs-underline-md'], ['AlertV2', 'alert-info-soft']]) {
      await open(name, testId);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, name);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
});

test('ButtonV2 follows the Theme Engine across geometry, states and presets', async () => {
  const server = await createServer({
    configFile: false,
    root: join(root, 'playground/ui'),
    server: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(server.resolvedUrls.local[0]);
    await page.getByTestId('primary-md').waitFor();

    const role = (name) => page.locator('.theme-preview').evaluate((element, token) => getComputedStyle(element).getPropertyValue(token).trim(), `--cf-v2-${name}`);
    const style = (id, property) => page.getByTestId(id).evaluate((element, key) => getComputedStyle(element)[key], property);
    const settled = (id, expected) => page.waitForFunction(
      ([testId, color]) => getComputedStyle(document.querySelector(`[data-testid="${testId}"]`)).backgroundColor === color,
      [id, expected],
    );

    for (const [size, height, fontSize] of [['sm', '32px', '12px'], ['md', '40px', '14px'], ['lg', '48px', '16px']]) {
      assert.equal(await style(`primary-${size}`, 'height'), height);
      assert.equal(await style(`primary-${size}`, 'fontSize'), fontSize);
      assert.equal(await style(`primary-${size}`, 'borderTopLeftRadius'), '10px');
    }
    assert.equal(await style('primary-md', 'fontWeight'), '500');
    assert.equal(await style('icon-only', 'width'), await style('icon-only', 'height'));

    assert.equal(await style('primary-md', 'backgroundColor'), rgb(await role('action-primary')));
    assert.equal(await style('primary-md', 'color'), rgb(await role('on-action-primary')));
    assert.equal(await style('secondary-md', 'borderTopColor'), rgb(await role('outline')));
    assert.equal(await style('ghost-md', 'backgroundColor'), 'rgba(0, 0, 0, 0)');
    assert.equal(await style('danger-md', 'color'), rgb(await role('on-error')));

    for (const [variant, hover, pressed] of [
      ['primary', 'action-primary-hover', 'action-primary-pressed'],
      ['secondary', 'surface-container-hover', 'surface-container-pressed'],
      ['ghost', 'surface-container-hover', 'surface-container-pressed'],
      ['danger', 'error-hover', 'error-pressed'],
    ]) {
      const id = `${variant}-md`;
      await page.getByTestId(id).hover();
      await settled(id, rgb(await role(hover)));
      await page.mouse.down();
      await settled(id, rgb(await role(pressed)));
      await page.mouse.up();
      await page.mouse.move(0, 0);
    }

    await page.keyboard.press('Tab');
    await page.getByTestId('primary-md').focus();
    assert.equal(await style('primary-md', 'outlineWidth'), '2px');
    assert.equal(await style('primary-md', 'outlineOffset'), '3px');
    assert.equal(await style('primary-md', 'outlineColor'), rgb(await role('focus-ring')));

    assert.equal(await style('danger-disabled', 'backgroundColor'), rgb(await role('disabled')));
    assert.equal(await style('danger-disabled', 'opacity'), '0.7');
    assert.equal(await page.getByTestId('primary-disabled').isDisabled(), true);

    const loading = page.getByTestId('primary-loading');
    assert.equal(await loading.getAttribute('aria-busy'), 'true');
    assert.equal(await loading.textContent(), 'Saving…');
    assert.equal(await loading.locator('[data-button-spinner]').count(), 1);

    const attempt = page.getByTestId('primary-try');
    await attempt.click();
    await page.waitForFunction(() => document.querySelector('[data-testid="primary-try"]').getAttribute('aria-busy') === 'true');
    await attempt.click({ force: true });
    await attempt.press('Enter');
    assert.equal(await attempt.getAttribute('aria-busy'), 'true');
    assert.equal(await attempt.getAttribute('data-saves'), '1');

    await page.getByLabel('Theme mode').selectOption('light');
    await page.getByLabel('Theme preset').selectOption('formiai');
    await page.getByLabel('Theme mode').selectOption('high-contrast');
    await settled('primary-md', rgb(await role('action-primary')));

    for (const preset of ['forge', 'formiai', 'autofund', 'neutral']) {
      for (const mode of ['light', 'dark', 'high-contrast']) {
        const cell = page.getByTestId(`matrix-${preset}-${mode}`);
        const samples = await cell.evaluate((element) => ({
          surface: getComputedStyle(element).backgroundColor,
          buttons: [...element.querySelectorAll('button')].map((button) => ({
            variant: button.dataset.variant,
            background: getComputedStyle(button).backgroundColor,
            color: getComputedStyle(button).color,
          })),
        }));
        assert.equal(samples.buttons.length, 4);
        for (const { variant, background, color } of samples.buttons) {
          const fill = background === 'rgba(0, 0, 0, 0)' ? samples.surface : background;
          assert.ok(contrast(color, fill) >= 4.5, `${preset} ${mode} ${variant}`);
        }
      }
    }

    await page.setViewportSize({ width: 375, height: 800 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
});
