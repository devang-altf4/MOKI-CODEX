import { expect, test } from '@playwright/test';

const sizes = [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:844,height:390}];
const overlaps = (a: {x:number;y:number;width:number;height:number}, b: {x:number;y:number;width:number;height:number}) => a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;

for (const viewport of sizes) {
  test(`phone layout keeps text, scenes and controls separate at ${viewport.width}x${viewport.height}`, async ({page}) => {
    test.setTimeout(90000);
    await page.setViewportSize(viewport);
    const errors:string[]=[]; page.on('pageerror', e=>errors.push(e.message));
    await page.goto('/');
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('.hero-description')).toHaveCSS('opacity','1');
    const actions = (await page.locator('.hero-actions').boundingBox())!;
    expect(actions.y+actions.height).toBeLessThan(viewport.height-40);
    if (viewport.width < 700) {
      const art = (await page.locator('.hero-art').boundingBox())!;
      expect(art.y).toBeGreaterThanOrEqual(actions.y+actions.height-1);
      expect(art.height).toBeGreaterThan(100);
    }
    const launcher = (await page.getByRole('button',{name:'Open Moki AI chat',exact:true}).boundingBox())!;
    expect(overlaps((await page.locator('.hero-actions').boundingBox())!,launcher)).toBeFalsy();
    const themeButton=(await page.getByRole('button',{name:'Switch to dark mode'}).boundingBox())!;
    const menuButton=(await page.getByRole('button',{name:'Open navigation',exact:true}).boundingBox())!;
    expect(overlaps(themeButton,menuButton)).toBeFalsy();
    if(viewport.width<=600) await expect(page.locator('.nav-cta')).toBeHidden();
    else expect(overlaps(themeButton,(await page.locator('.nav-cta').boundingBox())!)).toBeFalsy();
    await page.screenshot({path:`artifacts/mobile-fixed-home-${viewport.width}.png`});

    const method=page.locator('#method');
    for (const name of ['Map','Optimize','Kit','Integrate']) {
      await method.getByRole('button',{name,exact:true}).click();
      await expect(method.getByRole('button',{name,exact:true})).toHaveAttribute('aria-pressed','true');
      await expect(method.locator('.method-scene-title h2')).toHaveCSS('opacity','1');
      await expect(method.locator('.method-scene-copy')).toHaveCSS('opacity','1');
      const copy=(await method.locator('.method-scene-copy').boundingBox())!, nav=(await method.locator('.method-chapter-nav').boundingBox())!;
      expect(copy.y).toBeGreaterThan(65);
      expect(copy.y+copy.height).toBeLessThanOrEqual(nav.y+1);
      expect(nav.y+nav.height).toBeLessThanOrEqual(viewport.height+1);
      expect(await method.locator('.method-scene-copy p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(13);
      for (const button of await method.locator('.method-tabs button').all()) {
        const box=(await button.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(overlaps(box,(await page.locator('.assistant-launcher').boundingBox())!)).toBeFalsy();
      }
      if (name==='Map' || name==='Integrate') await page.screenshot({path:`artifacts/mobile-fixed-method-${viewport.width}-${name}.png`});
    }

    const solutions=page.locator('.solution-showcase');
    await solutions.getByRole('tab',{name:/Too much busywork/}).click();
    const headline=(await solutions.locator('.solution-headline').boundingBox())!, tabs=(await solutions.locator('.challenge-tabs').boundingBox())!;
    const copy=(await solutions.locator('.solution-story-copy').boundingBox())!, space=(await solutions.locator('.solution-space').boundingBox())!;
    expect(headline.y+headline.height).toBeLessThan(tabs.y);
    expect(tabs.y+tabs.height).toBeLessThan(copy.y+1);
    expect(copy.y+copy.height).toBeLessThan(space.y);
    for (const node of await solutions.locator('.solution-node').all()) {
      const box=(await node.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(space.y);
      expect(box.y+box.height).toBeLessThanOrEqual(space.y+space.height);
      expect(overlaps(box,tabs)).toBeFalsy();
    }
    await solutions.getByRole('tab',{name:/An invisible website/}).click();
    await page.mouse.wheel(0,200);
    await expect(solutions.getByRole('tab',{name:/An invisible website/})).toHaveAttribute('aria-selected','true');
    await expect(solutions.getByRole('tabpanel')).toContainText('website');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
    expect(errors).toEqual([]);
    await solutions.screenshot({path:`artifacts/mobile-fixed-solutions-${viewport.width}.png`});
  });
}

test('phone navigation pages, menu, chat and consultation form remain usable', async ({page}) => {
  test.setTimeout(90000);
  await page.setViewportSize({width:375,height:667});
  const errors:string[]=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  await expect(page.locator('body')).toHaveCSS('overflow','hidden');
  await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:/Solutions/}).click();
  await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
  for (const route of ['/solutions','/how-it-works','/industries','/about']) {
    await page.goto(route);
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    const description=(await page.locator('.inner-intro-copy > p:not(.eyebrow)').boundingBox())!, visual=(await page.locator('.inner-visual').boundingBox())!;
    expect(visual.y).toBeGreaterThan(description.y+description.height);
    expect(await page.locator('.inner-intro-copy > p:not(.eyebrow)').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
    await page.screenshot({path:`artifacts/mobile-fixed-${route.slice(1)}.png`,fullPage:route!='/how-it-works'});
  }
  await page.goto('/contact');
  await expect(page.getByLabel('Your name')).toHaveCSS('font-size','16px');
  await expect(page.getByLabel('Work email')).toHaveCSS('font-size','16px');
  await page.getByRole('button',{name:'Open Moki AI chat',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Moki AI assistant'});
  await expect(dialog).toBeVisible();
  const box=(await dialog.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y+box.height).toBeLessThanOrEqual(667);
  await expect(dialog.getByLabel('Your message to Moki AI')).toHaveCSS('font-size','16px');
  await page.screenshot({path:'artifacts/mobile-fixed-chat.png'});
  await dialog.getByRole('button',{name:'Close Moki AI chat'}).click();
  expect(errors).toEqual([]);
});

test('reduced-motion phones have no empty hero scroll track and keep manual chapters', async ({page}) => {
  await page.setViewportSize({width:375,height:667});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  expect(await page.locator('.hero-scroll-track').evaluate(el=>el.clientHeight)).toBe(await page.locator('.hero-pin').evaluate(el=>el.clientHeight));
  const method=page.locator('#method');
  await method.getByRole('button',{name:'Kit',exact:true}).click();
  await expect(method.locator('.method-scene-copy')).toHaveCSS('opacity','1');
  await expect(method.locator('canvas')).toHaveCount(0);
  await expect(method.locator('.method-live-stage')).toHaveCSS('transform','none');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
});
