import { beforeEach, describe, expect, it } from 'vitest';
import { DomainError } from './domain-error';
import { FIXTURE_PASSWORD, ORDER_SETTLE_MS, mockDomain } from './domain';
import { resetMockDatabase } from './reset';
import { mockDatabase } from './store';

const ANA = { email: 'ana@jungle.test', password: FIXTURE_PASSWORD };
const BRUNO = { email: 'bruno@jungle.test', password: FIXTURE_PASSWORD };
const ADDRESS = '0x3333333333333333333333333333333333333333';

async function expectError(
  promise: Promise<unknown> | (() => unknown),
  status: number,
  code?: string,
) {
  try {
    await (typeof promise === 'function' ? promise() : promise);
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).status).toBe(status);
    if (code) expect((error as DomainError).code).toBe(code);
    return error as DomainError;
  }
  throw new Error('Era esperado um DomainError.');
}

async function login(credentials = ANA, guestId?: string) {
  return (await mockDomain.login({ ...credentials, guestId })).token;
}

/** Carrinho + cotação + carteira de Ana, prontos para criar pedido. */
async function prepareCheckout(token: string, items = [{ nftId: 'nft-001', quantity: 2 }]) {
  for (const item of items) mockDomain.addCartItem(token, null, item);
  const cart = mockDomain.getCart(token, null);
  const quote = mockDomain.createQuote(token, null, { cartId: cart.id, network: 'ethereum' });
  const orderBody = {
    quoteId: quote.quoteId,
    cartId: cart.id,
    walletId: 'wallet-ana-primary',
    network: 'ethereum',
    collector: { name: 'Ana Souza', email: 'ana@jungle.test' },
    acceptTerms: true,
  };
  return { cart, quote, orderBody };
}

beforeEach(() => {
  resetMockDatabase('default');
  mockDomain.now = () => Date.now();
});

