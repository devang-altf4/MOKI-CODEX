import { expect, test } from '@playwright/test';

// The timed lead popup has dedicated coverage; keep other journeys uninterrupted.
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { try { sessionStorage.setItem('moki-demo-seen', '1'); } catch { /* Storage may be disabled in this test. */ } }); });
import { copyFile } from 'node:fs/promises';

for (const width of [1440, 634, 390]) {
  test(`four chapters travel in different directions and reveal readable text at ${width}px`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    const section = page.locator('#method'), stage = section.locator('.method-live-stage'), heading = section.locator('.method-scene-title h2');
    const go = async (p:number) => {
      const actual = await section.evaluate((el,progress) => {
        scrollTo({top:el.getBoundingClientRect().top+scrollY+(el.clientHeight-innerHeight)*progress,behavior:'instant'});
        return Math.min(1,Math.max(0,-el.getBoundingClientRect().top/(el.clientHeight-innerHeight)));
      },p);
      await expect.poll(async () => Math.abs(Number(await section.getAttribute('data-motion-progress'))-actual),{intervals:[100],timeout:15000}).toBeLessThan(.0001);
    };
    const cameraX = () => stage.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41);
    await go(0);
    const positions = [await cameraX()];
    for (const [index,p] of [.24,.49,.74,1].entries()) {
      await go(p);
      positions.push(await cameraX());
    }
    const movement = width > 700 ? 40 : 5;
    expect(positions[1]).toBeLessThan(positions[0]-movement);
    expect(positions[2]).toBeLessThan(positions[1]-movement);
    expect(positions[3]).toBeGreaterThan(positions[2]+movement*2);
    expect(positions[4]).toBeLessThan(positions[3]-movement);
    for (const [index,p] of [.12,.4,.67,.94].entries()) {
      await go(p);
      await expect(heading).toHaveCSS('opacity','1');
      await expect(section.locator('.method-scene-copy')).toHaveCSS('opacity','1');
      await expect(section.locator('.method-tabs button').nth(index)).toHaveAttribute('aria-pressed','true');
      await page.screenshot({path:`artifacts/method-journey-${width}-${index}.png`});
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  });
}

