import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import type { Plugin } from 'vite';

/**
 * Injeta `<link rel="modulepreload">` do chunk dinâmico da camada de mocks no HTML: o MSW baixa em paralelo ao bundle
 * da aplicação (um salto a menos na cadeia crítica) sem entrar no bundle inicial.
 */
function preloadMocksChunk(): Plugin {
  return {
    name: 'preload-mocks-chunk',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        const chunk = Object.values(context.bundle ?? {}).find(
          (item) =>
            item.type === 'chunk' &&
            item.isDynamicEntry &&
            Boolean(item.facadeModuleId?.includes('/src/mocks/browser')),
        );
        if (!chunk) return undefined;
        return [
          {
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: '', href: `/${chunk.fileName}` },
            injectTo: 'head',
          },
        ];
      },
    },
  };
}

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    preloadMocksChunk(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@tanstack/')) return 'tanstack';
          if (/\/node_modules\/(radix-ui|@radix-ui|lucide-react|sonner)\//.test(id))
            return 'ui-vendor';
          if (/\/node_modules\/(axios|zod|decimal\.js)\//.test(id)) return 'data-vendor';
          return undefined;
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: true,
    clearMocks: true,
  },
});
