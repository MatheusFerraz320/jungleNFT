import { addToCartFromDetail } from '../fixtures/flows';
import { ANA, expect, test, type Page } from '../fixtures/test';

const summary = (page: Page) => page.getByRole('complementary', { name: 'Resumo da carteira' });
const quantity = (page: Page, name: string) =>
  page.getByRole('group', { name: `Quantidade de ${name}` }).locator('span[aria-live]');

test.describe('carrinho', () => {
  test('adiciona, altera quantidade respeitando o limite e remove', async ({ app: page, mock }) => {
    await mock.patchNft('nft-001', { availableEditions: 3 });

    await addToCartFromDetail(page, 'nft-001', 2);
    await expect(quantity(page, 'Emerald Ape #042')).toHaveText('2');
    await expect(summary(page)).toContainText('2.38 ETH');

    await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click();
    await expect(quantity(page, 'Emerald Ape #042')).toHaveText('3');
    await expect(summary(page)).toContainText('3.57 ETH');
    await expect(
      page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }),
    ).toBeDisabled();

    await page.getByRole('button', { name: 'Diminuir quantidade de Emerald Ape #042' }).click();
    await expect(quantity(page, 'Emerald Ape #042')).toHaveText('2');

    await page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }).click();
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();
  });

  test('cupom inválido, expirado e válido', async ({ page }) => {
    await addToCartFromDetail(page);
    const code = page.locator('#promo-code, #promo-code-mobile').locator('visible=true');
    const apply = page.getByRole('button', { name: 'Aplicar' }).locator('visible=true');

    await code.fill('NADA');
    await apply.click();
    await expect(page.getByRole('alert').filter({ hasText: /inválido/i })).toBeVisible();

    await code.fill('EXPIRED10');
    await apply.click();
    await expect(page.getByRole('alert').filter({ hasText: /expirou/i })).toBeVisible();

    await code.fill('JUNGLE10');
    await apply.click();
    await expect(summary(page)).toContainText('(-) 0.119');
    await expect(summary(page)).toContainText('1.087 ETH');
  });

  test('persiste após refresh e é mantido ao autenticar', async ({ page }) => {
    await addToCartFromDetail(page, 'nft-001', 2);

    await page.reload();
    await expect(quantity(page, 'Emerald Ape #042')).toHaveText('2');

    // Visitante autentica: os itens são preservados (mesclados ao carrinho da conta).
    await page.goto('/login');
    await page.locator('#login-email').fill(ANA.email);
    await page.locator('#login-password').fill(ANA.password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).last().click();
    await expect(page).toHaveURL('/');

    await page.goto('/carrinho');
    await expect(quantity(page, 'Emerald Ape #042')).toHaveText('2');
  });

  test('o carrinho mostra skeleton durante o carregamento lento', async ({ app, mock }) => {
    await mock.scenario('slow');
    await app.goto('/carrinho');
    await expect(app.getByRole('status', { name: 'Carregando carrinho' })).toBeVisible();
  });
});
