import { expect, test } from '@playwright/test';

const bookingUrl = 'https://calendly.com/mohak-mokisystems/30min';

test('existing demo and discovery buttons link to Calendly without an invitation popup', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/');
  await page.clock.runFor(30_000);
  await expect(page.locator('.demo-dialog')).toHaveCount(0);
  await expect(page.locator('.site-header').getByRole('link', { name: 'Request a demo', exact: true })).toHaveAttribute('href', bookingUrl);
  await expect(page.locator('.hero-actions').getByRole('link', { name: 'Book a free discovery call' })).toHaveAttribute('href', bookingUrl);
  await expect(page.locator('.closing-cta').getByRole('link', { name: 'Book a free discovery call' })).toHaveAttribute('href', bookingUrl);
  await expect(page.locator('.site-footer').getByRole('link', { name: 'Request a demo', exact: true })).toHaveAttribute('href', bookingUrl);
  await expect(page.locator('.footer-word')).toHaveCount(0);
});

test('contact enquiries retain all checked services and their email draft', async ({ page }) => {
  const submissions: { services: string[] }[] = [];
  await page.route('**/api/leads', async route => {
    submissions.push(route.request().postDataJSON());
    await route.fulfill({ json: { saved: true } });
  });
  await page.goto('/contact');
  await page.getByRole('checkbox', { name: 'Workflow automation', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Website development', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Search engine optimization', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Search engine optimization', exact: true }).uncheck();
  await page.getByLabel('Your name').fill('Preview Tester');
  await page.getByLabel('Work email').fill('tester@example.com');
  await page.getByLabel('Business name').fill('Example Business');
  await page.getByLabel('What could work better?').fill('We would like a clearer website and simpler business workflows.');
  await page.getByRole('button', { name: 'Request my discovery call' }).click();
  await expect(page.getByRole('heading', { name: 'Your request is saved.' })).toBeVisible();
  expect(submissions).toHaveLength(1);
  expect(submissions[0].services).toEqual(['workflow-automation', 'web-development']);
  const draft = decodeURIComponent(await page.getByRole('link', { name: 'Open email app' }).getAttribute('href') || '');
  expect(draft).toContain('Interested in: Workflow automation, Website development');
  expect(draft).not.toContain('Search engine optimization');
});

test('a failed save keeps the email option and retries the same ID before showing success', async ({ page }) => {
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

test('phone navigation provides Calendly booking and keeps the enquiry form accessible', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const menu = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(menu.getByRole('link', { name: 'Request a demo', exact: true })).toHaveAttribute('href', bookingUrl);
  await menu.getByRole('link', { name: /Start a conversation/ }).click();
  await expect(page).toHaveURL(/contact/);
  await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  await page.getByLabel('What could work better?').fill('A preview of our business workflow.');
  await page.getByRole('checkbox', { name: 'Website development', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Search engine optimization', exact: true }).check();
  await expect(page.getByRole('checkbox', { name: 'Website development', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Search engine optimization', exact: true })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await expect(page.locator('.demo-dialog')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});
