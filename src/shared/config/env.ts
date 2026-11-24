import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_SOCKET_URL: z.string().default(''),
  VITE_MOCKS: z.enum(['enabled', 'disabled']).default('enabled'),
  VITE_DEFAULT_SCENARIO: z.string().min(1).default('default'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(`Variáveis de ambiente inválidas:\n${details}`);
}

export const env = {
  apiBaseUrl: parsed.data.VITE_API_BASE_URL.replace(/\/$/, ''),
  socketUrl: parsed.data.VITE_SOCKET_URL,
  mocksEnabled: parsed.data.VITE_MOCKS === 'enabled',
  defaultScenario: parsed.data.VITE_DEFAULT_SCENARIO,
} as const;

export function resolveSocketUrl() {
  if (env.socketUrl) return env.socketUrl.replace(/\/$/, '');

  if (typeof window === 'undefined') return '';
  return window.location.origin;
}
