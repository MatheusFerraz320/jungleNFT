import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth';
import { queryKeys } from '@/shared/api/query-keys';
import type { CreateWalletRequest, UpdateWalletRequest } from '@/shared/contracts';
import { createWallet, updateWallet } from '../api/wallets-api';

/** Após qualquer mudança a lista é recarregada: a principal pode ter sido trocada pela API. */
function useRefreshWallets() {
  const queryClient = useQueryClient();
  const userId = useCurrentUser()?.id ?? 'anonymous';
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.wallets(userId) });
}

export function useCreateWallet() {
  const refresh = useRefreshWallets();
  return useMutation({
    mutationFn: (body: CreateWalletRequest) => createWallet(body),
    onSuccess: refresh,
  });
}

export function useUpdateWallet() {
  const refresh = useRefreshWallets();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateWalletRequest }) => updateWallet(id, body),
    onSuccess: refresh,
  });
}
