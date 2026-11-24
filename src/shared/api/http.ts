import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { env } from '@/shared/config/env';
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
  if (config.data && !(config.data instanceof FormData)) {
    config.headers.set('Content-Type', 'application/json');
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const normalized = normalizeApiError(error);

    if (normalized.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('junglenft:unauthorized', { detail: normalized }));
    }

    return Promise.reject(normalized);
  },
);
