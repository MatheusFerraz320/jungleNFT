import { addToCartFromDetail, openReview, ordersOf, reachReview } from '../fixtures/flows';
import { ANA, expect, mocks, test, type Page } from '../fixtures/test';

const RECEIPT = 'Seus NFTs agora estão na sua carteira';

/** Lê o NFT da API (REST) para montar eventos de tempo real realistas. */
async function readNft(page: Page, id: string) {
  return page.evaluate(async (nftId) => {
    const response = await fetch(`/api/nfts/${nftId}`);
    return (await response.json()) as Record<string, unknown> & { version: number };
  }, id);
}

function nftEvent(
  nft: Record<string, unknown>,
  eventId: string,
  version: number,
  priceEth: string,
) {
  return {
    type: 'nft.updated',
    meta: {
      eventId,
      resourceType: 'nft',
      resourceId: nft.id,
      version,
      sessionId: null,
      occurredAt: new Date().toISOString(),
    },
    payload: { nft: { ...nft, priceEth, version } },
  };
}

test.describe('tempo real (Socket.IO)', () => {
  test('mudança de preço com o carrinho aberto informa o usuário e atualiza o resumo', async ({
    app,
    mock,
  }) => {
    await addToCartFromDetail(app);
    await expect(app.getByRole('complementary', { name: 'Resumo da carteira' })).toContainText(
      '1.19 ETH',
    );

    await mock.patchNft('nft-001', { priceEth: '2.00' });

    await expect(
      app.getByText(/O preço de Emerald Ape #042 mudou de 1.19 para 2.00 ETH/),
    ).toBeVisible();
    await expect(app.getByRole('complementary', { name: 'Resumo da carteira' })).toContainText(
      '2.016 ETH',
    );
  });

  test('mudança de disponibilidade atualiza o limite de quantidade', async ({ app, mock }) => {
    await addToCartFromDetail(app, 'nft-001', 2);
    await mock.patchNft('nft-001', { availableEditions: 2 });

    await expect(app.getByText(/A disponibilidade de Emerald Ape #042 mudou/)).toBeVisible();
    await expect(
      app.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }),
    ).toBeDisabled();
  });

  test('catálogo e detalhe refletem o evento sem recarregar', async ({ app, mock }) => {
    await expect(app.getByText('1.19 ETH').first()).toBeVisible();
    await mock.patchNft('nft-001', { priceEth: '1.50' });
    await expect(app.getByText('1.50 ETH').first()).toBeVisible();

    await app
      .getByRole('link', { name: /emerald ape #042/i })
      .first()
      .click();
    await mock.patchNft('nft-001', { priceEth: '1.75' });
    await expect(app.getByText('1.75 ETH').locator('visible=true').first()).toBeVisible();
  });

  test('o checkout impede confirmar com uma cotação desatualizada', async ({
    app,
    loginAs,
    mock,
  }) => {
    await loginAs(ANA);
    const dialog = await reachReview(app);
    await expect(dialog).toContainText('1.19 ETH');

    await mock.patchNft('nft-001', { priceEth: '1.40' });

    await expect(dialog.getByText(/Os valores mudaram/)).toBeVisible();
    await expect(dialog).toContainText(/1\.416 ETH/);
    expect(await ordersOf(app)).toHaveLength(0);

    await dialog.getByRole('button', { name: 'Confirmar novos valores' }).click();
    await expect(app.getByText(RECEIPT)).toBeVisible();
    const [order] = await ordersOf(app);
    expect(order).toBeDefined();
  });

  test('eventos duplicados e antigos não reaplicam efeitos nem regridem o estado', async ({
    app,
  }) => {
    await app.goto('/nft/nft-001');
    await expect(app.getByTestId('socket-status')).toContainText('conectado');
    const nft = await readNft(app, 'nft-001');
    const base = nft.version;
    // A barra mobile exibe o total calculado ("3.5") e o desktop o preço da API ("3.50").
    const shown = (price: string) =>
      app
        .getByText(new RegExp(`^${price.replace(/0+$/, '').replace('.', '\\.')}0* ETH$`))
        .locator('visible=true');
    const mock = mocks(app);

    await mock.emit(nftEvent(nft, 'evt-new', base + 10, '3.33'));
    await expect(shown('3.33').first()).toBeVisible();

    // Antigo (versão menor) e duplicado (mesmo eventId): ignorados.
    await mock.emit(nftEvent(nft, 'evt-old', base + 2, '1.01'));
    await mock.emit(nftEvent(nft, 'evt-new', base + 10, '9.99'));
    await mock.staleNft('nft-001');
    await app.waitForTimeout(400);
    await expect(shown('3.33').first()).toBeVisible();
    await expect(shown('1.01')).toHaveCount(0);
    await expect(shown('9.99')).toHaveCount(0);
    await expect(shown('99.99')).toHaveCount(0);

    // Um evento realmente mais novo volta a ser aplicado.
    await mock.emit(nftEvent(nft, 'evt-newer', base + 11, '3.50'));
    await expect(shown('3.50').first()).toBeVisible();
    await expect(shown('3.33')).toHaveCount(0);
  });

  test('evento de outra sessão não altera os dados do usuário atual', async ({ app, loginAs }) => {
    await loginAs(ANA);
    const dialog = await reachReview(app);
    await dialog.getByRole('button', { name: 'Enviar pedido' }).click();
    await expect(app.getByText(RECEIPT)).toBeVisible();

    const [order] = await ordersOf(app);
    const foreign = {
      type: 'order.updated',
      meta: {
        eventId: 'evt-foreign',
        resourceType: 'order',
        resourceId: order?.id,
        version: 999,
        sessionId: 'tok_sessao-anterior',
        occurredAt: new Date().toISOString(),
      },
      payload: {
        orderId: order?.id,
        order: await app.evaluate(async (id) => {
          const token = localStorage.getItem('junglenft:token');
          const response = await fetch(`/api/orders/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return {
            ...(await response.json()),
            status: 'rejected',
            failureReason: 'HACK',
            version: 999,
          };
        }, order?.id),
      },
    };
    await mocks(app).emit(foreign);
    await app.waitForTimeout(500);

    await expect(app.getByText('HACK')).toHaveCount(0);
    await expect(app.getByText(RECEIPT)).toBeVisible();
  });

  test('queda de conexão com pedido pendente: reconecta e recupera sem criar outra compra', async ({
    app,
    loginAs,
    mock,
  }) => {
    await loginAs(ANA);
    const dialog = await reachReview(app);
    await dialog.getByRole('button', { name: 'Enviar pedido' }).click();
    await expect(app.getByText('Aguardando confirmação do pagamento')).toBeVisible();

    await mock.disconnectSocket();

    await expect(app.getByText(RECEIPT)).toBeVisible();
    expect(await ordersOf(app)).toHaveLength(1);
  });

  test('o indicador de conexão acompanha queda e reconexão', async ({ app, mock }) => {
    const status = app.getByTestId('socket-status');
    await expect(status).toContainText('conectado');

    await mock.disconnectSocket();
    await expect(status).toContainText(/connecting|disconnected|conectado/);
    await expect(status).toContainText('conectado');
  });

  test('pedido pendente liquida com o relógio controlado', async ({ page, loginAs, mock }) => {
    await page.clock.install();
    await page.goto('/');
    await expect(page.getByTestId('socket-status')).toContainText('conectado');
    await loginAs(ANA);
    void mock;

    const dialog = await reachReview(page);
    await dialog.getByRole('button', { name: 'Enviar pedido' }).click();
    await expect(page.getByText('Aguardando confirmação do pagamento')).toBeVisible();

    // Avança o tempo simulado além da liquidação (≈1,5 s) e do polling.
    await page.clock.runFor(2_500);
    await expect(page.getByText(RECEIPT)).toBeVisible();
    void openReview;
  });
});
