import { expect, test } from '@playwright/test';

// The timed lead popup has dedicated coverage; keep other journeys uninterrupted.
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { try { sessionStorage.setItem('moki-demo-seen', '1'); } catch { /* Storage may be disabled in this test. */ } }); });

for (const viewport of [{ width: 1440, height: 900 }, { width: 634, height: 700 }, { width: 390, height: 844 }]) {
  test(`scroll visibly drives and reverses the scenes at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('.hero-description')).toHaveCSS('opacity', '1');
    await page.evaluate(() => document.fonts.ready);
    const art = page.locator('.hero-art');
    const initial = await art.boundingBox();

    // Ordinary wheel input should enlarge the scene while its viewport stays pinned.
    await page.mouse.wheel(0, viewport.height * .55);
    await expect.poll(async () => (await art.boundingBox())!.width).toBeGreaterThan(initial!.width * 1.2);
    await expect.poll(() => page.locator('.hero-pin').evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(1);
    const remainingTravel = await page.locator('.hero-scroll-track').evaluate(el => (el.clientHeight - innerHeight) * .94 - scrollY);
    await page.mouse.wheel(0, remainingTravel);
    await expect.poll(() => page.locator('.hero-next').evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.9);
    await page.screenshot({ path: `artifacts/scroll-hero-${viewport.width}.png` });

    const method = page.locator('.scroll-method');
    const scene = method.locator('.method-live-stage');
    await method.evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }));
    await expect(method.getByRole('button', { name: 'Map', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(scene).toHaveAttribute('data-renderer', 'webgl', {timeout:20000});
    await expect(scene.locator('canvas')).toBeVisible();
    await method.evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY + (el.clientHeight - innerHeight) * .97, behavior: 'instant' }));
    await expect(method.getByRole('button', { name: 'Integrate', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(method.locator('.method-scene-title h2 > span')).toHaveCSS('opacity', '1');
    await expect.poll(() => method.getAttribute('data-motion-progress').then(Number)).toBeGreaterThan(.96);
    await expect(method.locator('.method-scene-copy')).toHaveCSS('opacity', '1');
    await expect(method.locator('video')).toHaveCount(0);
    await page.screenshot({ path: `artifacts/scroll-method-${viewport.width}.png` });

    // Both directions follow the scroll; revisiting the start restores the first chapter.
    await method.evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }));
    await expect(method.getByRole('button', { name: 'Map', exact: true })).toHaveAttribute('aria-pressed', 'true');
    const line = page.locator('.kinetic-line-one');
    await line.evaluate(el => scrollTo({ top: el.parentElement!.getBoundingClientRect().top + scrollY - innerHeight * .65, behavior: 'instant' }));
    const before = await line.evaluate(el => getComputedStyle(el).transform);
    await page.mouse.wheel(0, viewport.height * .5);
    await expect.poll(() => line.evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
    await page.screenshot({ path: `artifacts/scroll-type-${viewport.width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();

    await page.getByRole('link', { name: 'Let’s talk', exact: true }).click();
    await expect(page).toHaveURL(/contact/);
    await page.getByRole('link', { name: 'Moki Systems home', exact: true }).first().click();
    await expect(page.locator('.hero-copy')).toHaveCSS('visibility', 'visible');
    await expect.poll(async () => Math.abs((await art.boundingBox())!.width - initial!.width)).toBeLessThan(2);
    expect(errors).toEqual([]);
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 634, height: 700 }, { width: 390, height: 844 }]) {
  test(`solutions and conversation move with scrolling at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const section = page.locator('.solution-showcase');
    const tabs = section.getByRole('tablist');
    const before = await section.locator('.solution-node').first().evaluate(el => getComputedStyle(el).transform);
    for (const [index, label] of ['Too much busywork', 'Leads slipping away', 'Data everywhere', 'An invisible website'].entries()) {
      if (viewport.width <= 700) await tabs.getByRole('tab', { name: new RegExp(label) }).click();
      else await section.evaluate((el, i) => scrollTo({ top: el.getBoundingClientRect().top + scrollY + (el.clientHeight - innerHeight) * ((i + .4) / 4), behavior: 'instant' }), index);
      await expect(tabs.getByRole('tab', { name: new RegExp(label) })).toHaveAttribute('aria-selected', 'true');
    }
    await expect.poll(() => section.locator('.solution-node').first().evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
    await page.screenshot({ path: `artifacts/solutions-motion-${viewport.width}.png` });
    const console = page.locator('.conversation-console');
    await page.locator('.conversation-section').evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * .7, behavior: 'instant' }));
    const initial = await console.evaluate(el => getComputedStyle(el).transform);
    await page.mouse.wheel(0, viewport.height * .6);
    await expect.poll(() => console.evaluate(el => getComputedStyle(el).transform)).not.toBe(initial);
    await expect(console.getByLabel('Your message to Moki AI')).toBeVisible();
    await page.screenshot({ path: `artifacts/conversation-motion-${viewport.width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  });
}
