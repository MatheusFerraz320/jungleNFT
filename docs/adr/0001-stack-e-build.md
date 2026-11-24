# ADR 0001 — Vite, React e TanStack

## Status

Aceito.

## Contexto

O desafio exige React, TypeScript, TanStack Router e TanStack Query, com deploy público e refresh de rotas.

## Decisão

Usar Vite 7, React 19, TypeScript 5.9, TanStack Router file-based e TanStack Query v5. O alias `@/*` aponta para `src/*`.

## Consequências

- Build rápido e deploy estático simples.
- Search params tipados com Zod.
- Geração de `routeTree.gen.ts` antes de typecheck/build.
- SPA exige rewrite no provedor de hospedagem.
