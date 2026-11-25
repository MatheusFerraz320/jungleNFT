# Arquitetura

## 1. Estado atual

O projeto é um scaffold executável. Ele já comprova, de ponta a ponta:

1. React + TypeScript + Vite;
2. TanStack Router com geração de rotas;
3. TanStack Query consumindo Axios;
4. MSW respondendo REST;
5. `socket.io-client` conectando via WebSocket interceptado pelo MSW;
6. Playwright em desktop e mobile;
7. Lighthouse com mediana de três execuções por perfil.

As features de negócio serão adicionadas sem alterar essas fronteiras.

## 2. Camadas e responsabilidades

```text
routes
  └─ features
       └─ shared
mocks
  └─ shared/contracts
```

- **routes**: declaração de rota, search params, loaders e guards. Não contém regra de negócio.
- **features**: API, hooks, schemas e componentes de um domínio. Cada feature expõe apenas o necessário por `index.ts`.
- **shared**: contratos Zod, cliente Axios, erros, query keys, UI base, libs e realtime.
- **mocks**: fixtures, store, handlers REST, binding Socket.IO e cenários. Não importa features, rotas ou composição da aplicação.

O ESLint usa `no-restricted-imports` para enforcing dessas fronteiras.

## 3. Contratos e transporte

`src/shared/contracts` é a fonte única de tipos e validação:

- schemas Zod definem requests, responses e eventos;
- tipos são inferidos com `z.infer`;
- Axios recebe tipos genéricos e valida a resposta runtime;
- MSW reutiliza os mesmos schemas nas fixtures e respostas;
- formulários usarão os mesmos schemas com `react-hook-form`.

Valores ETH são strings decimais canônicas. Quantidades são inteiros positivos. `decimal.js` faz cálculos locais com precisão 40; entretanto, **o total final sempre vem da cotação da API**.

## 4. HTTP e erros

`src/shared/api/http.ts` cria uma instância Axios com:

- `baseURL` validado por Zod;
- `withCredentials: true`;
- timeout de 15 s;
- `Content-Type` automático para JSON;
- normalização de erros em `ApiError`.

`ApiError` contém `status`, `code`, `message`, `fieldErrors` e `requestId`. Respostas 401 disparam `junglenft:unauthorized` para a camada de sessão.

## 5. TanStack Query

Política inicial em `src/app/query-client.ts`:

- `staleTime`: 30 s;
- `gcTime`: 5 min;
- `refetchOnWindowFocus`: false;
- `refetchOnReconnect`: true;
- GET: até 2 retries para rede, 5xx e 429;
- mutations: sem retry automático.

As chaves ficam centralizadas em `query-keys.ts`. Recursos privados incluem `userId` no prefixo. Logout e troca de usuário deverão remover todas as queries privadas antes de autenticar outro usuário.

## 6. Sessão e isolamento

Embora os handlers ainda não existam, a política será:

- sessão simulada via cookie HTTP-only conceitual; o cliente guarda apenas metadados públicos;
- query `auth/session` recupera a sessão após refresh;
- guards do TanStack Router redirecionam para `/login` preservando `redirect`;
- expiração durante checkout preserva cotação e itens do visitante;
- logout limpa cache privado, listeners e conexão Socket.IO;
- eventos carregam `sessionId`; o cliente ignora eventos de outra sessão.

Senhas nunca serão persistidas em claro. Nos mocks, será usado hash artificial não reversível.

## 7. Carrinho

Estado previsto:

- visitante possui carrinho local identificado por `guestId`;
- ao autenticar, o backend simulado faz merge dos itens do visitante;
- o carrinho autenticado é persistido no store MSW/localStorage;
- quantidades respeitam `availableEditions`;
- subtotal, desconto, taxa e total vêm da cotação;
- eventos `nft.updated` invalidam a cotação quando preço/disponibilidade muda;
- falhas preservam os itens; confirmação remove apenas as quantidades compradas.

## 8. REST ↔ Socket.IO

### Transporte

- cliente: `socket.io-client` v4;
- transporte forçado: `websocket`;
- servidor simulado: `ws.link` do MSW + `@mswjs/socket.io-binding`;
- path Socket.IO: `/socket.io/`.

### Detalhes importantes

1. O MSW remove o prefixo `/socket.io/` antes de fazer match. Por isso, o handler usa a raiz (`/\/$/`) e não `/socket.io/`.
2. O Engine.IO captura o construtor global de WebSocket ao carregar o módulo. `socket.io-client` é importado dinamicamente **depois** de `worker.start()` para capturar o interceptor do MSW.
3. No binding, `io.client.emit(...)` envia eventos do servidor simulado para o cliente conectado. `io.server.emit(...)` tentaria enviar para um servidor real inexistente.
4. O binding não implementa rooms, namespaces ou broadcast completos. A solução manterá um registro de conexões por sessão para emitir eventos aos clientes corretos.

