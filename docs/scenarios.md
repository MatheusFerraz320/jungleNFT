# Cenários de mock

## Seleção

Ordem de precedência:

1. `localStorage['junglenft:scenario']`;
2. `VITE_DEFAULT_SCENARIO`;
3. `default`.

Também é possível resetar via `POST /api/mocks/reset`.

## Catálogo

| ID                      | Objetivo                         | Estado atual                    |
| ----------------------- | -------------------------------- | ------------------------------- |
| `default`               | Sucesso com dados consistentes   | Implementado                    |
| `empty`                 | Catálogo sem resultados          | Reservado                       |
| `slow`                  | Validar skeletons e carregamento | Implementado em `/api/health`   |
| `out-of-order`          | Respostas fora de ordem          | Reservado; exigirá PRNG semeado |
| `offline`               | Falha de conexão                 | Implementado em `/api/health`   |
| `unauthorized`          | Acesso não autorizado (403)      | Reservado                       |
| `session-expired`       | Sessão inválida (401)            | Reservado                       |
| `registration-conflict` | E-mail já cadastrado             | Reservado                       |
| `invalid-coupon`        | Cupom inexistente                | Reservado                       |
| `expired-coupon`        | Cupom expirado                   | Reservado                       |
| `price-changed`         | Preço muda durante checkout      | Reservado                       |
| `sold-out`              | Edição esgotada durante checkout | Reservado                       |
| `order-timeout`         | Pedido criado, resposta perdida  | Reservado                       |
| `payment-confirmed`     | Pagamento confirmado             | Reservado                       |
| `payment-rejected`      | Pagamento recusado               | Reservado                       |

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
