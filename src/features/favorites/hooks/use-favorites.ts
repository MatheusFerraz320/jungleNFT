import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCurrentUser } from '@/features/auth';
import { getErrorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/api/query-keys';
import type { FavoritesResponse } from '@/shared/contracts';
import { getFavorites, setFavorite } from '../api/favorites-api';

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.favorites(userId),
    queryFn: ({ signal }) => getFavorites(signal),
  });
}

export function useFavorites() {
  const user = useCurrentUser();
  const query = useQuery({
    ...favoritesQueryOptions(user?.id ?? 'anonymous'),
    enabled: Boolean(user),
  });

  return { user, ids: new Set(query.data?.nftIds ?? []), query };
}

/**
 * Alternância com atualização otimista: a UI muda na hora; se a API falhar, o estado anterior é
 * restaurado (rollback) e o usuário é avisado. Ao final, a lista é re-sincronizada com a API.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const key = queryKeys.favorites(user?.id ?? 'anonymous');

  return useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      setFavorite(nftId, favorite),
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FavoritesResponse>(key);

      queryClient.setQueryData<FavoritesResponse>(key, (current) => {
        const ids = new Set(current?.nftIds ?? []);
        if (favorite) ids.add(nftId);
        else ids.delete(nftId);
        return { nftIds: [...ids], version: current?.version ?? 0 };
      });

      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous);
      toast.error(`Não foi possível atualizar os favoritos. ${getErrorMessage(error)}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
