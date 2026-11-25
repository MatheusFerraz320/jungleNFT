import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/roboto-mono';
import App from './App';
import { markApiReady } from '@/shared/api/api-ready';
import { env } from '@/shared/config/env';
import './app/styles/globals.css';

function startMocks() {
  if (!env.mocksEnabled) {
    markApiReady();
    return;
  }

  // Não bloqueia o render nem disputa banda com o bundle crítico: o MSW é carregado quando o
  // navegador está ocioso e as chamadas de rede aguardam `apiReady` (ver http.ts e socket.ts).
  const load = () =>
    void import('@/mocks/browser')
      .then(({ startMocking }) => startMocking())
      .catch((error: unknown) => {
        console.error('Falha ao iniciar a camada de mocks.', error);
      })
      .finally(markApiReady);

  if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 1_000 });
  else setTimeout(load, 200);
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
