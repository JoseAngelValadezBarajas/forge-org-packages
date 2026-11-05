import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

test('icon catalog renders public exports, filters icons, and copies import snippets', async () => {
  const server = await createServer({
    configFile: false,
    root: join(root, 'playground/icons'),
    server: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(server.resolvedUrls.local[0]);
    await page.getByRole('heading', { name: 'Icon catalog' }).waitFor();
    assert.equal(await page.locator('[data-icon-card]').count(), 59);
    assert.equal(await page.locator('[data-icon-card] svg[data-icon]').count(), 59);
    for (const name of ['Calendar', 'User', 'FileText', 'MoreHorizontal', 'Home', 'Users', 'UserPlus', 'Mail', 'Phone', 'CalendarDays', 'File', 'FilePlus', 'Copy', 'Share', 'MoreVertical', 'ChevronUp', 'PanelLeft', 'PanelRight', 'SlidersHorizontal', 'Archive', 'Star', 'HelpCircle', 'LogOut', 'EyeOff']) {
      assert.equal(await page.locator(`[data-icon-card][data-icon-name="${name}"]`).count(), 1);
    }
    assert.equal(await page.locator('[data-icon-card]').first().getAttribute('data-icon-name'), 'AlertTriangle');

    await page.getByRole('searchbox', { name: 'Search icons' }).fill('chevron');
    assert.equal(await page.locator('[data-icon-card]').count(), 4);
    assert.match(await page.locator('#result-count').textContent(), /4 icons/);

    await page.getByRole('button', { name: 'Copy Chevron import' }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "import { Chevron } from '@corefoundry-labs/forge-icons';");
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser?.close();
    await server.close();
  }
});
