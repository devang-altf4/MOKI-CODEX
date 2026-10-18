import { expect, test } from '@playwright/test';

test('embedded AI conversation sends history, suggests a service, and can be reset', async ({ page }) => {
  const requests: { messages: { role: string; text: string }[] }[] = [];
  await page.route('**/api/chat', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: { reply: requests.length === 1 ? 'Moki could help connect your website and enquiry process. Which part needs the most attention?' : 'Local search foundations could help people in South Florida find your business.', service: 'web-development' } });
  });
  await page.goto('/');
  const panel = page.locator('.conversation-console');
  await panel.getByLabel('Your message to Moki AI').fill('We need a better website for our business.');
  await panel.getByRole('button', { name: 'Send message to Moki AI' }).click();
  await expect(panel.locator('.message-assistant').last()).toContainText('Moki could help');
  await expect(panel.getByRole('link', { name: 'Website development' })).toHaveAttribute('href', '/solutions#web-development');
  await panel.getByLabel('Your message to Moki AI').fill('We serve people in South Florida and need local search help.');
  await panel.getByRole('button', { name: 'Send message to Moki AI' }).click();
  await expect(panel.locator('.message-assistant').last()).toContainText('Local search foundations');
  expect(requests[1].messages.map(item => item.role)).toEqual(['user', 'assistant', 'user']);
  await page.screenshot({ path: 'artifacts/ai-conversation-desktop.png' });
  await panel.getByRole('button', { name: 'Start a new AI conversation' }).click();
  await expect(panel.locator('.message-user')).toHaveCount(0);
  await expect(panel.locator('.message-assistant')).toHaveCount(1);
});

test('an unavailable AI connection preserves the draft and offers a useful retry', async ({ page }) => {
  let attempt = 0;
  await page.route('**/api/chat', async route => {
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.fulfill(++attempt === 1 ? { status: 503, json: { error: 'The AI connection is unavailable right now. Please try again.' } } : { json: { reply: 'Moki could help organize enquiries with a CRM workflow.', service: 'crm-sales' } });
  });
  await page.goto('/');
  const panel = page.locator('.conversation-console');
  const input = panel.getByLabel('Your message to Moki AI');
  await panel.getByRole('button', { name: 'Better follow-ups', exact: true }).click();
  await panel.getByRole('button', { name: 'Send message to Moki AI' }).click();
  await expect(input).toBeDisabled();
  await expect(panel.getByRole('alert')).toContainText('unavailable');
  await expect(input).toHaveValue(/New leads/);
  await expect(panel.getByRole('link', { name: 'Talk to the Moki team' })).toHaveAttribute('href', '/contact');
  await panel.getByRole('button', { name: 'Send message to Moki AI' }).click();
  await expect(panel.getByRole('alert')).toHaveCount(0);
  await expect(panel.locator('.message-assistant').last()).toContainText('CRM workflow');
  await expect(input).toHaveValue('');
});

test('mobile chat opens accessibly, treats replies as text, and closes on a service visit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const text = 'A website could help. <img src=x onerror="alert(1)">';
  await page.route('**/api/chat', route => route.fulfill({ json: { reply: text, service: 'web-development' } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Moki chat and contact' }).click();
  const dialog = page.getByRole('dialog', { name: 'Moki chat and contact' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'AI chat', exact: true }).click();
  await dialog.getByLabel('Your message to Moki AI').fill('We are considering a new website.');
  await dialog.getByRole('button', { name: 'Send message to Moki AI' }).click();
  await expect(dialog.locator('.message-assistant').last()).toContainText(text);
  await expect(dialog.locator('.message-assistant img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await page.screenshot({ path: 'artifacts/ai-chat-mobile.png' });
  await dialog.getByRole('link', { name: 'Website development' }).click();
  await expect(page).toHaveURL(/solutions#web-development/);
  await expect(dialog).not.toBeVisible();
});
