import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { env } from '@/shared/config/env';
import { getGuestId, getToken } from './client-identity';
import { normalizeApiError } from './errors';

export const http: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  config.headers.set('X-Guest-Id', getGuestId());

  if (config.data && !(config.data instanceof FormData)) {
    config.headers.set('Content-Type', 'application/json');
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const normalized = normalizeApiError(error);

    // Credenciais erradas (INVALID_CREDENTIALS) não são expiração de sessão.
    const sessionLost = normalized.code === 'SESSION_EXPIRED' || normalized.code === 'UNAUTHORIZED';

    if (normalized.status === 401 && sessionLost && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('junglenft:unauthorized', { detail: normalized }));
    }

    return Promise.reject(normalized);
  },
);