### Reconciliação

- eventos têm `eventId`, `resourceType`, `resourceId`, `version`, `sessionId` e `occurredAt`;
- versões menores ou iguais são descartadas;
- duplicatas são ignoradas;
- após `connect`, recursos ativos são reconsultados via REST;
- pedidos confirmados/recusados são terminais;
- listeners são removidos no cleanup do provider.

## 9. Mocking e persistência

`MockDatabase` mantém mapas em memória para NFTs, usuários e carteiras. O reset restaura fixtures clonadas. `persistence.ts` oferece leitura/escrita validada por Zod no localStorage.

O endpoint de controle `POST /api/mocks/reset`:

- valida o cenário;
- limpa o estado persistido;
- restaura o seed;
- define o cenário ativo.

Cenários estão centralizados em `src/mocks/scenarios/presets.ts`. Latência variável e respostas fora de ordem serão usadas apenas nos handlers correspondentes, com gerador pseudoaleatório semeado quando os testes de tempo forem implementados.

## 10. Acessibilidade

- shadcn/ui adaptado via CSS variables;
- skeletons com shimmer e `prefers-reduced-motion`;
- labels, mensagens de erro e `aria-live` nos componentes de feedback;
- foco visível global;
- diálogos/drawers do Radix com gerenciamento de foco;
- Playwright inclui axe na página inicial.

## 11. Performance

O bootstrap de mocks é importado dinamicamente e gera um chunk separado. React/TanStack, UI e dados também são divididos com manual chunks. Imagens e fontes serão locais; dimensões explícitas evitam CLS. Lighthouse executa 3 vezes por página/perfil e registra mediana, LCP, CLS e TBT.

## 12. Limitações e decisões

- Tokens extraídos do Figma e centralizados em `design/tokens.json` e `globals.css`.
- Roboto Mono Variable é servida localmente via Fontsource.
- Os nove artworks únicos do catálogo foram exportados para `public/assets/nfts/`.
- Rotas: `/`, `/nft/$nftId`, `/carrinho`, `/pagamento`, `/pedido/$orderId`, `/login`, `/cadastro`, `/perfil`, `/carteiras`.
- Playwright fixado em 1.56.1 para alinhar o container oficial usado no CI.
- Lighthouse audita apenas a home neste scaffold.
- O binding Socket.IO é experimental; a integração está coberta por E2E real.

### Fidelidade visual e desvios do Figma

Metodologia: cada frame (`design/frames/*.png`) foi comparado lado a lado com a captura do app
(Chromium, 1440 e 414 px). Posições, tamanhos e cores foram medidos por varredura de pixels.
`text-rendering: geometricPrecision` replica o avanço fracionário de glifos do Figma.

Desvios deliberados (todos por requisito funcional do enunciado):

- **Filtros**: o Figma só mostra Coleções, Faixa de preço e Rede. Foram acrescentados Raridade e
  "Somente disponíveis" (filtros combináveis exigidos), no mesmo estilo visual.
- **Categorias/redes**: contrato e fixtures passaram para as 9 coleções e 3 redes do Figma.
- **Ordenação mobile**: o frame mobile não tem seletor de ordenação; ele fica dentro do painel de
  filtros (botão laranja da barra de busca).
- **Preço**: exibido exatamente como a string decimal da API (`1.19 ETH`), sem arredondar.
- **Preço anterior**: sem tachado (como no Figma); o rótulo "Preço anterior" é lido por leitores
  de tela, para o estado não depender só de cor.
- **Galeria mobile**: o frame não mostra miniaturas; elas existem só a partir de 640 px.
- **Pagamento mobile**: o frame não contém o formulário do colecionador; ele aparece apenas no
  desktop nesta etapa (a coleta mobile entra com a integração do perfil).
- **Login/Cadastro**: modal sobre a Início no desktop (como no Figma) e página cheia no mobile.
- **Rodapé**: o indicador de tempo real ficou `sr-only` (não existe no Figma).
- **Itens fora do escopo** (Atividade, Ofertas, Suporte…) respondem com aviso, sem simular sucesso.

Estado desta etapa: telas e interações **visuais** com lógica local simples
(`useCart`, `useSession`, pedidos locais). Elas ficam atrás de hooks para serem substituídas por
TanStack Query + contratos REST/MSW sem tocar na interface.

## 13. Próximos passos

1. Exportar tokens/assets do Figma.
2. Implementar catálogo e detalhe com search params na URL.
3. Implementar autenticação, perfil e carteiras.
4. Implementar carrinho, cotação e checkout idempotente.
5. Conectar eventos `nft.updated` e `order.updated`.
6. Ampliar E2E, baselines e auditoria de detalhe.
