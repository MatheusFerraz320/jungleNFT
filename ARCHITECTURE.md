# Arquitetura

## 1. Visão geral

Marketplace de NFTs (React 19 + TypeScript) com descoberta, compra e conta do colecionador. Toda a
"API" é simulada na camada de rede com **MSW** e reaproveitada em desenvolvimento, demonstração e
testes; a aplicação só enxerga HTTP (Axios) e WebSocket (Socket.IO).

```text
UI (features) ──► TanStack Query ──► Axios ──► MSW (Service Worker) ──► MockDomain ◄─┐
       ▲                                                                              │
       └──────── RealtimeSync ◄── socket.io-client ◄── MSW ws + socket-hub ◄──────────┘
```

Estado das entregas: catálogo, detalhe, favoritos, carrinho, cotação, pagamento, pedidos, conta,
perfil e carteiras **integrados à API simulada**; tempo real (`nft.updated`, `order.updated`);
**135 testes E2E** (desktop + mobile) e regressão visual; auditoria Lighthouse.

## 2. Camadas e responsabilidades

```text
routes → features → shared          mocks → shared/contracts
```

- **routes**: declaração de rota, search params (Zod) e guards (`requireAuth`). Sem regra de negócio.
- **features** (`catalog`, `nft`, `cart`, `checkout`, `orders`, `auth`, `favorites`, `profile`,
  `wallets`): API, hooks de Query, schemas e componentes do domínio; expõem só o necessário por `index.ts`.
- **shared**: contratos Zod, cliente HTTP, erros, query keys, UI base, libs e realtime. Não importa features
  — a ponte para favoritos usa um contexto (`favorites-context`), implementado na aplicação.
- **app**: composição (providers, router, `RealtimeSync`, layout). Única camada que enxerga todas as features.
- **mocks**: fixtures, domínio, handlers REST, hub Socket.IO e cenários. Nunca importado por componentes,
  hooks ou pelo cliente Axios — não há respostas fictícias nem caminhos de negócio alternativos na UI.

O ESLint (`no-restricted-imports`) impõe essas fronteiras.

## 3. Contratos e transporte

`src/shared/contracts` é a fonte única de tipos e validação (Zod): requests, responses e eventos. Axios
valida a resposta em runtime; o MSW e os formulários reutilizam os mesmos schemas. Documentação dos
recursos e eventos em [`docs/contracts.md`](docs/contracts.md).

- ETH trafega como **string decimal canônica**; quantidades são inteiros positivos. `decimal.js` (precisão 40)
  faz cálculos no servidor simulado; no cliente, **subtotal, desconto, taxa e total vêm da cotação da API**.
- Erros seguem o envelope `ApiErrorResponse` (`code`, `message`, `fieldErrors`, `requestId`).

## 4. HTTP e erros

`src/shared/api/http.ts` (Axios): `baseURL` validado, timeout de 15 s, JSON automático e, em cada
requisição, `Authorization: Bearer <token>` e `X-Guest-Id`. As chamadas aguardam `apiReady` (o
Service Worker do MSW) em vez de bloquear o primeiro render. Erros viram `ApiError`.

- `401 SESSION_EXPIRED | UNAUTHORIZED` dispara `junglenft:unauthorized` (fluxo de expiração).
- `401 INVALID_CREDENTIALS` (login) **não** é expiração e aparece no formulário.
- `fieldErrors` da API são projetados nos campos do formulário (`applyApiErrors`).

## 5. TanStack Query — cache, retries e sincronização

| Item                     | Política                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `staleTime` / `gcTime`   | 30 s / 5 min (sessão 60 s; cotações 0 — sempre frescas)                                                                                                                      |
| Retries (GET)            | até 2, só para rede, 5xx e 429, com backoff padrão; sessão e cotação sem retry                                                                                               |
| Mutations                | sem retry automático, **exceto** criação de pedido em timeout/rede/504 (mesma `Idempotency-Key`)                                                                             |
| Foco / reconexão         | `refetchOnWindowFocus: false`; `refetchOnReconnect: true`                                                                                                                    |
| Respostas obsoletas      | `AbortSignal` do Query em catálogo, detalhe, favoritos, perfil, carteiras e cotação; troca de chave descarta resposta antiga                                                 |
| Isolamento               | chaves privadas incluem o `userId` (`favorites`, `cart`, `orders`, `profile`, `wallets`)                                                                                     |
| Invalidação              | mutations gravam a resposta no cache (carrinho) ou invalidam (carteiras, favoritos); eventos de tempo real aplicam/invalidam; pedido confirmado invalida carrinho e catálogo |
| Background               | `placeholderData: keepPreviousData` nas listas; `aria-busy` durante refetch                                                                                                  |
| **Atualização otimista** | favoritos: `onMutate` aplica, `onError` faz **rollback** + aviso, `onSettled` re-sincroniza                                                                                  |

Chaves centralizadas em `src/shared/api/query-keys.ts`.

## 6. Sessão e isolamento

- Login/cadastro devolvem um token opaco (`Authorization: Bearer`); cookies `Set-Cookie` não se aplicam a respostas do
  Service Worker. A sessão é recuperada após refresh por `GET /auth/session`; vale 8 h.
