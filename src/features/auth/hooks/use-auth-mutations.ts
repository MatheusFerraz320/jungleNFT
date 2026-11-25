import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getGuestId, setToken } from '@/shared/api/client-identity';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/shared/contracts';
import { replaceSession } from '../session-cache';
import { login, logout, register } from '../api/auth-api';

/**
 * Troca de usuário: grava a nova sessão e descarta os dados privados da anterior (cache
 * isolado por usuário).
 */
function useStartSession() {
  const queryClient = useQueryClient();

  return (auth: AuthResponse) => {
    setToken(auth.token);
    replaceSession(queryClient, { user: auth.user, expiresAt: auth.expiresAt });
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
      replaceSession(queryClient, null);
    },
  });
}
