import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

test('playground changes scoped themes, exports files and preserves V1 styling', async () => {
  const server = await createServer({ configFile: false, root: join(root, 'playground/theme-v2'), server: { host: '127.0.0.1', port: 0, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(server.resolvedUrls.local[0]);
    const v1 = page.getByRole('button', { name: 'Existing V1 button' });
    await v1.waitFor();
    await page.locator('#palettes .palette').first().waitFor();
    const v1Before = await v1.evaluate((element) => getComputedStyle(element).backgroundColor);
    const comparisonBefore = await page.locator('#comparison').evaluate((element) => getComputedStyle(element).backgroundColor);
    const forgePrimary = await page.locator('#preview').evaluate((element) => getComputedStyle(element).getPropertyValue('--cf-v2-primary').trim());
    const evidence = process.env.THEME_V2_EVIDENCE_DIR;
    if (evidence) { await mkdir(evidence, { recursive: true }); await page.screenshot({ path: join(evidence, 'forge-dark.png'), fullPage: true }); }
    await page.getByLabel('Preset').selectOption('formiai');
    assert.equal(await page.getByLabel('Appearance').inputValue(), 'light');
    const formiaiPrimary = await page.locator('#preview').evaluate((element) => getComputedStyle(element).getPropertyValue('--cf-v2-primary').trim());
    assert.notEqual(formiaiPrimary, forgePrimary);
    assert.equal(await v1.evaluate((element) => getComputedStyle(element).backgroundColor), v1Before);
    assert.equal(await page.locator('#comparison').evaluate((element) => getComputedStyle(element).backgroundColor), comparisonBefore);
    if (evidence) await page.screenshot({ path: join(evidence, 'formiai-light.png'), fullPage: true });
    await page.getByLabel('Primary seed').fill('#3458bc');
    assert.notEqual(await page.locator('#preview').evaluate((element) => getComputedStyle(element).getPropertyValue('--cf-v2-primary').trim()), formiaiPrimary);
    await page.getByLabel('Error seed').fill('#b12828');
    await page.getByLabel('Appearance').selectOption('high-contrast');
    assert.equal(await page.locator('#error').textContent(), '');
    assert.ok(await page.locator('#contrast .contrast-item').count() >= 7);
    const jsonDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export JSON' }).click();
    const json = JSON.parse(await readFile(await (await jsonDownload).path(), 'utf8'));
    assert.equal(json.colors.primary, '#3458bc'); assert.equal(json.mode, 'high-contrast');
    const cssDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export CSS' }).click();
    const css = await readFile(await (await cssDownload).path(), 'utf8');
    assert.match(css, /^\.my-theme \{/); assert.match(css, /--cf-v2-primary:/);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); await server.close(); }
});