- **Senhas**: no mock guardam-se apenas **SHA-256 salgado** (nunca em claro).
- **Rotas privadas** (`/pagamento`, `/perfil`, `/carteiras`) usam `requireAuth` e redirecionam para
  `/login?redirect=…`; após autenticar, o fluxo é retomado.
- **Expiração** (durante navegação ou checkout): `SessionWatcher` limpa o token, descarta o cache privado e leva ao login
  preservando a rota — o carrinho é do servidor, então o contexto é retomado.
- **Troca de usuário / logout**: `replaceSession` grava a nova sessão (ou `null`) **notificando os componentes montados**
  e remove somente as queries privadas (`queryClient.clear()` desanexaria observers e deixaria dados antigos na tela).
  O socket é recriado por sessão e os listeners/subscriptions anteriores são liberados.

## 7. Carrinho

- O carrinho vive na API: **visitante** (`X-Guest-Id`) ou **usuário**. No login/cadastro o servidor **mescla** os itens do
  visitante respeitando a disponibilidade; o carrinho persiste após refresh.
- Quantidades respeitam `availableEditions` por NFT (`409 AVAILABILITY_EXCEEDED | EDITION_SOLD_OUT`).
- O resumo vem de `POST /quotes` (cupom validado pela API: `COUPON_INVALID | COUPON_EXPIRED`, taxa por rede, total).
- `nft.updated` com o carrinho aberto **informa** (toast) a mudança de preço/disponibilidade e **atualiza** carrinho e cotação.
- Falhas preservam os itens; na confirmação do pedido a API remove **apenas** os itens/quantidades comprados.

## 8. Checkout e pedidos

1. **Pagamento**: formulário do colecionador (react-hook-form + Zod), carteiras cadastradas, rede e simulação de
   conexão/recusa/desconexão (`WalletConnect` simula recusa de forma determinística).
2. **Revisão** (diálogo com foco controlado): refaz a cotação ao abrir (preço, disponibilidade, cupom, taxas). Se os valores
   mudarem — inclusive por `nft.updated` com o diálogo aberto — aparece o aviso e o botão passa a **"Confirmar novos valores"**.
3. **Idempotência**: cada cotação gera uma `Idempotency-Key`; cliques repetidos e reenvios após timeout/504 reutilizam a
   chave e recuperam o **mesmo pedido**; chave igual com conteúdo diferente → `409 IDEMPOTENCY_CONFLICT`.
4. **Estados**: `pending` → `confirmed` | `rejected` (terminais). A página `/pedido/:id` consulta enquanto `pending` e
   recupera o estado após refresh/reconexão; a confirmação só aparece para pedido efetivamente `confirmed`.
5. **Recibo**: snapshot imutável (itens, preços, totais); mudanças posteriores no catálogo não o alteram.

## 9. REST ↔ Socket.IO

### Transporte

`socket.io-client` v4, transporte `websocket`, sobre o WebSocket interceptado pelo MSW (`ws.link` +
`@mswjs/socket.io-binding`), path `/socket.io/`.

### Detalhes importantes

1. O MSW remove o prefixo `/socket.io/` antes do match; o handler usa a raiz (`/\/$/`).
2. O Engine.IO captura o `WebSocket` global ao carregar o módulo: `socket.io-client` é importado dinamicamente **depois** de
   o MSW estar ativo (`apiReady`).
3. `io.client.emit(...)` envia do servidor simulado ao cliente (`io.server.emit` tentaria alcançar um servidor real).
4. O binding não tem rooms/broadcast: o **`socket-hub`** mantém as conexões, associa cada uma ao usuário (token enviado em
   `scene:subscribe`) e direciona os eventos.

### Eventos e consistência

`MockDomain` é a única fonte de verdade: as mesmas mudanças alimentam as respostas REST e os eventos. `nft.updated` vai a
todos; `order.updated` só ao dono, com `meta.sessionId`. O pedido `pending` é liquidado por timer (~1,5 s) e também sob
demanda na leitura REST (por isso a retomada funciona sem socket).

### Regras do cliente

- Validação Zod; descarte de eventos com `sessionId` diferente da sessão atual;
- `createEventGuard`: ignora duplicatas (`eventId`) e versões não superiores às já aplicadas (sem regredir nem reaplicar efeitos);
- consultas em andamento são refeitas ao receber `nft.updated` (evita terminar com dado anterior ao evento);
- após **reconexão**, `invalidateQueries({ refetchType: 'active' })` reconcilia os recursos ativos com a REST;
- o provider recria a conexão a cada troca de sessão e remove todos os listeners no cleanup.

### Limitações do ambiente de mocks

Servidor no Service Worker/aba (sem multi-cliente real); binding experimental (apenas `websocket`, sem ack/rooms); eventos
perdidos durante uma queda são recuperados pela reconciliação REST, não por replay.

## 10. Mocking, persistência e cenários

