# Performance e Lighthouse

Auditoria de **Início** (`/`) e **Detalhe do NFT** (`/nft/nft-001`) em perfis **mobile** e **desktop**, 3 medições por página/perfil, mediana de cada categoria.

```bash
pnpm build && pnpm lighthouse   # sobe o preview (se necessário) e grava lighthouse/reports/
```

## Resultados (mediana de 3 execuções)

| Página | Perfil  | Performance | Accessibility | Best Practices | SEO | LCP     | CLS   | TBT   |
| ------ | ------- | ----------- | ------------- | -------------- | --- | ------- | ----- | ----- |
| home   | desktop | 99          | 100           | 100            | 100 | 741 ms  | 0.000 | 0 ms  |
| detail | desktop | 99          | 100           | 100            | 100 | 811 ms  | 0.000 | 0 ms  |
| home   | mobile  | 80          | 100           | 100            | 100 | 3955 ms | 0.000 | 75 ms |
| detail | mobile  | 81          | 100           | 100            | 100 | 3977 ms | 0.000 | 62 ms |

Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.

**Atendidas:** desktop (todas as categorias) e Accessibility/Best Practices/SEO também no mobile. **Abaixo da meta:** Performance no perfil **mobile** (80–81).

Notas de Performance por execução:

| Página / perfil  | 3 execuções |
| ---------------- | ----------- |
| home / desktop   | 99, 99, 99  |
| detail / desktop | 99, 99, 99  |
| home / mobile    | 80, 80, 81  |
| detail / mobile  | 81, 80, 81  |

## Ambiente e condições

- Lighthouse 13.6.0; Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36
- Node v24.20.0 · Linux 6.18.58.1-microsoft-standard-WSL2 · AMD Ryzen 5 5600 6-Core Processor (12 núcleos) · 9.7 GB RAM
- Build de produção (`vite build`) servido por `vite preview`, MSW habilitado no cenário `default` (sem latência artificial)
- Perfil **mobile**: preset padrão do Lighthouse (Moto G Power, 4G lento simulado — RTT 150 ms, 1,6 Mbps — e CPU 4× mais lenta). Perfil **desktop**: config oficial `desktop-config` (sem throttling)
- Cache frio em cada medição; imagens, fonte self-hosted e todas as funcionalidades carregadas, sem simplificações para a auditoria
- Relatórios completos (HTML/JSON) em `lighthouse/reports/` e resumo em `summary.json`

## Por que o mobile fica abaixo de 90

TBT (≈50–125 ms) e CLS (0) são excelentes; a nota é limitada por **FCP ≈ 3,2 s e LCP ≈ 4,0 s** sob 4G lento + CPU 4×:

- O app é uma SPA com renderização no cliente: nada é pintado antes de baixar e executar ~245 KB gzip de JavaScript (React 19, TanStack Router/Query, Axios, Zod, Radix). Sob throttling, só o download leva ~1,4 s, mais ~0,6 s de _script evaluation_ (4×).
- **Diagnóstico:** um build com os mocks desligados tem a mesma nota (80; FCP 2,6 s, LCP 3,3 s). O custo-base é o bundle da própria aplicação; a camada MSW (~110 KB gzip, exigida na versão de demonstração) soma ~0,9 s ao LCP, mas não altera a nota.
- O LCP é a imagem do hero (22 KB, WebP): já é descoberta no HTML e baixada em paralelo; o atraso restante é o primeiro render do React.

## Otimizações aplicadas

- Renderização imediata: o Service Worker do MSW **não bloqueia mais o primeiro render**; chamadas HTTP/Socket.IO aguardam `apiReady`, e o MSW é carregado em tempo ocioso (não disputa banda com o bundle crítico).
- Preload do hero (LCP) no HTML inicial com `fetchpriority="high"`; WebP no catálogo; fonte Roboto Mono self-hosted.
- Code splitting por rota (TanStack Router `autoCodeSplitting`) e _vendor chunks_ separados.
- **CLS 0**: skeletons com as dimensões do conteúdo por breakpoint (o detalhe chegou a 0,117 quando o skeleton era mais baixo que o conteúdo).
- `robots.txt` válido (SEO 92 → 100).
- Corrigido o runner: `settings.preset` é ignorado pela API programática, então os dois perfis mediam mobile; agora o desktop usa a config oficial.

## O que foi tentado depois (sem mover a nota)

Medido com a mesma metodologia (mobile, Início):

| Tentativa                                                                                                                                              | Efeito                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Podar _barrels_ (`"sideEffects"`) — o `RootLayout` importava `@/features/auth` e arrastava `AuthScreen`/react-hook-form/HomePage para o bundle inicial | `index.js` 114 → 89 KB gzip; nota 80 → 80–82                                                                                                                                    |
| `ethLabel` fora do `decimal.js` (telas que só exibem valores não carregam a lib)                                                                       | menos JS na Início                                                                                                                                                              |
| `modulepreload` do chunk do MSW no HTML (baixa em paralelo ao bundle)                                                                                  | −1 salto na cadeia; LCP ~4,2 → ~3,9 s                                                                                                                                           |
| _App shell_ estático (HTML/CSS) da Início                                                                                                              | **sem efeito medido** — o FCP do Lighthouse é o primeiro paint real e, localmente, o React renderiza antes dele; descartado para não adicionar código sem benefício verificável |

A cadeia crítica restante é `HTML → bundle → (MSW) → API → imagens do catálogo`; o LCP é a imagem do 1º card, que só existe após a resposta simulada. Sob 4G lento (≈0,56 s por salto) isso limita o mobile a ~80 sem pré-renderização.

## Caminhos para chegar a ≥ 90 no mobile (fora desta entrega)

- Pré-renderização/SSR (ou _app shell_ estático) da Início para pintar antes do JS.
- Reduzir o JS inicial: carregar Zod/Radix sob demanda e trocar bibliotecas pesadas por equivalentes menores.
- Servir com Brotli e HTTP/2 (o `vite preview` usa gzip); inlining do CSS crítico (≈150 ms de bloqueio).
