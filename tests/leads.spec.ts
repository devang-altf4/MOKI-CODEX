import { expect, test } from '@playwright/test';

test('demo invitation opens only on request, including after a fresh visit and dismissal', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/');
  const popup = page.getByRole('dialog', { name: 'Your business. Its next possibility.' });
  await expect(popup).toBeHidden();
  await page.clock.runFor(30_000);
  await expect(popup).toBeHidden();
  await page.reload();
  await page.clock.runFor(8500);
  await expect(popup).toBeHidden();
  await page.locator('.site-header').getByRole('button', { name: 'Request a demo', exact: true }).click();
  await expect(popup).toBeVisible();
  await page.getByRole('button', { name: 'Close demo request' }).press('Escape');
  await page.clock.runFor(30_000);
  await expect(popup).toBeHidden();
  await page.locator('.site-header').getByRole('button', { name: 'Request a demo', exact: true }).click();
  await expect(popup).toBeVisible();
  await expect(page.locator('.footer-word')).toHaveCount(0);
});

test('demo request sends all checked services and includes them in the email draft', async ({ page }) => {
  const submissions: { services: string[] }[] = [];
  await page.route('**/api/leads', async route => {
    submissions.push(route.request().postDataJSON());
    await route.fulfill({ json: { saved: true } });
  });
  await page.goto('/');
  await page.locator('.site-header').getByRole('button', { name: 'Request a demo', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Your business. Its next possibility.' });
  await popup.getByRole('checkbox', { name: 'Workflow automation', exact: true }).check();
  await popup.getByRole('checkbox', { name: 'Website development', exact: true }).check();
  await popup.getByRole('checkbox', { name: 'Search engine optimization', exact: true }).check();
  await popup.getByRole('checkbox', { name: 'Search engine optimization', exact: true }).uncheck();
  await popup.getByLabel('Your name').fill('Preview Tester');
  await popup.getByLabel('Work email').fill('tester@example.com');
  await popup.getByLabel('Business name').fill('Example Business');
  await popup.getByLabel('What could work better?').fill('We would like a clearer website and simpler business workflows.');
  await popup.getByRole('button', { name: 'Request my free demo' }).click();
  await expect(popup.getByRole('heading', { name: 'Your request is saved.' })).toBeVisible();
  expect(submissions).toHaveLength(1);
  expect(submissions[0].services).toEqual(['workflow-automation', 'web-development']);
  const draft = decodeURIComponent(await popup.getByRole('link', { name: 'Open email app' }).getAttribute('href') || '');
  expect(draft).toContain('Interested in: Workflow automation, Website development');
  expect(draft).not.toContain('Search engine optimization');
});

test('a failed save keeps the email option and retries the same ID before showing success', async ({ page }) => {
  await page.addInitScript(() => { try { sessionStorage.setItem('moki-demo-seen', '1'); } catch { /* Storage may be disabled in this test. */ } });
  const ids: string[] = [];
  await page.route('**/api/leads', async route => {
    ids.push(route.request().postDataJSON().requestId);
    await route.fulfill({ status: ids.length === 1 ? 503 : 200, json: ids.length === 1 ? { error: 'Your request could not be saved right now. Please retry, or use the email draft below.' } : { saved: true } });
  });
  await page.goto('/contact?service=web-development');
  await page.getByLabel('Your name').fill('Preview Tester');
  await page.getByLabel('Work email').fill('tester@example.com');
  await page.getByLabel('Business name').fill('Example Business');
  await page.getByLabel('What could work better?').fill('We would like an easier enquiry process for our business.');
  await page.getByRole('button', { name: 'Request my discovery call' }).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByRole('heading', { name: 'Your request is saved.' })).toHaveCount(0);
  await expect(page.getByLabel('Business name')).toHaveValue('Example Business');
  await expect(page.getByRole('link', { name: 'Open email app' })).toHaveAttribute('href', /^mailto:/);
  await page.getByRole('button', { name: 'Retry saving request' }).click();
  await expect(page.getByRole('heading', { name: 'Your request is saved.' })).toBeVisible();
  expect(ids).toHaveLength(2);
  expect(ids[0]).toBe(ids[1]);
  await expect(page.getByRole('button', { name: 'Retry saving request' })).toHaveCount(0);
});

test('phone demo modal fits, keeps close available while scrolling, and restores navigation', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('moki-demo-seen', '1'));
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Request a demo' }).click();
  await expect(page.locator('.demo-dialog')).toBeVisible();
  await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  await page.getByLabel('What could work better?').fill('A preview of our business workflow.');
  const close = await page.getByRole('button', { name: 'Close demo request' }).boundingBox();
  expect(close!.y).toBeGreaterThanOrEqual(0);
  expect(close!.y + close!.height).toBeLessThanOrEqual(640);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await page.getByRole('button', { name: 'Close demo request' }).click();
  await expect(page.locator('.demo-dialog')).toBeHidden();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});