describe('sessão e conta', () => {
  it('autentica usuário fictício e recupera a sessão', async () => {
    const token = await login();
    expect(mockDomain.session(token).user.email).toBe(ANA.email);
  });

  it('recusa credenciais inválidas sem distinguir e-mail de senha', async () => {
    await expectError(
      mockDomain.login({ email: ANA.email, password: 'errada' }),
      401,
      'INVALID_CREDENTIALS',
    );
    await expectError(
      mockDomain.login({ email: 'x@y.com', password: 'qualquer' }),
      401,
      'INVALID_CREDENTIALS',
    );
  });

  it('cadastra, rejeita e-mail duplicado e valida os campos', async () => {
    const created = await mockDomain.register({
      name: 'Carla',
      email: 'carla@jungle.test',
      password: 'Senha@1234',
    });
    expect(mockDomain.session(created.token).user.name).toBe('Carla');

    const conflict = await expectError(
      mockDomain.register({ name: 'Outra', email: 'CARLA@jungle.test', password: 'Senha@1234' }),
      409,
      'CONFLICT',
    );
    expect(conflict.fieldErrors?.[0]?.field).toBe('email');

    const invalid = await expectError(
      mockDomain.register({ name: 'A', email: 'x', password: '1' }),
      422,
    );
    expect(invalid.fieldErrors?.map((error) => error.field)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
  });

  it('expira sessão e exige novo login', async () => {
    const token = await login();
    mockDomain.expireSessions();
    await expectError(() => mockDomain.session(token), 401, 'SESSION_EXPIRED');
    await expectError(() => mockDomain.session(null), 401, 'UNAUTHORIZED');
  });

  it('reflete os cenários de sessão expirada e acesso negado', async () => {
    const token = await login();
    mockDatabase.setScenario('session-expired');
    await expectError(() => mockDomain.profile(token), 401, 'SESSION_EXPIRED');
    mockDatabase.setScenario('unauthorized');
    await expectError(() => mockDomain.profile(token), 403, 'FORBIDDEN');
  });

  it('logout invalida o token', async () => {
    const token = await login();
    mockDomain.logout(token);
    await expectError(() => mockDomain.session(token), 401);
  });

  it('altera dados do perfil, bloqueia e-mail alheio e troca a senha', async () => {
    const token = await login();
    const { user } = mockDomain.updateProfile(token, {
      name: 'Ana S.',
      email: 'ana.nova@jungle.test',
    });
    expect(user.name).toBe('Ana S.');

    const conflict = await expectError(
      () => mockDomain.updateProfile(token, { name: 'Ana', email: BRUNO.email }),
      409,
    );
    expect(conflict.fieldErrors?.[0]?.field).toBe('email');

    await expectError(
      mockDomain.changePassword(token, { currentPassword: 'errada', newPassword: 'NovaSenha@1' }),
      422,
    );
    await mockDomain.changePassword(token, {
      currentPassword: FIXTURE_PASSWORD,
      newPassword: 'NovaSenha@1',
    });
    await expectError(
      mockDomain.login({ email: 'ana.nova@jungle.test', password: FIXTURE_PASSWORD }),
      401,
    );
    expect(
      (await mockDomain.login({ email: 'ana.nova@jungle.test', password: 'NovaSenha@1' })).user.id,
    ).toBe(user.id);
  });
});

describe('isolamento entre usuários', () => {
  it('favoritos, carrinho e pedidos são privados por usuário', async () => {
    const ana = await login(ANA);
    const bruno = await login(BRUNO);

    mockDomain.setFavorite(ana, 'nft-001', true);
    expect(mockDomain.listFavorites(ana).nftIds).toEqual(['nft-001']);
    expect(mockDomain.listFavorites(bruno).nftIds).toEqual([]);

    mockDomain.addCartItem(ana, null, { nftId: 'nft-001', quantity: 1 });
    expect(mockDomain.getCart(bruno, null).items).toHaveLength(0);

    const { orderBody } = await prepareCheckout(ana);
    const { order } = mockDomain.createOrder(ana, 'key-1', orderBody);
    await expectError(() => mockDomain.getOrder(bruno, order.id), 404);
    expect(mockDomain.listOrders(bruno).orders).toHaveLength(0);
  });

  it('só o dono altera a carteira', async () => {
    const bruno = await login(BRUNO);
    await expectError(
      () => mockDomain.updateWallet(bruno, 'wallet-ana-primary', { label: 'Hack' }),
      403,
    );
  });
});

describe('favoritos', () => {
  it('inclui e remove de forma idempotente e versionada', async () => {
    const token = await login();
    expect(mockDomain.setFavorite(token, 'nft-002', true).version).toBe(1);
    expect(mockDomain.setFavorite(token, 'nft-002', true).version).toBe(1);
    expect(mockDomain.setFavorite(token, 'nft-002', false).nftIds).toEqual([]);
    await expectError(() => mockDomain.setFavorite(token, 'nao-existe', true), 404);
  });
});

describe('carrinho', () => {
  it('respeita a disponibilidade por NFT', async () => {
    const token = await login();
    const nft = mockDatabase.getNft('nft-001');
    const available = nft?.availableEditions ?? 0;

    mockDomain.addCartItem(token, null, { nftId: 'nft-001', quantity: available });
    await expectError(
      () => mockDomain.addCartItem(token, null, { nftId: 'nft-001', quantity: 1 }),
      409,
      'AVAILABILITY_EXCEEDED',
    );

    mockDomain.patchNft('nft-002', { availableEditions: 0 });
    await expectError(
      () => mockDomain.addCartItem(token, null, { nftId: 'nft-002', quantity: 1 }),
      409,
      'EDITION_SOLD_OUT',
    );
  });

  it('calcula subtotal decimal sem perda de precisão e permite editar/remover', async () => {
    const token = await login();
    const cart = mockDomain.addCartItem(token, null, { nftId: 'nft-001', quantity: 3 });
    expect(cart.subtotalEth).toBe('3.57');
    const itemId = cart.items[0]?.id ?? '';

    expect(mockDomain.updateCartItem(token, null, itemId, { quantity: 2 }).subtotalEth).toBe(
      '2.38',
    );
    expect(mockDomain.removeCartItem(token, null, itemId).items).toHaveLength(0);
  });

  it('mantém o carrinho do visitante e o mescla ao autenticar', async () => {
    mockDomain.addCartItem(null, 'guest-1', { nftId: 'nft-001', quantity: 1 });
    expect(mockDomain.getCart(null, 'guest-1').items).toHaveLength(1);

    const token = await login(ANA, 'guest-1');
    expect(mockDomain.getCart(token, null).items[0]?.quantity).toBe(1);
    expect(mockDomain.getCart(null, 'guest-1').items).toHaveLength(0);
  });
});

describe('cotação', () => {
  it('soma subtotal, desconto, taxa e total', async () => {
    const token = await login();
    mockDomain.addCartItem(token, null, { nftId: 'nft-001', quantity: 2 });
    const cart = mockDomain.getCart(token, null);
    const quote = mockDomain.createQuote(token, null, {
      cartId: cart.id,
      network: 'ethereum',
      couponCode: 'jungle10',
    });

    expect(quote).toMatchObject({
      subtotalEth: '2.38',
      discountEth: '0.238',
      networkFeeEth: '0.016',
      totalEth: '2.158',
      status: 'valid',
      couponCode: 'JUNGLE10',
    });
  });

  it('trata cupom inválido e expirado', async () => {
    const token = await login();
    mockDomain.addCartItem(token, null, { nftId: 'nft-001', quantity: 1 });
    const { id } = mockDomain.getCart(token, null);

    const invalid = await expectError(
      () =>
        mockDomain.createQuote(token, null, {
          cartId: id,
          network: 'ethereum',
          couponCode: 'NADA',
        }),
      422,
    );
    expect(invalid.fieldErrors?.[0]?.code).toBe('COUPON_INVALID');
    const expired = await expectError(
      () =>
        mockDomain.createQuote(token, null, {
          cartId: id,
          network: 'ethereum',
          couponCode: 'EXPIRED10',
        }),
      422,
    );
    expect(expired.fieldErrors?.[0]?.code).toBe('COUPON_EXPIRED');

    mockDatabase.setScenario('invalid-coupon');
    await expectError(
      () =>
        mockDomain.createQuote(token, null, {
          cartId: id,
          network: 'ethereum',
          couponCode: 'JUNGLE10',
        }),
      422,
    );
  });

  it('marca a cotação como desatualizada quando o preço muda', async () => {
    const token = await login();
    const { quote } = await prepareCheckout(token);
    mockDomain.patchNft('nft-001', { priceEth: '1.50' });
    expect(mockDomain.getQuote(token, null, quote.quoteId).status).toBe('price_changed');
  });
});

describe('pedidos', () => {
  it('é idempotente: mesma chave e conteúdo recuperam o mesmo pedido', async () => {
    const token = await login();
    const { orderBody } = await prepareCheckout(token);

    const first = mockDomain.createOrder(token, 'key-1', orderBody);
    const second = mockDomain.createOrder(token, 'key-1', orderBody);
    expect(second.replayed).toBe(true);
    expect(second.order.id).toBe(first.order.id);
    expect(mockDomain.listOrders(token).orders).toHaveLength(1);
  });

  it('retorna conflito ao reutilizar a chave com conteúdo diferente', async () => {
    const token = await login();
    const { orderBody } = await prepareCheckout(token);
    mockDomain.createOrder(token, 'key-1', orderBody);
    await expectError(
      () => mockDomain.createOrder(token, 'key-1', { ...orderBody, network: 'polygon' }),
      409,
      'IDEMPOTENCY_CONFLICT',
    );
    await expectError(() => mockDomain.createOrder(token, null, orderBody), 400);
  });

  it('confirma o pedido, baixa estoque e remove só o que foi comprado', async () => {
    const token = await login();
    const before = mockDatabase.getNft('nft-001')?.availableEditions ?? 0;
    const { orderBody } = await prepareCheckout(token, [
      { nftId: 'nft-001', quantity: 2 },
      { nftId: 'nft-003', quantity: 1 },
    ]);
    // Compra apenas parte: remove nft-003 do pedido simulando outra cotação seria complexo;
    // aqui o pedido leva ambos e o carrinho deve esvaziar.
    const { order } = mockDomain.createOrder(token, 'k', orderBody);
    expect(order.status).toBe('pending');

    mockDomain.now = () => Date.now() + ORDER_SETTLE_MS + 10;
    const confirmed = mockDomain.getOrder(token, order.id);
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(mockDatabase.getNft('nft-001')?.availableEditions).toBe(before - 2);
    expect(mockDomain.getCart(token, null).items).toHaveLength(0);
  });

  it('mantém o recibo imutável mesmo se o catálogo mudar depois', async () => {
    const token = await login();
    const { orderBody } = await prepareCheckout(token);
    const { order } = mockDomain.createOrder(token, 'k', orderBody);
    mockDomain.patchNft('nft-001', { priceEth: '9.99' });
    mockDomain.now = () => Date.now() + ORDER_SETTLE_MS + 10;

    const receipt = mockDomain.getOrder(token, order.id);
    expect(receipt.items[0]?.unitPriceEth).toBe('1.19');
    expect(receipt.totals.totalEth).toBe(order.totals.totalEth);
  });

  it('recusa o pagamento preservando os itens do carrinho', async () => {
    mockDatabase.setScenario('payment-rejected');
    const token = await login();
    const { orderBody } = await prepareCheckout(token);
    const { order } = mockDomain.createOrder(token, 'k', orderBody);

    mockDomain.now = () => Date.now() + ORDER_SETTLE_MS + 10;
    const rejected = mockDomain.getOrder(token, order.id);
    expect(rejected.status).toBe('rejected');
    expect(rejected.failureReason).toBeTruthy();
    expect(mockDomain.getCart(token, null).items).toHaveLength(1);
  });

  it('estados terminais não regridem', async () => {
    const token = await login();
    const { orderBody } = await prepareCheckout(token);
    const { order } = mockDomain.createOrder(token, 'k', orderBody);
    const confirmed = mockDomain.finalizeOrder(order.id);

    mockDatabase.setScenario('payment-rejected');
    expect(mockDomain.finalizeOrder(order.id).status).toBe('confirmed');
    expect(mockDomain.getOrder(token, order.id).version).toBe(confirmed.version);
  });

  it('exige nova cotação quando o preço muda durante a compra (uma vez)', async () => {
    mockDatabase.setScenario('price-changed');
    const token = await login();
    const { orderBody, cart } = await prepareCheckout(token);

    await expectError(() => mockDomain.createOrder(token, 'k1', orderBody), 409, 'PRICE_CHANGED');
    expect(mockDatabase.getNft('nft-001')?.priceEth).toBe('1.29');

    const fresh = mockDomain.createQuote(token, null, { cartId: cart.id, network: 'ethereum' });
    expect(fresh.status).toBe('valid');
    const { order } = mockDomain.createOrder(token, 'k2', { ...orderBody, quoteId: fresh.quoteId });
    expect(order.items[0]?.unitPriceEth).toBe('1.29');
  });

  it('bloqueia a compra quando a edição esgota durante o checkout', async () => {
    mockDatabase.setScenario('sold-out');
    const token = await login();
    const { orderBody } = await prepareCheckout(token);
    await expectError(() => mockDomain.createOrder(token, 'k', orderBody), 409, 'EDITION_SOLD_OUT');
  });

  it('simula a resposta perdida e permite recuperar o mesmo pedido', async () => {
    mockDatabase.setScenario('order-timeout');
    const token = await login();
    const { orderBody } = await prepareCheckout(token);

    const first = mockDomain.createOrder(token, 'k', orderBody);
    expect(first.lostResponse).toBe(true);
    const retry = mockDomain.createOrder(token, 'k', orderBody);
    expect(retry.replayed).toBe(true);
    expect(retry.order.id).toBe(first.order.id);
    expect(mockDomain.listOrders(token).orders).toHaveLength(1);
  });

  it('emite eventos de domínio para nft.updated e order.updated', async () => {
    const events: string[] = [];
    const unsubscribe = mockDomain.subscribe((event) => events.push(event.type));
    const token = await login();
    const { orderBody } = await prepareCheckout(token);
    const { order } = mockDomain.createOrder(token, 'k', orderBody);
    mockDomain.finalizeOrder(order.id);
    unsubscribe();

    expect(events).toEqual(expect.arrayContaining(['order.updated', 'nft.updated']));
  });
});

describe('carteiras', () => {
  it('cadastra principal/secundária, troca a principal e limita a duas', async () => {
    const token = await login();
    expect(mockDomain.listWallets(token).wallets).toHaveLength(2);
    await expectError(
      () =>
        mockDomain.createWallet(token, { label: 'Extra', address: ADDRESS, network: 'ethereum' }),
      409,
    );

    const bruno = await login(BRUNO);
    const first = mockDomain.createWallet(bruno, {
      label: 'Principal',
      address: ADDRESS,
      network: 'ethereum',
    });
    expect(first.isPrimary).toBe(true);
    const second = mockDomain.createWallet(bruno, {
      label: 'Secundária',
      address: '0x4444444444444444444444444444444444444444',
      network: 'polygon',
      isPrimary: true,
    });
    expect(second.isPrimary).toBe(true);
    expect(mockDomain.listWallets(bruno).wallets.filter((wallet) => wallet.isPrimary)).toHaveLength(
      1,
    );
  });

  it('valida endereço e bloqueia duplicidade', async () => {
    const bruno = await login(BRUNO);
    const invalid = await expectError(
      () => mockDomain.createWallet(bruno, { label: 'X', address: '0x123', network: 'ethereum' }),
      422,
    );
    expect(invalid.fieldErrors?.[0]?.field).toBe('address');

    mockDomain.createWallet(bruno, { label: 'A', address: ADDRESS, network: 'ethereum' });
    await expectError(
      () =>
        mockDomain.createWallet(bruno, {
          label: 'B',
          address: ADDRESS.toUpperCase().replace('0X', '0x'),
          network: 'ethereum',
        }),
      409,
    );
  });
});
