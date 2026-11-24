import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { env } from '@/shared/config/env';
import './app/styles/globals.css';

async function bootstrap() {
  if (env.mocksEnabled) {
    const { startMocking } = await import('@/mocks/browser');
    await startMocking();
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Elemento #root não encontrado.');

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap().catch((error: unknown) => {
  console.error('Falha ao inicializar a aplicação.', error);
});