test('a large scroll jump eases through the transformation instead of skipping instantly', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#method');
  await section.getByRole('button',{name:'Map',exact:true}).click();
  await expect.poll(()=>section.getAttribute('data-motion-progress').then(Number)).toBeLessThan(.04);
  const probe = await section.evaluate(el=>new Promise<{before:number;after:number;elapsed:number}>(resolve=>{
    const before=Number((el as HTMLElement).dataset.motionProgress), start=performance.now();
    scrollTo({top:el.getBoundingClientRect().top+scrollY+(el.clientHeight-innerHeight)*.85,behavior:'instant'});
    const sample=(now:number)=>{ if(now-start<300) requestAnimationFrame(sample); else resolve({before,after:Number((el as HTMLElement).dataset.motionProgress),elapsed:now-start}); };
    requestAnimationFrame(sample);
  }));
  // Measure in the page so browser-driver latency cannot turn 300 ms into several seconds.
  expect(probe.after-probe.before).toBeLessThanOrEqual(probe.elapsed/1000*.145+.005);
  expect(probe.after).toBeLessThan(.2);
  await expect(section.getByRole('button',{name:'Integrate',exact:true})).toHaveAttribute('aria-pressed','true',{timeout:12000});
});

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
    const actual=await section.evaluate((el, progress) => {
      scrollTo({ top: el.getBoundingClientRect().top + scrollY + (el.clientHeight - innerHeight) * progress, behavior: 'instant' });
      return Math.min(1,Math.max(0,-el.getBoundingClientRect().top/(el.clientHeight-innerHeight)));
    }, p);
    await expect.poll(async () => Math.abs(Number(await section.getAttribute('data-motion-progress')) - actual)).toBeLessThan(.000006);
  };
  await go(.02);
  await expect(scene).toHaveAttribute('data-renderer', 'webgl', { timeout:20000 });
  await expect(section.locator('video')).toHaveCount(0);
  await expect(section.getByRole('button', { name: /Pause|Replay/ })).toHaveCount(0);
  // Isolate the visible GPU surface: changing text or progress cannot satisfy this check.
  await page.addStyleTag({ content: '#method .method-scene > :not(.method-live-stage), .site-header, .assistant-launcher { visibility:hidden !important; }' });
  // Viewport capture leaves scroll untouched; a rotated element capture can auto-scroll.
  const first = await page.screenshot();
  await go(.18);
  await expect(section.locator('.method-tabs button').first()).toHaveAttribute('aria-pressed','true');
  const moved = await page.screenshot();
  expect(moved.equals(first)).toBeFalsy();
  await go(.02);
  // The same scroll position restores the same physical arrangement.
  await expect.poll(async () => (await page.screenshot()).equals(first)).toBeTruthy();
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
  test.setTimeout(90000);
  const context = await browser.newContext({ baseURL:'http://127.0.0.1:4173', viewport:{width:1280,height:800}, recordVideo:{dir:'artifacts/live-method-video',size:{width:1280,height:800}} });
  const recordStarted = Date.now(), page = await context.newPage(), video = page.video()!;
  try {
    await page.goto('/');
    const section = page.locator('#method');
    await section.getByRole('button',{name:'Map',exact:true}).click();
    await expect(section.locator('.method-live-stage')).toHaveAttribute('data-renderer','webgl',{timeout:20000});
    await section.evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY,behavior:'instant'}));
    await expect.poll(()=>section.getAttribute('data-motion-progress').then(Number)).toBe(0);
    const videoStartSeconds = (Date.now()-recordStarted)/1000;
    const metrics = await section.evaluate(el => new Promise<{fps:number;p95:number;poses:number;maxStale:number;maxFrame:number;stalls:{at:number;duration:number;target:number;pose:string;drawMs:string;visible:string}[]}>(resolve => {
      const root = el as HTMLElement, surface = root.querySelector<HTMLElement>('.method-webgl')!;
      const top = root.getBoundingClientRect().top + scrollY, travel = root.clientHeight-innerHeight, start = performance.now();
      const times:number[] = [], poses = new Set<string>(), stalls:{at:number;duration:number;target:number;pose:string;drawMs:string;visible:string}[]=[]; let last = start, changed = start, stale = 0, previous = '';
      const tick = (now:number) => {
        const t = Math.min(1,(now-start)/40000), moving = t < .4 || (t > .55 && t < .95);
        const p = t < .4 ? t/.4 : t < .55 ? 1 : t < .95 ? 1-(t-.55)/.4 : 0;
        scrollTo({top:top+travel*p,behavior:'instant'});
        const pose = surface.dataset.renderProgress || '';
        if (!moving) changed=now;
        if (pose !== previous) {
          if(moving) { const duration=now-changed; stale=Math.max(stale,duration); if(duration>100) stalls.push({at:(now-start)/1000,duration,target:p,pose,drawMs:surface.dataset.drawMs||'',visible:document.visibilityState}); }
          changed=now; previous=pose; poses.add(pose);
        }
        times.push(now-last);last=now;
        if(t<1) requestAnimationFrame(tick);
        else { times.sort((a,b)=>a-b);resolve({fps:times.length/((now-start)/1000),p95:times[Math.floor(times.length*.95)],poses:poses.size,maxStale:stale,maxFrame:times[times.length-1],stalls}); }
      };requestAnimationFrame(tick);
    }));
    await test.info().attach('live-scroll-performance.json',{body:JSON.stringify(metrics,null,2),contentType:'application/json'});
    console.log('Live 3D scroll:',JSON.stringify({...metrics,videoStartSeconds}));
    expect(metrics.poses).toBeGreaterThan(120);
    expect(metrics.fps).toBeGreaterThan(45);
    expect(metrics.p95).toBeLessThan(40);
    expect(metrics.maxStale).toBeLessThan(150);
    await page.screenshot({path:'artifacts/method-live-desktop.png'});
  } finally {
    await context.close();
    // The browser's local recording avoids re-streaming a long video through the driver.
    await copyFile(await video.path(), 'artifacts/moki-directional-scroll.webm');
  }
});
