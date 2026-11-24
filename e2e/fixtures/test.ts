import { test as base, expect } from '@playwright/test';

export const test = base.extend({});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('junglenft:scenario', 'default');
  });
});

export { expect };
