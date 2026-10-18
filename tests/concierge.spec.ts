import { expect, test } from '@playwright/test';

test('combined widget keeps AI drafts and history when switching views and closes on navigation', async ({ page }) => {
  await page.route('**/api/chat', route => route.fulfill({ json: { reply: 'We can connect your website to a useful enquiry workflow.', service: 'web-development' } }));
  await page.goto('/');
  const launcher = page.getByRole('button', { name: 'Open Moki chat and contact' });
  await launcher.click();
  const dialog = page.getByRole('dialog', { name: 'Moki chat and contact' });
  await expect(dialog.getByText('What’s on your mind?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Ask MOKI AI' }).click();
  const input = dialog.getByLabel('Your message to Moki AI');
  await input.fill('We need a better website.');
  await dialog.getByRole('button', { name: 'Our team', exact: true }).click();
  await expect(dialog.getByRole('link', { name: 'mohak@mokisystems.us' })).toHaveAttribute('href', 'mailto:mohak@mokisystems.us');
  await dialog.getByRole('button', { name: 'AI chat', exact: true }).click();
  await expect(input).toHaveValue('We need a better website.');
  await dialog.getByRole('button', { name: 'Send message to Moki AI' }).click();
  await expect(dialog.locator('.message-assistant').last()).toContainText('enquiry workflow');
  await dialog.getByRole('link', { name: 'Website development' }).click();
  await expect(page).toHaveURL(/solutions#web-development/);
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('demo call has a complete local lifecycle without backend or device access', async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { demoMediaRequests: 0 });
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => {
      (window as unknown as { demoMediaRequests: number }).demoMediaRequests++;
      throw new Error('Devices must not be accessed by the demo.');
    };
  });
  const apiRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/')) apiRequests.push(request.url()); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Moki chat and contact' }).click();
  const dialog = page.getByRole('dialog', { name: 'Moki chat and contact' });
  await dialog.getByRole('button', { name: 'Try the call experience' }).click();
  await expect(dialog.getByText('No one is called', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Start demo call' }).click();
  await expect(dialog.getByText('Opening your demo…')).toBeVisible();
  await expect(dialog.getByText('SAMPLE CALL · PRERECORDED GREETING')).toBeVisible();
  await dialog.getByRole('button', { name: 'Toggle demo camera' }).click();
  await expect(dialog.getByRole('button', { name: 'Toggle demo camera' })).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog.getByText('Sample preview', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Toggle demo microphone' }).click();
  await expect(dialog.getByRole('button', { name: 'Toggle demo microphone' })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'End demo call' }).click();
  await expect(dialog.getByText('That’s the experience.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Replay demo' }).click();
  await dialog.getByRole('button', { name: 'Start demo call' }).click();
  await dialog.getByRole('button', { name: 'End demo call' }).click();
  await expect(dialog.getByText('That’s the experience.')).toBeVisible();
  expect(apiRequests).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as { demoMediaRequests: number }).demoMediaRequests)).toBe(0);
  await dialog.getByRole('link', { name: 'Book a discovery call' }).click();
  await expect(page).toHaveURL(/contact/);
  await expect(dialog).not.toBeVisible();
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`widget fits ${viewport.width}x${viewport.height}, keeps compose visible, and restores focus`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const launcher = page.getByRole('button', { name: 'Open Moki chat and contact' });
    await launcher.click();
    const dialog = page.getByRole('dialog', { name: 'Moki chat and contact' });
    for (const name of ['Welcome', 'AI chat', 'Our team']) {
      await dialog.getByRole('button', { name, exact: true }).click();
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
      const body = dialog.locator('.concierge-body');
      expect(await body.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBeTruthy();
      if (name === 'AI chat' && viewport.height > 450) {
        const compose = (await dialog.locator('.assistant-compose').boundingBox())!;
        const footer = (await dialog.locator('.concierge-footer').boundingBox())!;
        expect(compose.y + compose.height).toBeLessThanOrEqual(footer.y);
        expect(await dialog.locator('textarea').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
      }
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(launcher).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });
}

test('mobile video stays fixed and playing over the chapters, inline chat, and footer', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/');
  const launcher = page.getByRole('button', { name: 'Open Moki chat and contact' });
  const video = launcher.locator('video');
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2);
  const original = await video.elementHandle();
  const initial = (await launcher.boundingBox())!;
  expect(initial.width).toBe(64);
  expect(initial.height).toBe(64);
  for (const selector of ['#method', '#experience', '.site-footer']) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await expect(launcher).toBeVisible();
    await expect(video).toHaveJSProperty('paused', false);
    await expect(video).toHaveJSProperty('loop', true);
    expect(await video.evaluate((el, prior) => el === prior, original)).toBeTruthy();
    const current = (await launcher.boundingBox())!;
    expect(current).toEqual(initial);
    expect(await video.evaluate(el => getComputedStyle(el).display)).not.toBe('none');
  }
  await video.evaluate(el => { const media = el as HTMLVideoElement; media.currentTime = media.duration - .15; });
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).currentTime)).toBeLessThan(1);
  await launcher.click();
  const panel = (await page.getByRole('dialog', { name: 'Moki chat and contact' }).boundingBox())!;
  expect(panel.x).toBe(0);
  expect(panel.y).toBe(0);
  expect(panel.width).toBeGreaterThanOrEqual(392);
  expect(panel.width).toBeLessThanOrEqual(394);
  expect(panel.height).toBe(852);
});

test('desktop minimize keeps a looping video bubble instead of replacing it with an icon', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Minimize video greeting' }).click();
  const launcher = page.getByRole('button', { name: 'Open Moki chat and contact' });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const box = (await launcher.boundingBox())!;
  expect(box.width).toBe(64);
  expect(box.height).toBe(64);
  await expect(launcher.locator('video')).toHaveJSProperty('paused', false);
});
