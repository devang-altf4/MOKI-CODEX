import { expect, test } from '@playwright/test';

for (const width of [1440, 634, 390]) {
  test(`all three chapter changes sweep the camera and reveal the next text at ${width}px`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    const section = page.locator('#method'), stage = section.locator('.method-live-stage'), heading = section.locator('.method-scene-title h2');
    const go = async (p:number) => {
      const actual = await section.evaluate((el,progress) => {
        scrollTo({top:el.getBoundingClientRect().top+scrollY+(el.clientHeight-innerHeight)*progress,behavior:'instant'});
        return Math.min(1,Math.max(0,-el.getBoundingClientRect().top/(el.clientHeight-innerHeight)));
      },p);
      await expect.poll(async () => Math.abs(Number(await section.getAttribute('data-motion-progress'))-actual),{intervals:[100]}).toBeLessThan(.0001);
    };
    for (const [index,boundary] of [.25,.5,.75].entries()) {
      await go(boundary-.08);
      await expect(heading).toHaveCSS('opacity','1');
      const resting = await stage.boundingBox();
      await go(boundary);
      await expect.poll(() => section.getAttribute('data-camera-sweep').then(Number)).toBeGreaterThan(.99);
      await expect.poll(() => heading.evaluate(el=>Number(getComputedStyle(el).opacity))).toBeLessThan(.02);
      expect((await stage.boundingBox())!.width).toBeGreaterThan(resting!.width*1.1);
      await page.screenshot({path:`artifacts/method-sweep-${width}-${index}.png`});
      await go(boundary+.075);
      await expect(heading).toHaveCSS('opacity','1');
      await expect(section.locator('.method-scene-copy')).toHaveCSS('opacity','1');
      await expect(section.locator('.method-tabs button').nth(index+1)).toHaveAttribute('aria-pressed','true');
      // Reverse through the same camera beat without replaying a timed entrance.
      await go(boundary);
      await expect.poll(() => heading.evaluate(el=>Number(getComputedStyle(el).opacity))).toBeLessThan(.02);
      await go(boundary-.08);
      await expect(heading).toHaveCSS('opacity','1');
      await expect(section.locator('.method-tabs button').nth(index)).toHaveAttribute('aria-pressed','true');
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  });
}

test('manual reduced-motion chapters remain readable without a camera sweep', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  const section=page.locator('#method');
  for (const name of ['Map','Optimize','Kit','Integrate']) {
    await section.getByRole('button',{name,exact:true}).click();
    await expect(section.locator('.method-live-stage')).toHaveCSS('transform','none');
    await expect(section.locator('.method-scene-title h2')).toHaveCSS('opacity','1');
    await expect(section.locator('.method-scene-copy')).toHaveCSS('opacity','1');
  }
});

test('the tools visibly move within a chapter, reverse exactly, and have no playback timer', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#method'), scene = section.locator('.method-live-stage');
  const go = async (p: number) => {
    await section.evaluate((el, progress) => scrollTo({ top: el.getBoundingClientRect().top + scrollY + (el.clientHeight - innerHeight) * progress, behavior: 'instant' }), p);
    await expect.poll(async () => Math.abs(Number(await section.getAttribute('data-motion-progress')) - p)).toBeLessThan(.0001);
  };
  await go(.02);
  await expect(scene).toHaveAttribute('data-renderer', 'webgl', { timeout:20000 });
  await expect(section.locator('video')).toHaveCount(0);
  await expect(section.getByRole('button', { name: /Pause|Replay/ })).toHaveCount(0);
  // Isolate the visible GPU surface: changing text or progress cannot satisfy this check.
  await page.addStyleTag({ content: '#method .method-scene > :not(.method-live-stage) { visibility:hidden !important; }' });
  const first = await scene.screenshot();
  await go(.18);
  await expect(section.locator('.method-tabs button').first()).toHaveAttribute('aria-pressed','true');
  const moved = await scene.screenshot();
  expect(moved.equals(first)).toBeFalsy();
  await go(.02);
  // The same scroll position restores the same physical arrangement.
  await expect.poll(async () => (await scene.screenshot()).equals(first)).toBeTruthy();
  const progress = await section.getAttribute('data-motion-progress');
  const renders = await scene.locator('.method-webgl').getAttribute('data-render-count');
  await page.waitForTimeout(350);
  expect(await section.getAttribute('data-motion-progress')).toBe(progress);
  expect(await scene.locator('.method-webgl').getAttribute('data-render-count')).toBe(renders);
});

