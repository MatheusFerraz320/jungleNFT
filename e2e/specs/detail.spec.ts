import { expect, test } from '../fixtures/test';

test.describe('detalhe do NFT', () => {
  test('acesso direto exibe o NFT e o preço da API', async ({ page }) => {
    await page.goto('/nft/nft-001');

    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible();
    await expect(page.getByText('1.19 ETH').locator('visible=true').first()).toBeVisible();
    await expect(page.getByRole('img', { name: /emerald ape #042/i }).first()).toBeVisible();
  });

  test('NFT inexistente mostra erro tratado e permite voltar', async ({ page }) => {
    await page.goto('/nft/nao-existe');

    await expect(page.getByText('NFT não encontrado')).toBeVisible();
    await page.getByRole('link', { name: 'Voltar ao mercado' }).click();
    await expect(page).toHaveURL('/');
  });

  test('rota inexistente exibe a página 404', async ({ page }) => {
    await page.goto('/uma/rota/qualquer');
    await expect(page.getByRole('heading', { name: /não encontrada|404/i }).first()).toBeVisible();
  });

  test('edição esgotada desabilita a compra', async ({ app, mock }) => {
    await mock.patchNft('nft-001', { availableEditions: 0 });
    await app.goto('/nft/nft-001');

    await expect(app.getByRole('button', { name: 'Esgotado' })).toBeDisabled();
  });

  test('limite de quantidade respeita a disponibilidade', async ({ app, mock }) => {
    await mock.patchNft('nft-001', { availableEditions: 2 });
    await app.goto('/nft/nft-001');

    const plus = app.getByRole('button', { name: 'Aumentar quantidade' });
    await plus.click();
    await expect(
      app.getByRole('group', { name: 'Quantidade' }).getByText('2', { exact: true }),
    ).toBeVisible();
    await expect(plus).toBeDisabled();
  });
});
