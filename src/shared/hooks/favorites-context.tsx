import { createContext, useContext } from 'react';

/**
 * Ponte entre componentes compartilhados (cards, botões) e a feature de favoritos, que fornece
 * a implementação no nível da aplicação.
 */
export interface FavoriteControls {
  isFavorite: (nftId: string) => boolean;
  toggle: (nftId: string) => void;
}

export const FavoritesContext = createContext<FavoriteControls>({
  isFavorite: () => false,
  toggle: () => undefined,
});

export function useFavoriteControls() {
  return useContext(FavoritesContext);
}