test('the CSS 3D fallback also follows scroll if WebGL cannot initialize', async ({ page }) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: any[]) { if (kind.startsWith('webgl')) return null; return (get as any).call(this, kind, ...args); } as any;
  });
  await page.goto('/');
  const section = page.locator('#method'), tile = section.locator('.method-fallback-tool').first();
  await section.getByRole('button', { name:'Map', exact:true }).click();
  await expect(section.locator('.method-live-stage')).toHaveAttribute('data-renderer', 'css');
  const before = await tile.evaluate(el => getComputedStyle(el).transform);
  await section.getByRole('button', { name:'Kit', exact:true }).click();
  await expect(section.getByRole('button', { name:'Kit', exact:true })).toHaveAttribute('aria-pressed','true');
  await expect.poll(() => tile.evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  await expect(section.locator('.method-fallback')).toBeVisible();
});

test('continuous forward and reverse scrolling presents new 3D poses', async ({ browser }) => {
  test.setTimeout(45000);
  const context = await browser.newContext({ baseURL:'http://127.0.0.1:4173', viewport:{width:1280,height:800}, recordVideo:{dir:'artifacts/live-method-video',size:{width:1280,height:800}} });
  const recordStarted = Date.now(), page = await context.newPage(), video = page.video()!;
  try {
    await page.goto('/');
    const section = page.locator('#method');
    await section.getByRole('button',{name:'Map',exact:true}).click();
    await expect(section.locator('.method-live-stage')).toHaveAttribute('data-renderer','webgl',{timeout:20000});
    const videoStartSeconds = (Date.now()-recordStarted)/1000;
    const metrics = await section.evaluate(el => new Promise<{fps:number;p95:number;poses:number;maxStale:number}>(resolve => {
      const root = el as HTMLElement, surface = root.querySelector<HTMLElement>('.method-webgl')!;
      const top = root.getBoundingClientRect().top + scrollY, travel = root.clientHeight-innerHeight, start = performance.now();
      const times:number[] = [], poses = new Set<string>(); let last = start, changed = start, stale = 0, previous = '';
      const tick = (now:number) => {
        const t = Math.min(1,(now-start)/14000), moving = t < .4 || (t > .55 && t < .95);
        const p = t < .4 ? t/.4 : t < .55 ? 1 : t < .95 ? 1-(t-.55)/.4 : 0;
        scrollTo({top:top+travel*p,behavior:'instant'});
        const pose = surface.dataset.renderProgress || '';
        if (!moving) changed=now;
        if (pose !== previous) { if(moving) stale=Math.max(stale,now-changed); changed=now; previous=pose; poses.add(pose); }
        times.push(now-last);last=now;
        if(t<1) requestAnimationFrame(tick);
        else { times.sort((a,b)=>a-b);resolve({fps:times.length/((now-start)/1000),p95:times[Math.floor(times.length*.95)],poses:poses.size,maxStale:stale}); }
      };requestAnimationFrame(tick);
    }));
    await test.info().attach('live-scroll-performance.json',{body:JSON.stringify(metrics,null,2),contentType:'application/json'});
    console.log('Live 3D scroll:',JSON.stringify({...metrics,videoStartSeconds}));
    expect(metrics.poses).toBeGreaterThan(120);
    expect(metrics.fps).toBeGreaterThan(45);
    expect(metrics.p95).toBeLessThan(40);
    expect(metrics.maxStale).toBeLessThan(150);
    await page.screenshot({path:'artifacts/method-live-desktop.png'});
  } finally { await context.close(); await video.saveAs('artifacts/moki-live-scroll.webm'); }
});
