import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

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
    await page.goto(server.resolvedUrls.local[0]);
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
