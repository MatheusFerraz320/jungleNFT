import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../fixtures/test';

test('renders the connected scaffold through MSW REST and Socket.IO', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Marketplace de NFTs' })).toBeVisible();
  await expect(page.getByTestId('health-status')).toContainText('ok');
  await expect(page.getByTestId('socket-status')).toHaveText('connected');

  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);
});

test('shows a skeleton while the mocked API is slow', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('junglenft:scenario', 'slow');
  });

  await page.goto('/');

  await expect(page.getByLabel('Carregando status da API')).toBeVisible();
  await expect(page.getByTestId('health-status')).toContainText('slow');
});
