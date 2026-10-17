import { expect, test } from '@playwright/test';

test('light is the first visit default; the accessible switch remembers a choice across routes and reloads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Switch to dark mode' }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(8, 10, 15)');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBe('#ffffff');
});

test('blocked storage still allows either theme without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };
  });
  await page.goto('/contact');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
  test(`both themes keep navigation, CTAs, routes and chat usable at ${width}px`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    for (const theme of ['light', 'dark'] as const) {
      if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark mode' }).click();
      const controls = await page.locator('.nav-actions > *').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').map(node => { const r = node.getBoundingClientRect(); return {x:r.x,right:r.right,y:r.y,bottom:r.bottom}; }));
      for (let index = 0; index < controls.length; index++) {
        expect(controls[index].right).toBeLessThanOrEqual(width);
        if (index) expect(controls[index].x).toBeGreaterThanOrEqual(controls[index - 1].right);
      }
      if (width < 700) {
        await page.getByRole('button', {name: 'Open navigation'}).click();
        await expect(page.getByRole('navigation', {name:'Mobile navigation'})).toBeVisible();
        await page.getByRole('button', {name:'Close navigation'}).click();
      }
      await page.screenshot({path:`artifacts/theme-${theme}-home-${width}.png`});
      await page.getByRole('button', {name:'Open Moki AI chat',exact:true}).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', {name:'Close Moki AI chat',exact:true}).click();
      for (const path of ['/solutions','/how-it-works','/industries','/about','/contact','/privacy']) {
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
        await expect(page.getByRole('heading',{level:1})).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),path).toBeTruthy();
        if (theme === 'light' && path === '/contact') {
          await expect(page.getByLabel('Your name')).toHaveCSS('background-color','rgb(255, 255, 255)');
          await expect(page.getByLabel('Your name')).toHaveCSS('color','rgb(21, 37, 64)');
        }
        if (width === 390 || width === 1440) await page.screenshot({path:`artifacts/theme-${theme}-${path.slice(1)}-${width}.png`});
      }
      await page.goto('/');
    }
    expect(errors).toEqual([]);
  });
}

test('switching theme in the middle of a chapter keeps its WebGL scene and scroll position', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#method');
  await section.getByRole('button',{name:'Kit',exact:true}).click();
  await expect(section.locator('.method-webgl')).toHaveAttribute('data-render-progress',/0\.68/,{timeout:15000});
  const before = await page.evaluate(() => ({ y:scrollY, progress:document.querySelector('#method')?.getAttribute('data-motion-progress') }));
  await section.locator('canvas').evaluate(canvas => canvas.setAttribute('data-theme-check','same-scene'));
  await page.getByRole('button',{name:'Switch to dark mode'}).click();
  await expect(section.locator('.method-scene')).toHaveCSS('background-color','rgb(8, 10, 15)');
  await expect(section.locator('canvas')).toHaveAttribute('data-theme-check','same-scene');
  expect(await page.evaluate(() => scrollY)).toBe(before.y);
  await page.getByRole('button',{name:'Switch to light mode'}).click();
  await expect(section.locator('.method-scene')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(section.locator('canvas')).toHaveAttribute('data-theme-check','same-scene');
  expect(Number(await section.getAttribute('data-motion-progress'))).toBeCloseTo(Number(before.progress),3);
  await page.screenshot({path:'artifacts/theme-light-method-desktop.png'});
});
