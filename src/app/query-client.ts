import { QueryClient } from '@tanstack/react-query';
import { normalizeApiError } from '@/shared/api/errors';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          const apiError = normalizeApiError(error);
          const retryableStatus =
            apiError.status === 0 || apiError.status >= 500 || apiError.status === 429;
          return retryableStatus && failureCount < 2;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export const queryClient = createQueryClient();
