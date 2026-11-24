# JungleNFT

Base do **Desafio Frontend — Marketplace de NFTs**. Este repositório contém o scaffold inicial com a stack obrigatória, contratos tipados, MSW, Socket.IO, Playwright, Lighthouse e documentação arquitetural.

> Estado atual: estrutura pronta e validada. As telas de catálogo, carrinho, checkout e conta ainda serão implementadas sobre esta base.

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

O bootstrap inicia o MSW antes do primeiro render. Com `VITE_MOCKS=enabled`, o build de demonstração também funciona sem backend.

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

O MSW intercepta REST e WebSocket na camada de rede. O estado simulado vive em `src/mocks/db/store.ts` e é semeado com 24 NFTs, 2 usuários e 2 carteiras.

Seleção rápida pelo console do navegador:

```js
localStorage.setItem('junglenft:scenario', 'slow');
location.reload();
```

Reset completo:

```js
await fetch('/api/mocks/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'default' }),
});
location.reload();
```

Cenários já exercitados pelo scaffold:

- `default`: sucesso, sem latência.
- `slow`: skeleton durante a resposta lenta.
- `offline`: erro de rede em `/api/health`.

Os demais cenários exigidos pelo desafio estão catalogados em [`docs/scenarios.md`](docs/scenarios.md) e serão conectados aos handlers conforme cada feature for implementada.

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

Os fixtures públicos são:

- `ana@jungle.test`
- `bruno@jungle.test`

Autenticação ainda não foi implementada. Nenhuma senha deve ser armazenada em claro; a estratégia de sessão está descrita em [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Testes

### Playwright

O config sobe o build de produção, inicia o preview e executa os mesmos specs em:

- desktop Chromium: 1440 × 900;
- mobile Chromium: 390 × 844.

```bash
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
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

Os relatórios HTML/JSON e a mediana ficam em `lighthouse/reports/`. Neste scaffold, a auditoria cobre a página inicial nos perfis desktop e mobile. A rota de detalhe será adicionada à matriz assim que existir.

Resultado inicial (3 execuções por perfil):

| Perfil  | Performance | Accessibility | Best Practices | SEO |     LCP |   CLS |   TBT |
| ------- | ----------: | ------------: | -------------: | --: | ------: | ----: | ----: |
| Desktop |          93 |           100 |            100 |  91 | 2600 ms | 0,001 | 21 ms |
| Mobile  |          93 |           100 |            100 |  91 | 2598 ms | 0,000 | 19 ms |

Resumo completo em [`lighthouse/reports/summary.json`](lighthouse/reports/summary.json).

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

O `vercel.json` configura Vite, build com pnpm e rewrite SPA para acesso direto/refresh de rotas.

```bash
pnpm build
vercel --prod
```

Mantenha `VITE_MOCKS=enabled` na versão pública de demonstração.

## Limitações atuais

- O Figma foi extraído e os tokens/assets principais já estão aplicados.
- A tela inicial é um placeholder que prova a integração REST + Socket.IO.
- Handlers de autenticação, catálogo, carrinho, cotação e pedidos ainda serão implementados.
- O binding Socket.IO do MSW não oferece rooms/broadcast completos; a estratégia atual mantém uma conexão por cliente e emite eventos diretamente para cada conexão mockada.
