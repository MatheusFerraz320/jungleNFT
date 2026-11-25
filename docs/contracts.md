# Contratos REST e eventos

## Convenções

- Base: `/api`
- Conteúdo: `application/json`
- Erros: envelope `ApiErrorResponse`
- Sessão: token opaco devolvido no login/cadastro e enviado em `Authorization: Bearer <token>` (cookies `Set-Cookie` não são aplicáveis a respostas do Service Worker)
- Carrinho de visitante: header `X-Guest-Id`; enviado também como `guestId` no login/cadastro para mesclar ao carrinho da conta
- ETH: string decimal não negativa
- Quantidade: inteiro positivo
- Idempotência de pedido: header `Idempotency-Key`

## Erro padrão

```ts
type ApiErrorResponse = {
  code: string;
  message: string;
  fieldErrors?: Array<{ field: string; message: string; code?: string }>;
  requestId?: string;
};
```

Códigos esperados: `VALIDATION_ERROR`, `UNAUTHORIZED`, `SESSION_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`, `TIMEOUT` e `NETWORK_ERROR`.

## Recursos implementados (MSW)

Todos retornam o envelope de erro padrão. `🔒` exige `Authorization`. Status: `401 UNAUTHORIZED` (sem token),
`401 SESSION_EXPIRED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409` (conflito), `422 VALIDATION_ERROR` (com `fieldErrors`),
`504 TIMEOUT` (falha transitória).

### Sessão e conta

| Método | Rota                   | Request                               | Response                                       |
| ------ | ---------------------- | ------------------------------------- | ---------------------------------------------- |
| POST   | `/api/auth/register`   | `{ name, email, password, guestId? }` | `201 AuthResponse` · `409 EMAIL_TAKEN`         |
| POST   | `/api/auth/login`      | `{ email, password, guestId? }`       | `200 AuthResponse` · `401 INVALID_CREDENTIALS` |
| GET    | `/api/auth/session` 🔒 | —                                     | `{ user, expiresAt }`                          |
| POST   | `/api/auth/logout`     | —                                     | `204`                                          |

`AuthResponse = { user, expiresAt, token }`. Sessões duram 8 h; senhas guardadas apenas como SHA-256 salgado.

### NFTs

`GET /api/nfts` (busca, filtros, ordenação, paginação) e `GET /api/nfts/:id`.

### Favoritos 🔒

| Método | Rota                    | Response                            |
| ------ | ----------------------- | ----------------------------------- |
| GET    | `/api/favorites`        | `{ nftIds, version }`               |
| PUT    | `/api/favorites/:nftId` | `{ nftIds, version }` (idempotente) |
| DELETE | `/api/favorites/:nftId` | `{ nftIds, version }` (idempotente) |

### Carrinho (visitante via `X-Guest-Id`, ou 🔒)

| Método | Rota                      | Request               | Response                                                    |
| ------ | ------------------------- | --------------------- | ----------------------------------------------------------- |
| GET    | `/api/cart`               | —                     | `Cart` (preços e disponibilidade atuais)                    |
| POST   | `/api/cart/items`         | `{ nftId, quantity }` | `201 Cart` · `409 AVAILABILITY_EXCEEDED / EDITION_SOLD_OUT` |
| PATCH  | `/api/cart/items/:itemId` | `{ quantity }`        | `Cart`                                                      |
| DELETE | `/api/cart/items/:itemId` | —                     | `Cart`                                                      |

### Cotação (referência para finalizar o pedido)

| Método | Rota              | Request                            | Response                                                                     |
| ------ | ----------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| POST   | `/api/quotes`     | `{ cartId, network, couponCode? }` | `201 Quote` · `422` cupom (`COUPON_INVALID/EXPIRED`)                         |
| GET    | `/api/quotes/:id` | —                                  | `Quote` reavaliada (`valid`, `price_changed`, `edition_sold_out`, `expired`) |

Taxa de rede: Ethereum `0.016`, Polygon `0.002`, Solana `0.0005` ETH. Cotação expira em 5 min. Cupom: `JUNGLE10` (10%).
Valores ETH trafegam como strings decimais (cálculo com `decimal.js`).

### Pedidos 🔒

| Método | Rota              | Request                                                           | Response                      |
| ------ | ----------------- | ----------------------------------------------------------------- | ----------------------------- |
| POST   | `/api/orders`     | `CreateOrderRequest` + header **`Idempotency-Key`** (obrigatório) | `201 Order` (`200` no replay) |
| GET    | `/api/orders`     | —                                                                 | `{ orders }`                  |
| GET    | `/api/orders/:id` | —                                                                 | `Order` (estado e recibo)     |

