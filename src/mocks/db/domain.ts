import Decimal from 'decimal.js';
import { z } from 'zod';
import { couponFixtures } from '@/mocks/fixtures/coupons';
import {
  CreateOrderRequestSchema,
  CreateWalletRequestSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  UpdateProfileRequestSchema,
  UpdateWalletRequestSchema,
  ChangePasswordRequestSchema,
  WalletSchema,
  type ApiFieldError,
  type AuthResponse,
  type Cart,
  type Network,
  type NftSummary,
  type Order,
  type OrderItemSnapshot,
  type Quote,
  type User,
  type Wallet,
} from '@/shared/contracts';
import { DomainError } from './domain-error';
import { readPersistedState, writePersistedState, clearPersistedState } from './persistence';
import { mockDatabase, type MockDatabaseSnapshot } from './store';

/** Senha dos usuários fictícios (somente o hash salgado é guardado). */
export const FIXTURE_PASSWORD = 'Senha@123';

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const QUOTE_TTL_MS = 5 * 60 * 1000;
/** Tempo até o pedido pendente ser confirmado/recusado pela simulação. */
export const ORDER_SETTLE_MS = 1_500;

const NETWORK_FEE_ETH: Record<Network, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.0005',
};

const MAX_WALLETS = 2;

interface Credential {
  salt: string;
  hash: string;
}
interface CartRecord {
  id: string;
  ownerKey: string;
  userId: string | null;
  items: { id: string; nftId: string; quantity: number }[];
  version: number;
  updatedAt: string;
}
interface StoredQuote extends Quote {
  ownerKey: string;
  unitPrices: Record<string, string>;
}
interface StoredOrder extends Order {
  quoteId: string;
  cartOwnerKey: string;
}
interface DomainState {
  credentials: Record<string, Credential>;
  sessions: Record<string, { userId: string; expiresAt: string }>;
  favorites: Record<string, { nftIds: string[]; version: number }>;
  carts: Record<string, CartRecord>;
  quotes: Record<string, StoredQuote>;
  orders: Record<string, StoredOrder>;
  idempotency: Record<string, { fingerprint: string; orderId: string }>;
  effects: Record<string, boolean>;
  seq: number;
}

export type DomainEvent =
  | { type: 'nft.updated'; nft: NftSummary }
  | { type: 'order.updated'; order: Order; userId: string };

type Listener = (event: DomainEvent) => void;

const persistedSchema = z.custom<{ state: DomainState; db: MockDatabaseSnapshot }>(
  (value) => typeof value === 'object' && value !== null && 'state' in value,
);

function emptyState(): DomainState {
  return {
    credentials: {},
    sessions: {},
    favorites: {},
    carts: {},
    quotes: {},
    orders: {},
    idempotency: {},
    effects: {},
    seq: 0,
  };
}

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function zodFieldErrors(error: z.ZodError): ApiFieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new DomainError(
      422,
      'VALIDATION_ERROR',
      'Dados inválidos. Revise os campos informados.',
      zodFieldErrors(parsed.error),
    );
  }
  return parsed.data;
}

function money(value: Decimal) {
  return value.toFixed().replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

function fingerprint(body: unknown) {
  const sort = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(sort)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, item]) => [key, sort(item)]),
          )
        : value;
  return JSON.stringify(sort(body));
}

export class MockDomain {
  private state: DomainState = emptyState();
  private listeners = new Set<Listener>();
  private ready: Promise<void> | null = null;
  now: () => number = () => Date.now();

  constructor() {
    this.load();
  }

  // ---------- ciclo de vida ----------

  /** Garante credenciais dos usuários fictícios (hash assíncrono). */
  async ensureReady() {
    this.ready ??= this.seedCredentials();
    await this.ready;
  }

  private async seedCredentials() {
    for (const user of mockDatabase.listUsers()) {
      if (this.state.credentials[user.id]) continue;
      const salt = `salt-${user.id}`;
      this.state.credentials[user.id] = {
        salt,
        hash: await hashPassword(FIXTURE_PASSWORD, salt),
      };
    }
    this.persist();
  }

