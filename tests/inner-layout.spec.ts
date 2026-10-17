import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1440]) {
  test(`inner-page actions and layouts remain readable at ${width}px`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/solutions#ai-strategy');
    const card=page.locator('#ai-strategy');
    const tags=(await card.locator('ul').boundingBox())!;
    const button=(await card.getByRole('link',{name:'Let’s explore this'}).boundingBox())!;
    expect(button.y-tags.y-tags.height).toBeGreaterThan(15);
    expect(button.height).toBeGreaterThanOrEqual(44);
    await expect(card.getByRole('heading',{level:2})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBeTruthy();
    await page.getByRole('button',{name:'Growth',exact:true}).click();
    await expect(page.locator('.service-row')).toHaveCount(4);
    await expect(page.getByRole('heading',{name:'Website development',exact:true})).toBeVisible();
    for(const route of ['/industries','/about','/contact']) {
      await page.goto(route);
      await expect(page.getByRole('heading',{level:1})).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBeTruthy();
    }
    await expect(page.getByLabel('Your name')).toHaveCSS('font-size',width<=980?'16px':'14px');
  });
}
