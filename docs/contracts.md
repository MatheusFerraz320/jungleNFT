# Contratos REST e eventos

## Convenções

- Base: `/api`
- Conteúdo: `application/json`
- Erros: envelope `ApiErrorResponse`
- Sessão: cookie simulado com `withCredentials`
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

## Implementado no scaffold

| Método | Rota               | Request                    | Response                                             |
| ------ | ------------------ | -------------------------- | ---------------------------------------------------- |
| GET    | `/api/health`      | —                          | `{ status: 'ok', timestamp, scenario, mocks: true }` |
| POST   | `/api/mocks/reset` | `{ scenario: ScenarioId }` | `{ scenario: ScenarioId }`                           |

## Planejado

### Sessão e conta

| Método | Rota                 | Operação     |
| ------ | -------------------- | ------------ |
| POST   | `/api/auth/register` | Cadastro     |
| POST   | `/api/auth/login`    | Login        |
| GET    | `/api/auth/session`  | Sessão atual |
| POST   | `/api/auth/logout`   | Logout       |

### NFTs

| Método | Rota            | Operação                                           |
| ------ | --------------- | -------------------------------------------------- |
| GET    | `/api/nfts`     | Listagem com busca, filtros, ordenação e paginação |
| GET    | `/api/nfts/:id` | Detalhe                                            |

Query params: `q`, `categories`, `rarities`, `minPriceEth`, `maxPriceEth`, `network`, `availableOnly`, `sort`, `page`, `pageSize`.

### Favoritos

| Método | Rota                    | Operação |
| ------ | ----------------------- | -------- |
| GET    | `/api/favorites`        | Listagem |
| PUT    | `/api/favorites/:nftId` | Inclusão |
| DELETE | `/api/favorites/:nftId` | Remoção  |

### Carrinho

| Método | Rota                      | Operação                |
| ------ | ------------------------- | ----------------------- |
| GET    | `/api/cart`               | Consulta                |
| POST   | `/api/cart/items`         | Inclusão                |
| PATCH  | `/api/cart/items/:itemId` | Alteração de quantidade |
| DELETE | `/api/cart/items/:itemId` | Remoção                 |

### Cotação

| Método | Rota          | Operação                                               |
| ------ | ------------- | ------------------------------------------------------ |
| POST   | `/api/quotes` | Valida carrinho, cupom, disponibilidade, taxas e total |

### Pedidos

| Método | Rota              | Operação            |
| ------ | ----------------- | ------------------- |
| POST   | `/api/orders`     | Criação idempotente |
| GET    | `/api/orders/:id` | Estado e recibo     |

A mesma chave com o mesmo conteúdo recupera o mesmo pedido. A mesma chave com conteúdo diferente retorna `409`.

### Perfil e carteiras

| Método | Rota                    | Operação           |
| ------ | ----------------------- | ------------------ |
| GET    | `/api/profile`          | Consulta           |
| PATCH  | `/api/profile`          | Dados/avatar       |
| POST   | `/api/profile/password` | Alteração de senha |
| GET    | `/api/wallets`          | Consulta           |
| POST   | `/api/wallets`          | Cadastro           |
| PATCH  | `/api/wallets/:id`      | Atualização        |

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

Regras: versão monotônica, deduplicação por `eventId`, descarte de eventos antigos, reconciliação REST após reconexão e isolamento por sessão.
