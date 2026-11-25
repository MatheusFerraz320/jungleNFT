import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/roboto-mono';
import App from './App';
import { markApiReady } from '@/shared/api/api-ready';
import './app/styles/globals.css';

/**
 * Camada de mocks: o chunk dinâmico é pré-carregado pelo HTML (ver `preloadMocksChunk` no
 * vite.config) e importado aqui sem bloquear o render; HTTP e Socket.IO aguardam `apiReady`.
 * Com `VITE_MOCKS=disabled` o import é eliminado do build.
 */
function startMocks() {
  if (import.meta.env.VITE_MOCKS === 'disabled') {
    markApiReady();
    return;
  }

  void import('@/mocks/browser')
    .then(({ startMocking }) => startMocking())
    .catch((error: unknown) => {
      console.error('Falha ao iniciar a camada de mocks.', error);
    })
    .finally(markApiReady);
}

function bootstrap() {
  startMocks();

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Elemento #root não encontrado.');

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

try {
  bootstrap();
} catch (error) {
  console.error('Falha ao inicializar a aplicação.', error);
}
