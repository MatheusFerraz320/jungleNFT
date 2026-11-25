# Cenários de mock

## Seleção

Ordem de precedência:

1. `localStorage['junglenft:scenario']`;
2. `VITE_DEFAULT_SCENARIO`;
3. `default`.

Também é possível resetar via `POST /api/mocks/reset`.

A latência variável usa um PRNG semeado, reiniciado a cada reset: a sequência é determinística.

## Catálogo

Todos os cenários estão implementados na camada de rede (MSW). Usuários fictícios: `ana@jungle.test` e
`bruno@jungle.test`, senha `Senha@123` (somente o hash salgado é armazenado).

| ID                      | Efeito                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `default`               | Sucesso, sem latência. Pedido pendente é confirmado após ~1,5 s                                   |
| `empty`                 | Catálogo sem resultados                                                                           |
| `slow`                  | ~1,8 s de latência em todas as chamadas (skeletons)                                               |
| `out-of-order`          | Latência variável com PRNG semeado (reproduzível) para respostas fora de ordem                    |
| `offline`               | Toda chamada REST falha como erro de rede                                                         |
| `unauthorized`          | Recursos privados respondem `403 FORBIDDEN`                                                       |
| `session-expired`       | Recursos privados respondem `401 SESSION_EXPIRED`                                                 |
| `registration-conflict` | Cadastro responde `409` com `fieldErrors[email]`                                                  |
| `invalid-coupon`        | Qualquer cupom responde `422` (`COUPON_INVALID`)                                                  |
| `expired-coupon`        | Qualquer cupom responde `422` (`COUPON_EXPIRED`)                                                  |
| `price-changed`         | Na 1ª criação de pedido o preço sobe 0,10 ETH → `409 PRICE_CHANGED`; nova cotação resolve         |
| `sold-out`              | Na 1ª criação de pedido a edição esgota → `409 EDITION_SOLD_OUT`                                  |
| `order-timeout`         | O pedido é criado, mas a 1ª resposta é `504`; repetir a `Idempotency-Key` recupera o mesmo pedido |
| `payment-confirmed`     | Pedido pendente → `confirmed` (hash e link de exploração simulados)                               |
| `payment-rejected`      | Pedido pendente → `rejected`, preservando os itens do carrinho                                    |

Sem cenário, também são naturais: cupom inexistente (`422`), `EXPIRED10` expirado (`422`), e-mail duplicado (`409`),
senha atual incorreta (`422`), limite de edições (`409`) e endereço de carteira duplicado (`409`).

## Controle em tempo de execução

Endpoints do ambiente simulado (todos `POST /api/mocks/...`):

| Rota               | Corpo                               | Efeito                                              |
| ------------------ | ----------------------------------- | --------------------------------------------------- |
| `/reset`           | `{ scenario }`                      | Restaura integralmente o estado e define o cenário  |
| `/scenario`        | `{ scenario }`                      | Troca o cenário sem apagar dados                    |
| `/faults`          | `{ method, path, status, times }`   | As próximas `times` chamadas falham com `status`    |
| `/expire-sessions` | —                                   | Expira todas as sessões (expiração durante o fluxo) |
| `/nfts/:id`        | `{ priceEth?, availableEditions? }` | Altera o catálogo e emite `nft.updated`             |

O estado (usuários, carteiras, favoritos, carrinhos, cotações, pedidos, catálogo) persiste em `localStorage`
(`junglenft:mocks:domain`) e sobrevive a refresh; `/reset` o restaura por completo.

## Reprodução rápida

```js
localStorage.setItem('junglenft:scenario', 'offline');
location.reload();
```

Reset:

```js
await fetch('/api/mocks/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'default' }),
});
```

## Isolamento nos testes

Cada teste limpa o localStorage antes da navegação. O store MSW é recriado a cada carregamento da página. Testes de tempo deverão usar relógio controlado e latência explícita, sem depender de `Math.random()` não semeado.
