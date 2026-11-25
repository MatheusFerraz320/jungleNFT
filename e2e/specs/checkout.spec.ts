import {
  fillCollector,
  openReview,
  ordersOf,
  reachReview,
  startCheckout,
  addToCartFromDetail,
} from '../fixtures/flows';
import { ANA, expect, test } from '../fixtures/test';

const RECEIPT = 'Seus NFTs agora estão na sua carteira';

test.describe('compra e pedido', () => {
  test('compra completa do catálogo ao recibo confirmado', async ({ app, loginAs }) => {
    await loginAs(ANA);
    await app
      .getByRole('link', { name: /emerald ape #042/i })
      .first()
      .click();
    await expect(app).toHaveURL(/\/nft\/nft-001$/);

    await app.getByRole('button', { name: /^Comprar( NFT)?$/ }).click();
    await expect(app).toHaveURL(/\/carrinho$/);
    await startCheckout(app);
    await expect(app).toHaveURL(/\/pagamento$/);
    await fillCollector(app);
    const dialog = await openReview(app);
    await expect(dialog).toContainText('1.19 ETH');
    await dialog.getByRole('button', { name: 'Enviar pedido' }).click();

    // Pendente → confirmado (a confirmação só aparece com o pedido efetivamente confirmado).
    await expect(app).toHaveURL(/\/pedido\/order-/);
    await expect(app.getByText(RECEIPT)).toBeVisible();
    await expect(app.getByText(/^0x[0-9a-f]{4}…[0-9a-f]{4}$/i).first()).toBeVisible();
    await expect(app.getByText('1.19 ETH').first()).toBeVisible();

    // Itens comprados saem do carrinho; recibo sobrevive a refresh.
    await app.reload();
    await expect(app.getByText(RECEIPT)).toBeVisible();
    await app.goto('/carrinho');
    await expect(app.getByText('Seu carrinho está vazio')).toBeVisible();
  });

  test('exibe o estado pendente antes da confirmação e o recupera após recarregar', async ({
    app,
    loginAs,
  }) => {
    await loginAs(ANA);
    const dialog = await reachReview(app);
    await dialog.getByRole('button', { name: 'Enviar pedido' }).click();
    await expect(app.getByText('Aguardando confirmação do pagamento')).toBeVisible();

    await app.reload();
    await expect(app.getByText(RECEIPT)).toBeVisible();
    expect(await ordersOf(app)).toHaveLength(1);
  });

  test('pagamento recusado preserva os itens do carrinho', async ({ app, loginAs, mock }) => {
    await loginAs(ANA);
    await mock.scenario('payment-rejected');
    const dialog = await reachReview(app);
    await dialog.getByRole('button', { name: 'Enviar pedido' }).click();

    await expect(app.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible();
    await app.getByRole('link', { name: 'Voltar ao carrinho' }).click();
    await expect(app.getByText('Emerald Ape #042').locator('visible=true').first()).toBeVisible();
  });

  test('clique repetido não duplica o pedido', async ({ app, loginAs }) => {
    await loginAs(ANA);
    const dialog = await reachReview(app);
    await dialog.getByRole('button', { name: 'Enviar pedido' }).dblclick();

    await expect(app.getByText(RECEIPT)).toBeVisible();
    expect(await ordersOf(app)).toHaveLength(1);
  });

  test('timeout após criar o pedido recupera o mesmo pedido pela idempotência', async ({
    app,
    loginAs,
    mock,
  }) => {
    await loginAs(ANA);
    await mock.scenario('order-timeout');
    const dialog = await reachReview(app);
    await dialog.getByRole('button', { name: 'Enviar pedido' }).click();

    await expect(app.getByText(RECEIPT)).toBeVisible();
    expect(await ordersOf(app)).toHaveLength(1);
  });

  test('preço alterado durante a compra exige nova confirmação', async ({ app, loginAs, mock }) => {
    await loginAs(ANA);
    await mock.scenario('price-changed');
    const dialog = await reachReview(app);
    await dialog.getByRole('button', { name: 'Enviar pedido' }).click();

    await expect(dialog.getByText(/Os valores mudaram/)).toBeVisible();
    expect(await ordersOf(app)).toHaveLength(0);
    await expect(dialog).toContainText('1.29 ETH');

    await dialog.getByRole('button', { name: 'Confirmar novos valores' }).click();
    await expect(app.getByText(RECEIPT)).toBeVisible();
    expect(await ordersOf(app)).toHaveLength(1);
  });

  test('edição esgotada impede a compra e preserva o carrinho', async ({ app, loginAs, mock }) => {
    await loginAs(ANA);
    await mock.scenario('sold-out');
    const dialog = await reachReview(app);
    await dialog.getByRole('button', { name: 'Enviar pedido' }).click();

    await expect(dialog.getByRole('alert')).toContainText('indisponível');
    await expect(dialog.getByRole('link', { name: 'Voltar ao carrinho' })).toBeVisible();
    expect(await ordersOf(app)).toHaveLength(0);
  });

  test('carteira que recusa a conexão bloqueia o envio', async ({ app, loginAs, mobile }) => {
    await loginAs(ANA);
    await addToCartFromDetail(app);
    await startCheckout(app);
    await fillCollector(app);

    if (mobile) await app.getByRole('radio', { name: 'WalletConnect' }).check({ force: true });
    else await app.locator('#walletType').selectOption('walletconnect');
    await app.getByRole('button', { name: 'Confirmar compra' }).click();

    await expect(
      app
        .getByRole('status')
        .filter({ hasText: /Conexão recusada/ })
        .locator('visible=true')
        .first(),
    ).toBeVisible();
    await expect(app.getByRole('dialog', { name: 'Revisar pedido' })).toHaveCount(0);
  });

  test('visitante é levado ao login e retoma o pagamento com o carrinho', async ({ app }) => {
    await addToCartFromDetail(app);
    await startCheckout(app);
    await expect(app).toHaveURL(/\/login\?redirect=.*pagamento/);

    await app.locator('#login-email').fill(ANA.email);
    await app.locator('#login-password').fill(ANA.password);
    await app.getByRole('button', { name: 'Entrar', exact: true }).last().click();
    await expect(app).toHaveURL(/\/pagamento$/);
    await expect(app.getByRole('button', { name: 'Confirmar compra' })).toBeVisible();
  });

  test('formulário do colecionador valida os campos obrigatórios', async ({
    app,
    loginAs,
    mobile,
  }) => {
    test.skip(mobile, 'O frame mobile não contém o formulário do colecionador.');
    await loginAs(ANA);
    await addToCartFromDetail(app);
    await startCheckout(app);

    await app.locator('#displayName').fill('');
    await app.getByRole('button', { name: 'Confirmar compra' }).click();
    await expect(app.locator('#displayName-error')).toBeVisible();
    await expect(app.locator('#username-error')).toBeVisible();
    await expect(app.locator('#referralCode-error')).toBeVisible();
    await expect(app.locator('#displayName')).toHaveAttribute('aria-invalid', 'true');
  });
});
