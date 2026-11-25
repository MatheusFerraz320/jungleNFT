# JungleNFT

**Desafio Frontend — Marketplace de NFTs** (Kurio): descoberta, compra e conta do colecionador em desktop e mobile, com API, autenticação, carteiras e pagamentos **simulados** (MSW) e eventos em tempo real (Socket.IO). Arquitetura em [`ARCHITECTURE.md`](ARCHITECTURE.md), contratos em [`docs/contracts.md`](docs/contracts.md), cenários em [`docs/scenarios.md`](docs/scenarios.md) e performance em [`docs/performance.md`](docs/performance.md).

## Stack

| Responsabilidade | Tecnologia                                    |
| ---------------- | --------------------------------------------- |
| UI               | React 19 + TypeScript 5.9                     |
| Build            | Vite 7                                        |
| Roteamento       | TanStack Router (file-based)                  |
| Estado remoto    | TanStack Query v5                             |
| HTTP             | Axios                                         |
| Tempo real       | Socket.IO client + `@mswjs/socket.io-binding` |
| Estilo           | Tailwind CSS v4                               |
| Componentes      | shadcn/ui (New York)                          |
| Tipografia       | Roboto Mono Variable, self-hosted             |
| Contratos        | Zod                                           |
| Mocking          | MSW 2                                         |
| Testes           | Vitest + Testing Library + Playwright         |
| Acessibilidade   | `@axe-core/playwright`                        |
| Performance      | Lighthouse                                    |

## Requisitos

- Node.js **24+**
- pnpm **12.18+**
- Chromium com dependências do sistema para Playwright/Lighthouse

O arquivo `.nvmrc` fixa o Node 24. O `packageManager` fixa o pnpm 12.18.0.

## Setup

```bash
corepack enable
corepack prepare pnpm@12.18.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

A aplicação abre em `http://127.0.0.1:5173`.

O app renderiza sem esperar o MSW; as chamadas Axios e o socket aguardam `apiReady` (Service Worker ativo). Com `VITE_MOCKS=enabled`, o build de demonstração também funciona sem backend.

## Variáveis de ambiente

| Variável                | Padrão                   | Descrição                                     |
| ----------------------- | ------------------------ | --------------------------------------------- |
| `VITE_API_BASE_URL`     | `/api`                   | Base das chamadas Axios                       |
| `VITE_SOCKET_URL`       | vazio                    | Origem do Socket.IO; vazio usa a origem atual |
| `VITE_MOCKS`            | `enabled`                | `enabled` ou `disabled`                       |
| `VITE_DEFAULT_SCENARIO` | `default`                | Cenário inicial dos mocks                     |
| `FIGMA_ACCESS_TOKEN`    | vazio                    | Token read-only usado apenas pelos scripts    |
| `FIGMA_FILE_KEY`        | `Ff0SksUi7UFtPWUO8kyNtw` | Arquivo do desafio                            |

Nunca versione `.env.local`.

## Comandos

| Comando                | Descrição                                      |
| ---------------------- | ---------------------------------------------- |
| `pnpm dev`             | Desenvolvimento com HMR e mocks                |
| `pnpm build`           | Gera rotas, verifica tipos e cria o build      |
| `pnpm preview`         | Serve o build em `http://127.0.0.1:4173`       |
| `pnpm router:generate` | Gera `src/routeTree.gen.ts`                    |
| `pnpm typecheck`       | Verificação TypeScript                         |
| `pnpm lint`            | ESLint                                         |
| `pnpm lint:fix`        | ESLint com correções                           |
| `pnpm format`          | Prettier                                       |
| `pnpm format:check`    | Conferência de formatação                      |
| `pnpm test`            | Testes unitários Vitest                        |
| `pnpm test:watch`      | Vitest em modo observador                      |
| `pnpm test:e2e`        | Playwright em desktop e mobile                 |
| `pnpm test:e2e:ui`     | Playwright UI mode                             |
| `pnpm test:e2e:update` | Atualiza baselines visuais                     |
| `pnpm test:e2e:report` | Abre o relatório HTML                          |
| `pnpm msw:init`        | Recria o service worker do MSW                 |
| `pnpm figma:tokens`    | Extrai cores, tipografia, raios e espaçamentos |
| `pnpm figma:frames`    | Exporta os frames desktop/mobile               |
| `pnpm figma:artworks`  | Exporta os NFTs do catálogo                    |
| `pnpm lighthouse`      | Executa 3 auditorias por perfil e gera mediana |

