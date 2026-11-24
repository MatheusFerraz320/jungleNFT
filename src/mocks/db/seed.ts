export function seedMockDatabase() {
  // Fixtures are seeded by MockDatabase.reset(). This explicit function gives
  // development tools and tests a stable entry point for scenario resets.
  return {
    users: 2,
    nfts: 24,
    wallets: 2,
    coupons: 2,
  } as const;
}