- Mesma chave + mesmo conteúdo → o **mesmo pedido**; mesma chave + conteúdo diferente → `409 IDEMPOTENCY_CONFLICT`.
- A criação revalida preço, disponibilidade, cupom e taxa: `409 PRICE_CHANGED | EDITION_SOLD_OUT | QUOTE_EXPIRED` exigem nova cotação.
- Pedido nasce `pending` e passa a `confirmed`/`rejected` (terminal). Ao confirmar: baixa de estoque e remoção **apenas** dos itens/quantidades comprados.
- O recibo é um snapshot (itens, preços e totais) e não muda quando o catálogo muda.

### Perfil e carteiras 🔒

| Método | Rota                    | Request                                                                                                                                | Response                       |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| GET    | `/api/profile`          | —                                                                                                                                      | `{ user }`                     |
| PATCH  | `/api/profile`          | `{ name, email, avatarUrl?, username?, ensName?, walletNickname? }`                                                                    | `{ user }` · `409 EMAIL_TAKEN` |
| POST   | `/api/profile/password` | `{ currentPassword, newPassword }`                                                                                                     | `204` · `422 WRONG_PASSWORD`   |
| GET    | `/api/wallets`          | —                                                                                                                                      | `{ wallets }`                  |
| POST   | `/api/wallets`          | `{ label, address, network, isPrimary?, displayName?, profileName?, walletType?, referralCode?, email?, ensName?, secondaryAddress? }` | `201 Wallet`                   |
| PATCH  | `/api/wallets/:id`      | parcial de `CreateWalletRequest`                                                                                                       | `Wallet`                       |

O avatar trafega como data URL (JPEG 256×256, ≤ 200 KB). No máximo duas carteiras (principal e secundária); apenas uma principal; endereços únicos por usuário (`409 ADDRESS_TAKEN`).

## Eventos Socket.IO

Envelope comum:

```ts
type EventMeta = {
  eventId: string;
  resourceType: 'nft' | 'order' | 'scene';
  resourceId: string;
  version: number;
  sessionId: string | null;
  occurredAt: string;
};
```

### `scene.ready`

Enviado após `scene:subscribe`. Confirma conexão e informa o cenário ativo.

### `nft.updated`

Atualiza preço e disponibilidade no catálogo, detalhe e carrinho.

```ts
type NftUpdatedEvent = {
  type: 'nft.updated';
  meta: EventMeta & { resourceType: 'nft' };
  payload: { nft: NftSummary };
};
```

### `order.updated`

Atualiza o estado do pedido e dispara confirmação ou recusa.

```ts
type OrderUpdatedEvent = {
  type: 'order.updated';
  meta: EventMeta & { resourceType: 'order' };
  payload: { orderId: string; order: Order };
};
```

### Transporte e sessão

Socket.IO (`socket.io-client`, transporte `websocket`) sobre o WebSocket interceptado pelo MSW via
`@mswjs/socket.io-binding` — o cliente real é exercitado em desenvolvimento, demo e testes. O cliente envia
`scene:subscribe { token }`; o servidor responde `scene:ready`.

- `nft.updated`: enviado a todos (`meta.sessionId = null`).
- `order.updated`: enviado só às conexões do dono, com `meta.sessionId` = token da sessão.
- Eventos de domínio e REST compartilham a mesma fonte (`MockDomain`), então REST e socket nunca divergem.
- O pedido `pending` é liquidado por timer (~1,5 s) que emite `order.updated`; a liquidação também é resolvida
  sob demanda na leitura REST, o que permite recuperar o estado após queda de conexão ou refresh.

**Limitações do ambiente de mocks:** o servidor vive no Service Worker/aba (sem multi-aba/multi-cliente reais);
o binding Socket.IO é experimental e suporta apenas o transporte `websocket` (sem long-polling); não há ack/rooms
nativos — o direcionamento por usuário é feito pelo hub (`socket-hub.ts`).

### Regras do cliente

Eventos são validados (Zod), descartados se a `sessionId` não for a atual, deduplicados por `eventId` e ignorados se
a `version` não superar a já aplicada ao recurso (`createEventGuard`). A conexão é recriada a cada troca de sessão
(listeners e socket antigos liberados); após reconexão, as consultas ativas são reconciliadas com a API REST.

Regras: versão monotônica, deduplicação por `eventId`, descarte de eventos antigos, reconciliação REST após reconexão e isolamento por sessão.
