import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getGuestId, setToken } from '@/shared/api/client-identity';
import { queryKeys } from '@/shared/api/query-keys';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/shared/contracts';
import { login, logout, register } from '../api/auth-api';

/**
 * Troca de usuário: limpa todo o cache (dados privados da sessão anterior) antes de gravar a
 * nova sessão, garantindo isolamento entre usuários.
 */
function useStartSession() {
  const queryClient = useQueryClient();

  return (auth: AuthResponse) => {
    queryClient.clear();
    setToken(auth.token);
    queryClient.setQueryData(queryKeys.auth.session, {
      user: auth.user,
      expiresAt: auth.expiresAt,
    });
  };
}

export function useLogin() {
  const start = useStartSession();
  return useMutation({
    mutationFn: (body: Omit<LoginRequest, 'guestId'>) => login({ ...body, guestId: getGuestId() }),
    onSuccess: start,
  });
}

export function useRegister() {
  const start = useStartSession();
  return useMutation({
    mutationFn: (body: Omit<RegisterRequest, 'guestId'>) =>
      register({ ...body, guestId: getGuestId() }),
    onSuccess: start,
  });
}

/** Encerra a sessão local mesmo que a API falhe, e descarta qualquer dado privado em cache. */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      setToken(null);
      queryClient.clear();
    },
  });
}