  reset() {
    this.state = emptyState();
    this.ready = null;
    clearPersistedState('domain');
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: DomainEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private load() {
    const stored = readPersistedState('domain', persistedSchema);
    if (!stored) return;
    this.state = { ...emptyState(), ...stored.state };
    mockDatabase.restore(stored.db);
  }

  private persist() {
    writePersistedState('domain', persistedSchema, {
      state: this.state,
      db: mockDatabase.snapshot(),
    });
  }

  private nextId(prefix: string) {
    this.state.seq += 1;
    return `${prefix}-${String(this.state.seq).padStart(4, '0')}`;
  }

  private iso(offsetMs = 0) {
    return new Date(this.now() + offsetMs).toISOString();
  }

  /** Efeitos de cenário que acontecem uma única vez por usuário. */
  private consumeEffect(key: string) {
    if (this.state.effects[key]) return false;
    this.state.effects[key] = true;
    return true;
  }

  // ---------- autenticação ----------

  private createSession(user: User): AuthResponse {
    const token = `tok_${crypto.randomUUID()}`;
    const expiresAt = this.iso(SESSION_TTL_MS);
    this.state.sessions[token] = { userId: user.id, expiresAt };
    return { user, expiresAt, token };
  }

  async register(body: unknown): Promise<AuthResponse> {
    await this.ensureReady();
    const data = parseBody(RegisterRequestSchema, body);

    if (
      mockDatabase.scenario === 'registration-conflict' ||
      mockDatabase.findUserByEmail(data.email)
    ) {
      throw new DomainError(409, 'CONFLICT', 'Este e-mail já está cadastrado.', [
        { field: 'email', message: 'E-mail já cadastrado.', code: 'EMAIL_TAKEN' },
      ]);
    }

    const stamp = this.iso();
    const user: User = {
      id: this.nextId('user'),
      name: data.name,
      email: data.email.trim().toLowerCase(),
      avatarUrl: '/assets/avatar-placeholder.svg',
      createdAt: stamp,
      updatedAt: stamp,
    };
    const salt = crypto.randomUUID();
    this.state.credentials[user.id] = { salt, hash: await hashPassword(data.password, salt) };
    mockDatabase.upsertUser(user);

    const session = this.createSession(user);
    this.mergeGuestCart(user.id, data.guestId);
    this.persist();
    return session;
  }

  async login(body: unknown): Promise<AuthResponse> {
    await this.ensureReady();
    const data = parseBody(LoginRequestSchema, body);
    const user = mockDatabase.findUserByEmail(data.email);
    const credential = user ? this.state.credentials[user.id] : undefined;

    if (
      !user ||
      !credential ||
      (await hashPassword(data.password, credential.salt)) !== credential.hash
    ) {
      throw new DomainError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }

    const session = this.createSession(user);
    this.mergeGuestCart(user.id, data.guestId);
    this.persist();
    return session;
  }

  logout(token: string | null) {
    if (token && this.state.sessions[token]) {
      delete this.state.sessions[token];
      this.persist();
    }
  }

  /** Invalida todas as sessões (usado por testes e pelo cenário de expiração). */
  expireSessions() {
    for (const session of Object.values(this.state.sessions)) {
      session.expiresAt = this.iso(-1000);
    }
    this.persist();
  }

  requireUser(token: string | null): User {
    if (mockDatabase.scenario === 'unauthorized') {
      throw new DomainError(403, 'FORBIDDEN', 'Você não tem permissão para acessar este recurso.');
    }
    if (!token) {
      throw new DomainError(401, 'UNAUTHORIZED', 'Faça login para continuar.');
    }

    const session = this.state.sessions[token];
    const expired =
      mockDatabase.scenario === 'session-expired' ||
      !session ||
      new Date(session.expiresAt).getTime() <= this.now();

    if (expired) {
      if (session) delete this.state.sessions[token];
      throw new DomainError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.');
    }

    const user = mockDatabase.getUser(session.userId);
    if (!user)
      throw new DomainError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.');
    return user;
  }

  /** Usuário dono do token, ou `null` (sem lançar): usado para direcionar eventos de tempo real. */
  sessionUserId(token: string | null | undefined) {
    if (!token) return null;
    const session = this.state.sessions[token];
    if (!session || new Date(session.expiresAt).getTime() <= this.now()) return null;
    return session.userId;
  }

  session(token: string | null) {
    const user = this.requireUser(token);
    const session = this.state.sessions[token as string];
    return { user, expiresAt: session?.expiresAt ?? this.iso(SESSION_TTL_MS) };
  }

  // ---------- perfil ----------

  profile(token: string | null) {
    return { user: this.requireUser(token) };
  }

  updateProfile(token: string | null, body: unknown) {
    const user = this.requireUser(token);
    const data = parseBody(UpdateProfileRequestSchema, body);
    const email = data.email.trim().toLowerCase();
    const taken = mockDatabase.findUserByEmail(email);

    if (taken && taken.id !== user.id) {
      throw new DomainError(409, 'CONFLICT', 'Este e-mail já está em uso.', [
        { field: 'email', message: 'E-mail já cadastrado.', code: 'EMAIL_TAKEN' },
      ]);
    }
    if (data.avatarUrl && data.avatarUrl.length > 300_000) {
      throw new DomainError(422, 'VALIDATION_ERROR', 'Imagem muito grande.', [
        { field: 'avatarUrl', message: 'O avatar deve ter no máximo 200 KB.' },
      ]);
    }

    const updated: User = {
      ...user,
      name: data.name,
      email,
      avatarUrl: data.avatarUrl ?? user.avatarUrl,
      username: data.username ?? user.username,
      ensName: data.ensName ?? user.ensName,
      walletNickname: data.walletNickname ?? user.walletNickname,
      updatedAt: this.iso(),
    };
    mockDatabase.upsertUser(updated);
    this.persist();
    return { user: updated };
  }

  async changePassword(token: string | null, body: unknown) {
    const user = this.requireUser(token);
    await this.ensureReady();
    const data = parseBody(ChangePasswordRequestSchema, body);
    const credential = this.state.credentials[user.id];

    if (
      !credential ||
      (await hashPassword(data.currentPassword, credential.salt)) !== credential.hash
    ) {
      throw new DomainError(422, 'VALIDATION_ERROR', 'Senha atual incorreta.', [
        { field: 'currentPassword', message: 'Senha atual incorreta.', code: 'WRONG_PASSWORD' },
      ]);
    }

    const salt = crypto.randomUUID();
    this.state.credentials[user.id] = { salt, hash: await hashPassword(data.newPassword, salt) };
    this.persist();
  }

  // ---------- carteiras ----------

  listWallets(token: string | null) {
    const user = this.requireUser(token);
    return { wallets: mockDatabase.listWallets(user.id) };
  }

  createWallet(token: string | null, body: unknown): Wallet {
    const user = this.requireUser(token);
    const data = parseBody(CreateWalletRequestSchema, body);
    const existing = mockDatabase.listWallets(user.id);

    if (existing.length >= MAX_WALLETS) {
      throw new DomainError(
        409,
        'CONFLICT',
        'Limite de carteiras atingido (principal e secundária).',
      );
    }
    this.assertAddressFree(existing, data.address);

    const makePrimary = data.isPrimary || existing.length === 0;
    if (makePrimary) this.demotePrimary(existing);

    const stamp = this.iso();
    const wallet = WalletSchema.parse({
      id: this.nextId('wallet'),
      userId: user.id,
      label: data.label,
      address: data.address,
      network: data.network,
      isPrimary: makePrimary,
      displayName: data.displayName,
      profileName: data.profileName,
      walletType: data.walletType,
      referralCode: data.referralCode,
      email: data.email,
      ensName: data.ensName,
      secondaryAddress: data.secondaryAddress,
      createdAt: stamp,
      updatedAt: stamp,
      version: 1,
    });
    mockDatabase.upsertWallet(wallet);
    this.persist();
    return wallet;
  }

  updateWallet(token: string | null, id: string, body: unknown): Wallet {
    const user = this.requireUser(token);
    const current = mockDatabase.getWallet(id);

    if (!current) throw new DomainError(404, 'NOT_FOUND', 'Carteira não encontrada.');
    if (current.userId !== user.id) {
      throw new DomainError(403, 'FORBIDDEN', 'Você não tem permissão para alterar esta carteira.');
    }

    const data = parseBody(UpdateWalletRequestSchema, body);
    const others = mockDatabase.listWallets(user.id).filter((wallet) => wallet.id !== id);
    if (data.address) this.assertAddressFree(others, data.address);
    if (data.isPrimary) this.demotePrimary(others);
    if (data.isPrimary === false && current.isPrimary && others.length === 0) {
      throw new DomainError(
        422,
        'VALIDATION_ERROR',
        'É necessário manter uma carteira principal.',
        [{ field: 'isPrimary', message: 'Mantenha ao menos uma carteira principal.' }],
      );
    }

    const updated: Wallet = {
      ...current,
      ...data,
      updatedAt: this.iso(),
      version: current.version + 1,
    };
    mockDatabase.upsertWallet(updated);
    this.persist();
    return updated;
  }

  private assertAddressFree(wallets: Wallet[], address: string) {
    if (wallets.some((wallet) => wallet.address.toLowerCase() === address.toLowerCase())) {
      throw new DomainError(409, 'CONFLICT', 'Esta carteira já está cadastrada.', [
        { field: 'address', message: 'Endereço já cadastrado.', code: 'ADDRESS_TAKEN' },
      ]);
    }
  }

  private demotePrimary(wallets: Wallet[]) {
    for (const wallet of wallets.filter((item) => item.isPrimary)) {
      mockDatabase.upsertWallet({
        ...wallet,
        isPrimary: false,
        updatedAt: this.iso(),
        version: wallet.version + 1,
      });
    }
  }

  // ---------- favoritos ----------

  listFavorites(token: string | null) {
    const user = this.requireUser(token);
    const record = this.state.favorites[user.id] ?? { nftIds: [], version: 0 };
    return { nftIds: [...record.nftIds], version: record.version };
  }

  setFavorite(token: string | null, nftId: string, favorite: boolean) {
    const user = this.requireUser(token);
    if (!mockDatabase.getNft(nftId)) throw new DomainError(404, 'NOT_FOUND', 'NFT não encontrado.');

    const record = this.state.favorites[user.id] ?? { nftIds: [], version: 0 };
    const has = record.nftIds.includes(nftId);

    if (favorite !== has) {
      record.nftIds = favorite
        ? [...record.nftIds, nftId]
        : record.nftIds.filter((id) => id !== nftId);
      record.version += 1;
    }
    this.state.favorites[user.id] = record;
    this.persist();
    return { nftIds: [...record.nftIds], version: record.version };
  }

  // ---------- carrinho ----------

  private ownerKey(token: string | null, guestId: string | null) {
    if (token && this.state.sessions[token]) {
      const user = this.requireUser(token);
      return { key: `user:${user.id}`, userId: user.id };
    }
    if (token) this.requireUser(token); // sessão informada porém inválida
    if (!guestId) {
      throw new DomainError(400, 'VALIDATION_ERROR', 'Identificador de visitante ausente.');
    }
    return { key: `guest:${guestId}`, userId: null };
  }

  private cartRecord(ownerKey: string, userId: string | null) {
    this.state.carts[ownerKey] ??= {
      id: `cart-${ownerKey.replace(':', '-')}`,
      ownerKey,
      userId,
      items: [],
      version: 1,
      updatedAt: this.iso(),
    };
    return this.state.carts[ownerKey];
  }

  private touch(cart: CartRecord) {
    cart.version += 1;
    cart.updatedAt = this.iso();
    this.persist();
  }

  private toCart(record: CartRecord): Cart {
    const items = record.items.flatMap((item) => {
      const nft = mockDatabase.getNft(item.nftId);
      if (!nft) return [];
      return [
        {
          id: item.id,
          nftId: item.nftId,
          nft,
          quantity: item.quantity,
          unitPriceEth: nft.priceEth,
          availableEditions: nft.availableEditions,
          lineTotalEth: money(new Decimal(nft.priceEth).times(item.quantity)),
        },
      ];
    });
    const subtotal = items.reduce((sum, item) => sum.plus(item.lineTotalEth), new Decimal(0));

    return {
      id: record.id,
      userId: record.userId,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalEth: money(subtotal),
      updatedAt: record.updatedAt,
      version: record.version,
    };
  }

  getCart(token: string | null, guestId: string | null) {
    const { key, userId } = this.ownerKey(token, guestId);
    return this.toCart(this.cartRecord(key, userId));
  }

  addCartItem(token: string | null, guestId: string | null, body: unknown) {
    const data = parseBody(
      z.object({ nftId: z.string().min(1), quantity: z.number().int().positive() }),
      body,
    );
    const { key, userId } = this.ownerKey(token, guestId);
    const nft = this.requireNft(data.nftId);
    const record = this.cartRecord(key, userId);
    const existing = record.items.find((item) => item.nftId === data.nftId);
    const nextQuantity = (existing?.quantity ?? 0) + data.quantity;

    this.assertAvailable(nft, nextQuantity);

    if (existing) existing.quantity = nextQuantity;
    else record.items.push({ id: this.nextId('item'), nftId: data.nftId, quantity: data.quantity });
    this.touch(record);
    return this.toCart(record);
  }

  updateCartItem(token: string | null, guestId: string | null, itemId: string, body: unknown) {
    const data = parseBody(z.object({ quantity: z.number().int().positive() }), body);
    const { key, userId } = this.ownerKey(token, guestId);
    const record = this.cartRecord(key, userId);
    const item = record.items.find((entry) => entry.id === itemId);

    if (!item) throw new DomainError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.');
    this.assertAvailable(this.requireNft(item.nftId), data.quantity);

    item.quantity = data.quantity;
    this.touch(record);
    return this.toCart(record);
  }

  removeCartItem(token: string | null, guestId: string | null, itemId: string) {
    const { key, userId } = this.ownerKey(token, guestId);
    const record = this.cartRecord(key, userId);

    if (!record.items.some((entry) => entry.id === itemId)) {
      throw new DomainError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.');
    }
    record.items = record.items.filter((entry) => entry.id !== itemId);
    this.touch(record);
    return this.toCart(record);
  }

  private mergeGuestCart(userId: string, guestId: string | undefined) {
    if (!guestId) return;
    const guest = this.state.carts[`guest:${guestId}`];
    if (!guest || guest.items.length === 0) return;

    const target = this.cartRecord(`user:${userId}`, userId);
    for (const item of guest.items) {
      const nft = mockDatabase.getNft(item.nftId);
      if (!nft) continue;
      const existing = target.items.find((entry) => entry.nftId === item.nftId);
      const quantity = Math.min(nft.availableEditions, (existing?.quantity ?? 0) + item.quantity);
      if (quantity < 1) continue;
      if (existing) existing.quantity = quantity;
      else target.items.push({ id: this.nextId('item'), nftId: item.nftId, quantity });
    }
    target.version += 1;
    target.updatedAt = this.iso();
    delete this.state.carts[`guest:${guestId}`];
  }

  private requireNft(id: string) {
    const nft = mockDatabase.getNft(id);
    if (!nft) throw new DomainError(404, 'NOT_FOUND', 'NFT não encontrado.');
    return nft;
  }

  private assertAvailable(nft: NftSummary, quantity: number) {
    if (nft.availableEditions < 1) {
      throw new DomainError(409, 'EDITION_SOLD_OUT', `${nft.name} está esgotado.`);
    }
    if (quantity > nft.availableEditions) {
      throw new DomainError(
        409,
        'AVAILABILITY_EXCEEDED',
        `Restam apenas ${nft.availableEditions} edições de ${nft.name}.`,
      );
    }
  }

  // ---------- cotação ----------

  private assertCoupon(code: string | undefined) {
    if (!code) return 0;
    const fieldError = (reason: 'COUPON_INVALID' | 'COUPON_EXPIRED') =>
      new DomainError(
        422,
        'VALIDATION_ERROR',
        reason === 'COUPON_EXPIRED' ? 'Cupom expirado.' : 'Cupom inválido.',
        [
          {
            field: 'couponCode',
            message:
              reason === 'COUPON_EXPIRED' ? 'Este cupom expirou.' : 'Código promocional inválido.',
            code: reason,
          },
        ],
      );

    if (mockDatabase.scenario === 'invalid-coupon') throw fieldError('COUPON_INVALID');
    if (mockDatabase.scenario === 'expired-coupon') throw fieldError('COUPON_EXPIRED');

    const coupon = couponFixtures.find((item) => item.code === code.trim().toUpperCase());
    if (!coupon) throw fieldError('COUPON_INVALID');
    if (new Date(coupon.expiresAt).getTime() <= this.now()) throw fieldError('COUPON_EXPIRED');
    return coupon.percentage;
  }

  createQuote(token: string | null, guestId: string | null, body: unknown): Quote {
    const data = parseBody(
      z.object({
        cartId: z.string().min(1),
        couponCode: z.string().trim().max(40).optional(),
        network: z.enum(['ethereum', 'polygon', 'solana']),
      }),
      body,
    );
    const { key, userId } = this.ownerKey(token, guestId);
    const record = this.cartRecord(key, userId);

    if (record.id !== data.cartId) {
      throw new DomainError(404, 'NOT_FOUND', 'Carrinho não encontrado.');
    }
    if (record.items.length === 0) {
      throw new DomainError(422, 'VALIDATION_ERROR', 'O carrinho está vazio.', [
        { field: 'cartId', message: 'Adicione itens ao carrinho.' },
      ]);
    }

    const percentage = this.assertCoupon(data.couponCode || undefined);
    const cart = this.toCart(record);
    const subtotal = new Decimal(cart.subtotalEth);
    const discount = subtotal.times(percentage).div(100);
    const fee = new Decimal(NETWORK_FEE_ETH[data.network]);
    const unitPrices = Object.fromEntries(
      cart.items.map((item) => [item.nftId, item.unitPriceEth]),
    );

    const quote: StoredQuote = {
      quoteId: this.nextId('quote'),
      cartId: record.id,
      cartVersion: record.version,
      items: cart.items.map((item) => ({
        nftId: item.nftId,
        quantity: item.quantity,
        unitPriceEth: item.unitPriceEth,
        lineTotalEth: item.lineTotalEth,
      })),
      subtotalEth: money(subtotal),
      discountEth: money(discount),
      networkFeeEth: money(fee),
      totalEth: money(subtotal.minus(discount).plus(fee)),
      couponCode: data.couponCode ? data.couponCode.trim().toUpperCase() : null,
      network: data.network,
      status: 'valid',
      expiresAt: this.iso(QUOTE_TTL_MS),
      version: 1,
      ownerKey: key,
      unitPrices,
    };
    quote.status = this.evaluateQuote(quote, record);
    this.state.quotes[quote.quoteId] = quote;
    this.persist();
    return this.publicQuote(quote);
  }

  getQuote(token: string | null, guestId: string | null, id: string): Quote {
    const { key } = this.ownerKey(token, guestId);
    const quote = this.state.quotes[id];
    if (!quote || quote.ownerKey !== key)
      throw new DomainError(404, 'NOT_FOUND', 'Cotação não encontrada.');

    quote.status = this.evaluateQuote(quote, this.state.carts[key]);
    return this.publicQuote(quote);
  }

  private publicQuote(quote: StoredQuote): Quote {
    const { ownerKey: _owner, unitPrices: _prices, ...rest } = quote;
    void _owner;
    void _prices;
    return rest;
  }

  private evaluateQuote(quote: StoredQuote, cart: CartRecord | undefined): Quote['status'] {
    if (new Date(quote.expiresAt).getTime() <= this.now()) return 'expired';

    for (const item of quote.items) {
      const nft = mockDatabase.getNft(item.nftId);
      const line = cart?.items.find((entry) => entry.nftId === item.nftId);
      if (
        !nft ||
        nft.availableEditions < item.quantity ||
        (line && line.quantity < item.quantity)
      ) {
        return 'edition_sold_out';
      }
    }
    for (const item of quote.items) {
      if (mockDatabase.getNft(item.nftId)?.priceEth !== quote.unitPrices[item.nftId]) {
        return 'price_changed';
      }
    }
    return 'valid';
  }

  // ---------- pedidos ----------

  /** Altera preço/disponibilidade (evento `nft.updated`). Usado pelo cenário e pelos testes. */
  patchNft(id: string, patch: { priceEth?: string; availableEditions?: number }) {
    const updated = mockDatabase.updateNft(id, patch);
    if (!updated) throw new DomainError(404, 'NOT_FOUND', 'NFT não encontrado.');
    this.persist();
    this.emit({ type: 'nft.updated', nft: updated });
    return updated;
  }

  createOrder(token: string | null, idempotencyKey: string | null, body: unknown) {
    const user = this.requireUser(token);
    if (!idempotencyKey) {
      throw new DomainError(400, 'VALIDATION_ERROR', 'O cabeçalho Idempotency-Key é obrigatório.');
    }

    const storeKey = `${user.id}:${idempotencyKey}`;
    const print = fingerprint(body);
    const previous = this.state.idempotency[storeKey];

    if (previous) {
      if (previous.fingerprint !== print) {
        throw new DomainError(
          409,
          'IDEMPOTENCY_CONFLICT',
          'A chave de idempotência já foi usada com outro conteúdo.',
        );
      }
      const order = this.state.orders[previous.orderId];
      return { order: this.settle(order), replayed: true };
    }

    const data = parseBody(CreateOrderRequestSchema, body);
    const ownerKey = `user:${user.id}`;
    const quote = this.state.quotes[data.quoteId];

    if (!quote || quote.ownerKey !== ownerKey || quote.cartId !== data.cartId) {
      throw new DomainError(404, 'NOT_FOUND', 'Cotação não encontrada.');
    }
    if (quote.network !== data.network) {
      throw new DomainError(422, 'VALIDATION_ERROR', 'A rede difere da cotação.', [
        { field: 'network', message: 'A rede deve ser a mesma da cotação.' },
      ]);
    }
    const wallet = mockDatabase.getWallet(data.walletId);
    if (!wallet || wallet.userId !== user.id) {
      throw new DomainError(422, 'VALIDATION_ERROR', 'Carteira inválida.', [
        { field: 'walletId', message: 'Selecione uma de suas carteiras.' },
      ]);
    }

    // Cenários: o catálogo muda uma vez durante o checkout.
    const first = quote.items[0];
    if (
      first &&
      mockDatabase.scenario === 'price-changed' &&
      this.consumeEffect(`price:${user.id}`)
    ) {
      const nft = this.requireNft(first.nftId);
      this.patchNft(nft.id, { priceEth: money(new Decimal(nft.priceEth).plus('0.10')) });
    }
    if (first && mockDatabase.scenario === 'sold-out' && this.consumeEffect(`soldout:${user.id}`)) {
      this.patchNft(first.nftId, { availableEditions: 0 });
    }

    const status = this.evaluateQuote(quote, this.state.carts[ownerKey]);
    if (status !== 'valid') {
      quote.status = status;
      this.persist();
      const messages = {
        price_changed: ['PRICE_CHANGED', 'O preço mudou. Revise a nova cotação para continuar.'],
        edition_sold_out: ['EDITION_SOLD_OUT', 'Uma das edições ficou indisponível.'],
        expired: ['QUOTE_EXPIRED', 'A cotação expirou. Gere uma nova para continuar.'],
      } as const;
      const [code, message] = messages[status as keyof typeof messages];
      throw new DomainError(409, code, message);
    }

    const stamp = this.iso();
    const items: OrderItemSnapshot[] = quote.items.map((item) => {
      const nft = this.requireNft(item.nftId);
      return {
        nftId: item.nftId,
        tokenId: nft.tokenId,
        name: nft.name,
        collectionName: nft.collectionName,
        imageUrl: nft.imageUrl,
        edition: `1/${nft.totalEditions}`,
        quantity: item.quantity,
        unitPriceEth: item.unitPriceEth,
        lineTotalEth: item.lineTotalEth,
      };
    });

    const order: StoredOrder = {
      id: this.nextId('order'),
      userId: user.id,
      status: 'pending',
      items,
      totals: {
        subtotalEth: quote.subtotalEth,
        discountEth: quote.discountEth,
        networkFeeEth: quote.networkFeeEth,
        totalEth: quote.totalEth,
        couponCode: quote.couponCode,
      },
      network: quote.network,
      walletAddress: wallet.address,
      transactionHash: null,
      explorerUrl: null,
      failureReason: null,
      createdAt: stamp,
      updatedAt: stamp,
      version: 1,
      quoteId: quote.quoteId,
      cartOwnerKey: ownerKey,
    };
    this.state.orders[order.id] = order;
    this.state.idempotency[storeKey] = { fingerprint: print, orderId: order.id };
    this.persist();
    this.emit({ type: 'order.updated', order: this.publicOrder(order), userId: user.id });

    // Cenário de timeout: o pedido existe, mas a resposta é perdida (uma única vez por chave).
    const lostResponse =
      mockDatabase.scenario === 'order-timeout' && this.consumeEffect(`timeout:${storeKey}`);
    this.persist();

    return { order: this.publicOrder(order), replayed: false, lostResponse };
  }

  listOrders(token: string | null) {
    const user = this.requireUser(token);
    const orders = Object.values(this.state.orders)
      .filter((order) => order.userId === user.id)
      .map((order) => this.settle(order))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { orders };
  }

  getOrder(token: string | null, id: string) {
    const user = this.requireUser(token);
    const order = this.state.orders[id];
    if (!order || order.userId !== user.id)
      throw new DomainError(404, 'NOT_FOUND', 'Pedido não encontrado.');
    return this.settle(order);
  }

  private publicOrder(order: StoredOrder): Order {
    const { quoteId: _q, cartOwnerKey: _c, ...rest } = order;
    void _q;
    void _c;
    return rest;
  }

  /** Resolve pedidos pendentes cujo tempo de liquidação passou (confirmado ou recusado). */
  settle(order: StoredOrder | undefined): Order {
    if (!order) throw new DomainError(404, 'NOT_FOUND', 'Pedido não encontrado.');
    const due = this.now() - new Date(order.createdAt).getTime() >= ORDER_SETTLE_MS;
    if (order.status !== 'pending' || !due) return this.publicOrder(order);

    return this.finalizeOrder(order.id);
  }

  /** Força a liquidação do pedido (usado pelo timer do socket e pelos testes). */
  finalizeOrder(orderId: string): Order {
    const order = this.state.orders[orderId];
    if (!order) throw new DomainError(404, 'NOT_FOUND', 'Pedido não encontrado.');
    if (order.status !== 'pending') return this.publicOrder(order);

    if (mockDatabase.scenario === 'payment-rejected') {
      order.status = 'rejected';
      order.failureReason = 'Pagamento recusado pela carteira simulada.';
    } else {
      order.status = 'confirmed';
      order.transactionHash = `0x${Array.from({ length: 64 }, (_, index) =>
        ((order.id.charCodeAt(index % order.id.length) + index * 7) % 16).toString(16),
      ).join('')}`;
      order.explorerUrl = `https://etherscan.io/tx/${order.transactionHash}`;
      this.applyPurchase(order);
    }
    order.version += 1;
    order.updatedAt = this.iso();
    this.persist();

    const publicOrder = this.publicOrder(order);
    this.emit({ type: 'order.updated', order: publicOrder, userId: order.userId });
    return publicOrder;
  }

  /** Baixa estoque e remove do carrinho apenas o que foi comprado. */
  private applyPurchase(order: StoredOrder) {
    const cart = this.state.carts[order.cartOwnerKey];

    for (const item of order.items) {
      const nft = mockDatabase.getNft(item.nftId);
      if (nft) {
        this.patchNft(nft.id, {
          availableEditions: Math.max(0, nft.availableEditions - item.quantity),
        });
      }
      const line = cart?.items.find((entry) => entry.nftId === item.nftId);
      if (cart && line) {
        line.quantity -= item.quantity;
        if (line.quantity <= 0) cart.items = cart.items.filter((entry) => entry !== line);
      }
    }
    if (cart) {
      cart.version += 1;
      cart.updatedAt = this.iso();
    }
  }

  get pendingOrderIds() {
    return Object.values(this.state.orders)
      .filter((order) => order.status === 'pending')
      .map((order) => order.id);
  }
}

export const mockDomain = new MockDomain();
