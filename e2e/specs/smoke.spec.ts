import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../fixtures/test';

test('renders the marketplace home with the catalog and realtime status', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: /seja dono/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible();
  await expect(page.getByTestId('socket-status')).toContainText('conectado');

  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);
});

test('opens an NFT detail page from the catalog', async ({ page }) => {
  await page.goto('/');

  await page
    .getByRole('link', { name: /emerald ape #042/i })
    .first()
    .click();

  await expect(page).toHaveURL(/\/nft\/nft-001$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible();
  await expect(page.getByText('1.19 ETH').locator('visible=true').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Comprar' })).toBeVisible();

  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);
});

test('keeps catalog filters in the URL', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible();

  const filtersButton = page.getByRole('button', { name: 'Abrir filtros' });
  if (await filtersButton.isVisible()) {
    await filtersButton.click();
  }

  await page.getByRole('button', { name: /fotografia/i }).click();

  await expect(page).toHaveURL(/categories=/);
  await expect(page.getByRole('button', { name: /fotografia/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('link', { name: /sage nomad #009/i }).first()).toBeVisible();
});

test('shows catalog skeletons while the mocked API is slow', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('junglenft:scenario', 'slow');
  });

  await page.goto('/');

  await expect(page.getByRole('status', { name: 'Carregando catálogo' })).toBeVisible();
});