- `MockDomain` (`src/mocks/db/domain.ts`): auth, favoritos, carrinhos, cotações, pedidos, perfil e carteiras, testado sem rede.
- Estado persistido em `localStorage` (`junglenft:mocks:domain`) — sobrevive a refresh; `POST /api/mocks/reset` restaura **integralmente**
  um cenário conhecido.
- **Cenários determinísticos** (latência, falhas, cupom, preço, esgotado, timeout, pagamento…) em
  [`docs/scenarios.md`](docs/scenarios.md); latência variável com **PRNG semeado**.
- **Controles**: reset, troca de cenário, **falhas injetáveis** (`/mocks/faults`), expiração de sessões, alteração de NFT e
  controle do socket (derrubar, emitir duplicado/antigo/de outra sessão). Todos pela rede, como a aplicação os enxerga.

## 11. Acessibilidade

- Foco visível global; navegação por teclado; diálogos Radix (busca, login, revisão) com foco preso, `Esc` e retorno do foco.
- Formulários: `label`, `aria-invalid`, `aria-describedby` e mensagens com `role="alert"`; erros da API nos campos.
- `aria-live`/toasts para mutations e eventos de tempo real; skeletons com `role="status"`, shimmer e `prefers-reduced-motion`.
- Estados não dependem só de cor (rótulos "Preço anterior", "principal", aviso textual de valores alterados).
- **axe** sem violações em início, detalhe, login, carrinho e perfil (desktop e mobile). Zoom/overflow: sem rolagem horizontal em 390/768/1440.

## 12. Performance

Ver [`docs/performance.md`](docs/performance.md): mediana de 3 execuções por página/perfil (desktop 99; mobile 80–82, abaixo da meta, com análise).
Otimizações: render sem esperar o MSW, preload do LCP, code splitting por rota, skeletons com dimensão do conteúdo (CLS 0), WebP e fonte local.

## 13. Testes

- **Unitários (Vitest)**: domínio simulado, handlers HTTP via MSW, versões/guarda de eventos, decimais.
- **E2E (Playwright)**: 135 testes em Chromium desktop (1440) e mobile (390) cobrindo os fluxos do enunciado; contexto novo por teste;
  relógio controlado (`page.clock`), latência e eventos disparados pelos controles de mock; relatório HTML e traces de falha.
- **Regressão visual**: início, detalhe, carrinho e pagamento, com baselines em `e2e/visual/visual.spec.ts-snapshots/`
  (geradas com Playwright 1.56.1 em Linux; atualize com `pnpm test:e2e:update`).

## 14. Decisões de UX e limitações

- Tokens do Figma em `design/tokens.json` e `globals.css`; Roboto Mono Variable servida localmente.
- Rotas: `/`, `/nft/$nftId`, `/carrinho`, `/pagamento`, `/pedido/$orderId`, `/login`, `/cadastro`, `/perfil`, `/carteiras`; 404 tratada.
- Faltas no escopo: Atividade, Ofertas, Arquivos baixados e Suporte respondem com aviso e **não** simulam sucesso; login social idem.
- O `chromium` do Playwright exige libs do sistema; no CI usa-se a imagem oficial `mcr.microsoft.com/playwright`.

### Fidelidade visual e desvios do Figma

Metodologia: cada frame (`design/frames/*.png`) foi comparado lado a lado com a captura do app (Chromium, 1440 e 414 px);
posições, tamanhos e cores foram medidos por varredura de pixels. `text-rendering: geometricPrecision` replica o avanço
fracionário de glifos do Figma.

Desvios deliberados (todos por requisito funcional do enunciado):

- **Filtros**: o Figma só mostra Coleções, Faixa de preço e Rede; foram acrescentados Raridade e "Somente disponíveis"
  (filtros combináveis exigidos), no mesmo estilo visual.
- **Categorias/redes**: contrato e fixtures seguem as 9 coleções e 3 redes do Figma.
- **Ordenação mobile**: o frame mobile não tem ordenação; ela fica no painel de filtros (botão laranja da busca).
- **Preço**: exibido como a string decimal da API (`1.19 ETH`), sem arredondar. **Preço anterior** sem tachado (como no
  Figma), com rótulo para leitores de tela.
- **Galeria mobile**: sem miniaturas no frame; elas existem a partir de 640 px.
- **Pagamento mobile**: o frame não traz o formulário do colecionador; ele aparece apenas no desktop (no mobile os dados vêm do perfil).
- **Carteira e rede**: o Figma lista provedores; aqui a lista é de **carteiras cadastradas** (exigido), e o provedor é escolhido em
  "Tipo de carteira".
- **Login/Cadastro**: modal sobre a Início no desktop (como no Figma) e página cheia no mobile.
- **Rodapé**: o indicador de tempo real é `sr-only` (não existe no Figma).
- **Recibo**: o link "Ver no Etherscan" é uma referência simulada (abre o explorador, mas a transação é fictícia).

## 15. Próximos passos

1. Mobile Lighthouse ≥ 90 (app shell estático/pré-renderização e menos JS inicial) — ver `docs/performance.md`.
2. Formulário do colecionador no mobile (reaproveitando o perfil) e paginação cursor-based no catálogo.
3. Persistência real de avatar (upload) e recuperação de senha, hoje fora do escopo.