## Mocks e cenários

O MSW intercepta REST e WebSocket na camada de rede (sem respostas fictícias em componentes, hooks ou Axios). O estado
simulado (usuários, carteiras, favoritos, carrinhos, cotações, pedidos e catálogo) é consistente entre REST e eventos e
**persiste em `localStorage`**, sobrevivendo a refresh. A camada é ativada por `VITE_MOCKS=enabled` e está presente no build
de demonstração.

### Selecionar um cenário

Ordem de precedência: `localStorage['junglenft:scenario']` → `VITE_DEFAULT_SCENARIO` → `default`.

```js
// Console do navegador
localStorage.setItem('junglenft:scenario', 'price-changed');
location.reload();
```

```js
// Sem recarregar (mantém os dados)
await fetch('/api/mocks/scenario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'payment-rejected' }),
});
```

### Resetar para um estado conhecido

```js
await fetch('/api/mocks/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'default' }),
});
location.reload();
```

### Reproduzir os fluxos de falha

| Fluxo                          | Como reproduzir                                                                           | Resultado esperado                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Rede lenta / skeletons         | cenário `slow`                                                                            | skeletons com shimmer e sem deslocamento de layout |
| Respostas fora de ordem        | cenário `out-of-order` e trocar a ordenação rápido                                        | a lista final corresponde à última consulta        |
| Sem conexão                    | cenário `offline`, depois `default` e "Tentar novamente"                                  | erro tratado e recuperação                         |
| Erro 5xx                       | `POST /api/mocks/faults {method:"GET",path:"/nfts",status:503,times:3}` e mudar de página | erro + retry                                       |
| Sessão expirada                | `POST /api/mocks/expire-sessions` e navegar a uma rota privada                            | login com retorno ao destino                       |
| Acesso negado / não autorizado | cenário `unauthorized` / `session-expired`                                                | 403 / 401 tratados                                 |
| Conflito de cadastro           | cenário `registration-conflict` (ou e-mail já usado)                                      | erro no campo e-mail                               |
| Cupom inválido/expirado        | código `NADA` / `EXPIRED10` (válido: `JUNGLE10`)                                          | erro no campo do cupom                             |
| Preço alterado no checkout     | cenário `price-changed` e enviar o pedido                                                 | aviso + "Confirmar novos valores"                  |
| Edição esgotada                | cenário `sold-out` e enviar o pedido                                                      | pedido bloqueado, carrinho preservado              |
| Timeout com recuperação        | cenário `order-timeout` e enviar o pedido                                                 | o mesmo pedido é recuperado (1 só)                 |
| Pagamento recusado             | cenário `payment-rejected`                                                                | "Pagamento recusado"; itens mantidos               |
| Falha de favorito              | `faults {method:"PUT",path:"/favorites"}` e favoritar                                     | rollback otimista + aviso                          |
| Preço/disponibilidade ao vivo  | `POST /api/mocks/nfts/nft-001 {"priceEth":"2.00"}`                                        | aviso e resumo atualizados via socket              |
| Queda do socket                | `POST /api/mocks/socket/disconnect` com pedido pendente                                   | reconecta e recupera sem nova compra               |

Catálogo completo de cenários e controles em [`docs/scenarios.md`](docs/scenarios.md). Os controles são `POST /api/mocks/...`
(`reset`, `scenario`, `faults`, `expire-sessions`, `nfts/:id`, `socket/disconnect`, `socket/emit`, `socket/stale/:nftId`).

## Tokens e assets do Figma

Os tokens foram extraídos diretamente do arquivo do desafio e aplicados em `src/app/styles/globals.css`.

- Relatório bruto: `design/figma-report.json`
- Resumo legível: `design/figma-tokens.md`
- Tokens curados: `design/tokens.json`
- Frames de referência: `design/frames/`
- NFTs locais: `public/assets/nfts/`
- Fonte: `@fontsource-variable/roboto-mono`

Para atualizar depois de alterações no Figma:

```bash
pnpm figma:tokens
pnpm figma:frames
pnpm figma:artworks
```

O token fica somente no `.env.local` e não entra no bundle do Vite.

## Credenciais fictícias

| Usuário                     | E-mail              | Senha       |
| --------------------------- | ------------------- | ----------- |
| Ana Souza (com 2 carteiras) | `ana@jungle.test`   | `Senha@123` |
| Bruno Lima (sem carteiras)  | `bruno@jungle.test` | `Senha@123` |

