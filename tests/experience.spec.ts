import { expect, test } from '@playwright/test';

test('opening explains the offer, plays the supplied film, and renders without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Less busywork.More business.');
  await expect(page.locator('.hero-description')).toContainText('AI');
  await expect(page.locator('.hero-description')).toContainText('automate');
  await expect(page.locator('.cinematic-scene')).toHaveClass(/film-loaded/);
  await expect.poll(() => page.locator('.cinematic-scene video').evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThanOrEqual(2);
  const playhead = await page.locator('.cinematic-scene video').evaluate((v: HTMLVideoElement) => v.currentTime);
  await expect.poll(() => page.locator('.cinematic-scene video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(playhead + .2);
  await expect(page.locator('.hero-description')).toHaveCSS('opacity', '1');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/home-desktop.png' });
  expect(errors).toEqual([]);
});

test('challenge tabs work with keyboard and lead to the relevant service', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Business challenges' });
  await tabs.getByRole('tab').first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: /Leads slipping away/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Give every lead a next step.');
  await page.getByRole('tabpanel').getByRole('link', { name: 'See the solution' }).click();
  await expect(page).toHaveURL(/solutions#crm-sales/);
  await expect(page.locator('#crm-sales')).toBeInViewport();
});

test('all nine solutions are available and filtering shows the right services', async ({ page }) => {
  await page.goto('/solutions');
  await expect(page.locator('.service-row')).toHaveCount(9);
  await page.getByRole('button', { name: 'Growth', exact: true }).click();
  await expect(page.locator('.service-row')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Website development', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Search engine optimization', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /All solutions/ }).click();
  await expect(page.locator('.service-row')).toHaveCount(9);
});

test('consultation form saves the request and retains an email draft with the selected service', async ({ page }) => {
  await page.route('**/api/leads', route => route.fulfill({ json: { saved: true } }));
  await page.goto('/contact?service=web-development');
  await expect(page.getByRole('checkbox', { name: 'Website development', exact: true })).toBeChecked();
  await page.getByLabel('Your name').fill('Preview Tester');
  await page.getByLabel('Work email').fill('tester@example.com');
  await page.getByLabel('Business name').fill('Example Business');
  await page.getByLabel('What could work better?', { exact: false }).fill('We would like a clearer website with an easier enquiry process.');
  const posts: string[] = [];
  page.on('request', req => { if (req.method() === 'POST') posts.push(req.url()); });
  await page.getByRole('button', { name: 'Request my discovery call' }).click();
  await expect(page.getByRole('heading', { name: 'Your request is saved.' })).toBeVisible();
  await expect(page.locator('.email-preview')).toContainText('Your call hasn’t been booked yet.');
  const link = page.getByRole('link', { name: 'Open email app' });
  await expect(link).toHaveAttribute('href', /^mailto:mohak@mokisystems.us\?/);
  expect(decodeURIComponent(await link.getAttribute('href') || '')).toContain('Website development');
  expect(posts).toHaveLength(1);
  expect(posts[0]).toContain('/api/leads');
  await page.screenshot({ path: 'artifacts/contact-desktop.png', fullPage: true });
});

test('each inner page has a real heading and working navigation', async ({ page }) => {
  for (const path of ['/solutions', '/how-it-works', '/industries', '/about', '/contact', '/privacy']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('undefined');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${path} must not overflow horizontally`).toBeTruthy();
  }
});

test('scroll sequence advances through all MOKI stages', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('.framework-section');
  for (const [index, name] of ['Map', 'Optimize', 'Kit', 'Integrate'].entries()) {
    await section.evaluate((el, i) => { const top = el.getBoundingClientRect().top + scrollY; scrollTo({ top: top + (el.clientHeight - innerHeight) * ((i + .45) / 4), behavior: 'instant' }); }, index);
    await expect(section.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(section.locator('.method-scene-title h2 > span')).toHaveCSS('opacity', '1');
  await expect(section.locator('.method-scene-copy')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'artifacts/method-desktop.png' });
});

test('the opening keeps its film and clear calls to action without presentation controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.cinematic-scene video')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Choose the visual experience' })).toHaveCount(0);
  await expect(page.getByText('Practical AI. Thoughtful automation. Real possibilities.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'SCROLL TO CONNECT' })).toHaveCount(0);
  await expect(page.locator('.site-header .brand-type')).toHaveText('MOKISYSTEMS');
  await expect(page.locator('.nav-cta')).toHaveCSS('background-color', 'rgb(36, 88, 207)');
  await expect(page.locator('.hero-actions').getByRole('link', { name: 'Book a free discovery call' })).toHaveAttribute('href', 'https://calendly.com/mohak-mokisystems/30min');
});

test('reduced motion uses a still and compact sections', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.cinematic-scene img')).toBeVisible();
  await expect(page.locator('.cinematic-scene video')).toBeHidden();
  await expect(page.locator('.framework-section')).toHaveClass(/framework-reduced/);
  await expect(page.locator('.solution-showcase')).toHaveClass(/solutions-reduced/);
  await expect(page.locator('.conversation-section')).toContainText('YOUR NEXT');
});

for (const width of [375, 390, 768]) {
  test(`responsive layout stays in bounds at ${width}px and mobile navigation works`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    await expect(page.locator('.hero-description')).toHaveCSS('opacity', '1');
    await page.screenshot({ path: `artifacts/home-${width}.png` });
    if (width < 700) {
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: /Solutions/ }).click();
      await expect(page).toHaveURL(/solutions/);
      await expect(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false');
    }
    for (const path of ['/solutions', '/industries', '/about', '/contact']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} at ${width}px`).toBeTruthy();
    }
  });
}
