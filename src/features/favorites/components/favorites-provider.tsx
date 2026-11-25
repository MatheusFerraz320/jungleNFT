import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useMemo, type ReactNode } from 'react';
import { toast } from 'sonner';
import { FavoritesContext, type FavoriteControls } from '@/shared/hooks/favorites-context';
import { useFavorites, useToggleFavorite } from '../hooks/use-favorites';

/** Favoritos exigem autenticação: visitantes são levados ao login e retomam depois. */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, ids } = useFavorites();
  const toggleMutation = useToggleFavorite();
  const navigate = useNavigate();
  const href = useRouterState({ select: (state) => state.location.href });

  const value = useMemo<FavoriteControls>(
    () => ({
      isFavorite: (nftId) => ids.has(nftId),
      toggle: (nftId) => {
        if (!user) {
          toast.info('Entre para salvar favoritos.');
          void navigate({ to: '/login', search: { redirect: href } });
          return;
        }
        toggleMutation.mutate({ nftId, favorite: !ids.has(nftId) });
      },
    }),
    [ids, user, toggleMutation, navigate, href],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
