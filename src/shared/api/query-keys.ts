export const queryKeys = {
  all: ['junglenft'] as const,
  health: ['junglenft', 'health'] as const,
  auth: {
    session: ['junglenft', 'auth', 'session'] as const,
  },
  nfts: {
    all: ['junglenft', 'nfts'] as const,
    list: (queryKey: string) => ['junglenft', 'nfts', 'list', queryKey] as const,
    detail: (id: string) => ['junglenft', 'nfts', 'detail', id] as const,
  },
  favorites: (userId: string) => ['junglenft', 'favorites', userId] as const,
  cart: (scope: string) => ['junglenft', 'cart', scope] as const,
  quote: (cartId: string) => ['junglenft', 'quote', cartId] as const,
  orders: (userId: string) => ['junglenft', 'orders', userId] as const,
  order: (id: string) => ['junglenft', 'orders', 'detail', id] as const,
  profile: (userId: string) => ['junglenft', 'profile', userId] as const,
  wallets: (userId: string) => ['junglenft', 'wallets', userId] as const,
} as const;
