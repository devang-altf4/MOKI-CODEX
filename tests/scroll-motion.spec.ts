import { expect, test } from '@playwright/test';

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
    const canvas = method.locator('canvas');
    await method.evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }));
    await expect(method.getByRole('button', { name: 'Map', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => canvas.evaluate((el: HTMLCanvasElement) => {
      const pixels = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data;
      return pixels.some((value, index) => index % 4 !== 3 && value > 100);
    })).toBeTruthy();
    const firstFrame = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL('image/webp', .1));
    await method.evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY + (el.clientHeight - innerHeight) * .97, behavior: 'instant' }));
    await expect(method.getByRole('button', { name: 'Integrate', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(method.locator('.method-scene-title h2 > span')).toHaveCSS('opacity', '1');
    await expect.poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL('image/webp', .1))).not.toBe(firstFrame);
    await expect(method.locator('.method-scene-copy')).toHaveCSS('opacity', '1');
    await expect.poll(() => method.getAttribute('data-painted-frame').then(Number)).toBeGreaterThan(viewport.width <= 700 ? 110 : 175);
    expect(Number(await method.getAttribute('data-cached-frames'))).toBeLessThanOrEqual(viewport.width <= 700 ? 14 : 20);
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

test('the method keeps drawing during a continuous scroll without retaining the whole film', async ({ page }) => {
  await page.setViewportSize({ width: 1828, height: 938 });
  await page.goto('/');
  const section = page.locator('.scroll-method');
  await section.evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }));
  await expect(section).toHaveAttribute('data-sequence-ready', 'true');
  await expect.poll(() => section.getAttribute('data-painted-frame')).not.toBeNull();
  const metrics = await section.evaluate(el => new Promise<{ uniqueFrames: number; maxStaleMs: number; maxCached: number; p95FrameMs: number; holds: unknown[] }>(resolve => {
    const root = el as HTMLElement;
    const start = performance.now(), top = root.getBoundingClientRect().top + scrollY, travel = root.offsetHeight - innerHeight;
    const unique = new Set<string>(); const intervals: number[] = [];
    const holds: unknown[] = [];
    let previousTime = start, lastChange = start, lastFrame = '', maxStaleMs = 0, maxCached = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 3000);
      scrollTo({ top: top + travel * (.03 + p * .9), behavior: 'instant' });
      const frame = root.dataset.paintedFrame || '';
      maxStaleMs = Math.max(maxStaleMs, now - lastChange);
      if (frame !== lastFrame) { if (now - lastChange > 100) holds.push({ from: lastFrame, to: frame, afterMs: Math.round(now - start), holdMs: Math.round(now - lastChange), requested: root.dataset.frame }); lastFrame = frame; lastChange = now; unique.add(frame); }
      maxCached = Math.max(maxCached, Number(root.dataset.cachedFrames || 0));
      intervals.push(now - previousTime); previousTime = now;
      if (p < 1) requestAnimationFrame(step);
      else { if (now - lastChange > 100) holds.push({ finalFrame: lastFrame, requested: root.dataset.frame, holdMs: Math.round(now - lastChange) }); intervals.sort((a, b) => a - b); resolve({ uniqueFrames: unique.size, maxStaleMs, maxCached, p95FrameMs: intervals[Math.floor(intervals.length * .95)], holds }); }
    };
    requestAnimationFrame(step);
  }));
  await test.info().attach('scroll-performance.json', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
  console.log('Continuous method scroll:', JSON.stringify(metrics));
  expect(metrics.uniqueFrames).toBeGreaterThan(40);
  expect(metrics.maxStaleMs).toBeLessThan(250);
  expect(metrics.maxCached).toBeLessThanOrEqual(20);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 634, height: 700 }, { width: 390, height: 844 }]) {
  test(`solutions and conversation move with scrolling at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const section = page.locator('.solution-showcase');
    const tabs = section.getByRole('tablist');
    const before = await section.locator('.solution-node').first().evaluate(el => getComputedStyle(el).transform);
    for (const [index, label] of ['Too much busywork', 'Leads slipping away', 'Data everywhere', 'An invisible website'].entries()) {
      await section.evaluate((el, i) => scrollTo({ top: el.getBoundingClientRect().top + scrollY + (el.clientHeight - innerHeight) * ((i + .4) / 4), behavior: 'instant' }), index);
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
