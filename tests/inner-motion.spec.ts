import { expect, test } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`all four navigation pages animate their films and content at ${width}px`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of ['/solutions', '/how-it-works', '/industries', '/about']) {
      await page.goto(path);
      const hero = page.locator('.cinematic-intro'), visual = hero.locator('.inner-visual');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect.poll(() => hero.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(.15);
      const before = await visual.evaluate(el => getComputedStyle(el).transform);
      await page.mouse.wheel(0, 350);
      await expect.poll(() => visual.evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBeTruthy();
      if (path === '/how-it-works') {
        await page.locator('#method').evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY + 100, behavior: 'instant' }));
        await expect(page.locator('.method-live-stage canvas')).toBeVisible({ timeout:20000 });
      } else {
        const block = page.locator('.motion-block').first();
        await block.evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * .9, behavior: 'instant' }));
        const initial = await block.evaluate(el => getComputedStyle(el).transform);
        await page.mouse.wheel(0, 400);
        await expect.poll(() => block.evaluate(el => getComputedStyle(el).transform)).not.toBe(initial);
      }
      await page.screenshot({ path: `artifacts/inner-${path.slice(1)}-${width}.png` });
    }
    expect(errors).toEqual([]);
  });
}

test('inner pages and their filtered rows respect reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/solutions', '/how-it-works', '/industries', '/about']) {
    await page.goto(path);
    await expect(page.locator('.inner-visual video')).toBeHidden();
    await expect(page.locator('.motion-block').first()).toHaveCSS('transform', 'none');
    if (path === '/how-it-works') {
      await expect(page.locator('.method-live-stage canvas')).toHaveCount(0);
      await page.locator('#method').getByRole('button', { name: 'Integrate', exact: true }).click();
      await expect(page.locator('.method-scene-title')).toContainText('FIND');
    }
  }
  await page.goto('/solutions');
  await page.getByRole('button', { name: 'Growth', exact: true }).click();
  await expect(page.locator('.service-row')).toHaveCount(4);
  await expect(page.locator('.motion-block').last()).toHaveCSS('transform', 'none');
});
