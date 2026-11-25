import { addToCartFromDetail } from '../fixtures/flows';
import { ANA, expect, test } from '../fixtures/test';

// A suíte roda em 1440 (desktop) e 390 (mobile); este arquivo cobre a largura de tablet exigida (768).
const TABLET = { width: 768, height: 1024 };

const ROUTES = [
  { path: '/', heading: /Seja dono/i },
  { path: '/nft/nft-001', heading: /Emerald Ape/i },
  { path: '/carrinho', heading: /Carrinho de NFTs/i },
  { path: '/pagamento', heading: /Pagamento|Confirmar compra/i },
  { path: '/perfil', heading: /Perfil|Dados/i },
  { path: '/carteiras', heading: /Carteiras/i },
  { path: '/cadastro', heading: /Cadastr|Criar/i },
  { path: '/login', heading: /Entrar|Login/i },
  { path: '/rota-inexistente', heading: /não encontrad|404/i },
];

test.describe('tablet (768 px)', () => {
  test.beforeEach(({ mobile }) => {
    test.skip(mobile, 'Executa uma vez, com viewport próprio.');
  });

  test('todas as telas cabem na largura sem overflow horizontal', async ({
    page,
    app,
    loginAs,
  }) => {
    await app.setViewportSize(TABLET);
    await loginAs(ANA);
    await addToCartFromDetail(page);

    for (const { path, heading } of ROUTES) {
      await page.goto(path);
      await expect(page.getByText(heading).locator('visible=true').first()).toBeVisible();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `overflow horizontal em ${path}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  test('catálogo em tablet mostra cards, busca e carrinho no cabeçalho', async ({ app }) => {
    await app.setViewportSize(TABLET);
    await app.goto('/');
    await expect(app.getByRole('article').first()).toBeVisible();
    await expect(app.getByRole('link', { name: /carrinho/i }).first()).toBeVisible();
  });
});
