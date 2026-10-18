import { expect, test } from '@playwright/test';

// The timed lead popup has dedicated coverage; keep other journeys uninterrupted.
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { try { sessionStorage.setItem('moki-demo-seen', '1'); } catch { /* Storage may be disabled in this test. */ } }); });

for (const width of [390, 1440]) {
  test(`hero and About play matching light and dark films without live grading at ${width}px`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    for (const theme of ['light', 'dark'] as const) {
      if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark mode' }).click();
      const suffix = theme === 'light' ? '-light-flow' : '';
      for (const route of ['/', '/about']) {
        if (route === '/about') await page.goto(route, { waitUntil: 'domcontentloaded' });
        const film = page.locator(route === '/' ? '.cinematic-scene video' : '.inner-visual video');
        await expect(film).toHaveCSS('filter', 'none');
        await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.currentSrc)).toContain(`moki-system-loop${suffix}.mp4`);
        await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(2);
        await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(.2);
        expect(await film.evaluate((video: HTMLVideoElement) => video.videoWidth)).toBe(1920);
        await expect(film).toHaveAttribute('poster', `/images/moki-system${suffix}.webp`);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `artifacts/native-${route === '/' ? 'hero' : 'about'}-${theme}-${width}.png` });
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await page.setViewportSize({ width: width === 390 ? 1440 : 390, height: 900 });
    const resized = '-light-flow';
    const film = page.locator('.cinematic-scene video');
    await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.currentSrc)).toContain(`moki-system-loop${resized}.mp4`);
    await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(.2);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(film).toBeHidden();
    await expect(page.locator('.cinematic-scene img')).toHaveAttribute('src', `/images/moki-system${resized}.webp`);
    expect(errors).toEqual([]);
  });
}
