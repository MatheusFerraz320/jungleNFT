import { addToCartFromDetail, startCheckout } from '../fixtures/flows';
import { ANA, expect, test, type Page } from '../fixtures/test';

/**
 * Regressão visual das telas principais. Dados estáveis: cenário `default`, usuário fictício
 * fixo, sem latência e com animações desabilitadas. Baselines versionadas em
 * `visual.spec.ts-snapshots/` (atualize com `pnpm test:e2e:update`).
 */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Força o carregamento das imagens visíveis (inclusive as `loading="lazy"` fora da dobra);
    // imagens ocultas pelo layout responsivo nunca carregam e não entram na espera.
    const visible = Array.from(document.images).filter((image) => image.checkVisibility());
    visible.forEach((image) => {
      image.loading = 'eager';
    });
    await Promise.all(visible.map((image) => image.decode().catch(() => undefined)));
  });
  // Evita ruído de rolagem suave entre execuções.
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function expectScreenshot(page: Page, name: string) {
  await settle(page);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, animations: 'disabled' });
}

test.describe('regressão visual', () => {
  test('início', async ({ app }) => {
    await expect(app.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible();
    await expectScreenshot(app, 'inicio');
  });

  test('detalhe do NFT', async ({ app }) => {
    await app.goto('/nft/nft-001');
    await expect(app.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible();
    await expect(app.getByRole('article').first()).toBeVisible();
    await expectScreenshot(app, 'detalhe');
  });

  test('carrinho', async ({ app, loginAs }) => {
    await loginAs(ANA);
    await addToCartFromDetail(app, 'nft-001', 2);
    await expect(app.getByRole('complementary', { name: 'Resumo da carteira' })).toContainText(
      '2.38 ETH',
    );
    await expectScreenshot(app, 'carrinho');
  });

  test('pagamento', async ({ app, loginAs }) => {
    await loginAs(ANA);
    await addToCartFromDetail(app, 'nft-001', 2);
    await startCheckout(app);
    await expect(app).toHaveURL(/\/pagamento$/);
    await expect(app.getByRole('button', { name: 'Confirmar compra' })).toBeVisible();
    await expect(app.getByText('2.396 ETH').locator('visible=true').first()).toBeVisible();
    await expectScreenshot(app, 'pagamento');
  });
});