Cupons: `JUNGLE10` (10%), `EXPIRED10` (expirado). Os dados são fictícios; senhas ficam apenas como **hash salgado** no mock
(política de sessão em [`ARCHITECTURE.md`](ARCHITECTURE.md#6-sessão-e-isolamento)).

## Testes

### Playwright

O config sobe o build de produção, inicia o preview e executa **140 testes E2E** (137 executados; 3 são específicos de um viewport e se pulam no outro) (fluxos, falhas, tempo real, acessibilidade e
regressão visual) em:

- desktop Chromium: 1440 × 900;
- mobile Chromium: 390 × 844.

```bash
pnpm exec playwright install --with-deps chromium
pnpm test:e2e            # relatório HTML em playwright-report/, traces das falhas em test-results/
pnpm test:e2e:report     # abre o relatório
pnpm test:e2e:update     # atualiza as baselines visuais (e2e/visual/*-snapshots)
```

Se o ambiente local não permitir instalar dependências do sistema, use Docker:

```bash
docker run --rm \
  -v "$PWD":/work \
  -v /work/node_modules \
  -w /work \
  node:24-bookworm \
  bash -lc "npm install -g pnpm@12.18.0 && pnpm install --frozen-lockfile && pnpm exec playwright install --with-deps chromium && pnpm test:e2e"
```

O volume anônimo evita que os binários do container sobrescrevam o `node_modules` do host.

### Lighthouse

```bash
pnpm build
pnpm lighthouse
```

Audita **Início** e **Detalhe** em desktop e mobile (3 execuções cada, mediana), usando o build de produção e o cenário padrão
dos mocks. Relatórios HTML/JSON, versões, ambiente e condições em `lighthouse/reports/`; análise em
[`docs/performance.md`](docs/performance.md).

| Perfil                     | Performance | Accessibility | Best Practices |       SEO |          LCP |   CLS |        TBT |
| -------------------------- | ----------: | ------------: | -------------: | --------: | -----------: | ----: | ---------: |
| Desktop (Início / Detalhe) |     99 / 99 |     100 / 100 |      100 / 100 | 100 / 100 | 741 / 811 ms | 0 / 0 |   0 / 0 ms |
| Mobile (Início / Detalhe)  |     80 / 81 |     100 / 100 |      100 / 100 | 100 / 100 |  4,0 / 4,0 s | 0 / 0 | 75 / 62 ms |

O mobile fica abaixo de 90 em Performance (SPA com render no cliente sob 4G lento + CPU 4×); causas e caminhos na análise.

## Estrutura

```text
src/
  app/          composição, providers, router e query client
  routes/       rotas finas do TanStack Router
  features/     domínios (catalog, nft, cart, checkout, orders, auth, profile, wallets)
  shared/       contratos, HTTP, UI, libs e realtime
  mocks/        fixtures, store, handlers, cenários e Socket.IO
e2e/            specs, fixtures e baselines
lighthouse/     runner e relatórios
docs/           contratos, cenários e ADRs
```

Regra de dependência: `routes → features → shared`; `mocks → shared/contracts`. O ESLint bloqueia imports que violem essas fronteiras.

## Convenções

- Branches em inglês: `feat/...`, `fix/...`, `chore/...`, `docs/...`, `test/...`.
- Commits convencionais em inglês: `feat: add catalog filters`, `fix: preserve cart after login`.
- Documentação e textos de interface em português do Brasil.

## Deploy

O `vercel.json` configura Vite, build com pnpm e **rewrite SPA** (acesso direto e refresh de qualquer rota). Mantenha
`VITE_MOCKS=enabled`: a versão pública usa os mocks e o Socket.IO simulado.

```bash
pnpm install --frozen-lockfile
pnpm build           # typecheck + vite build
vercel --prod        # ou conecte o repositório na Vercel (framework: Vite, output: dist)
```

**URL pública:** https://junglenft-psi.vercel.app (build com `VITE_MOCKS=enabled`; mocks, Socket.IO simulado e rotas diretas/refresh verificados).

## Limitações conhecidas

- Mobile Lighthouse Performance 80–82 (< 90): ver [`docs/performance.md`](docs/performance.md).
- O binding Socket.IO do MSW é experimental (apenas `websocket`, sem rooms); o direcionamento por usuário é feito por um hub próprio.
- Atividade, Ofertas, Arquivos baixados e Suporte estão fora do escopo (respondem com aviso, sem simular sucesso).
- As baselines visuais foram geradas com Playwright 1.56.1 em Linux; outro SO/fontes pode exigir regenerá-las.
