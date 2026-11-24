export const couponFixtures = [
  {
    code: 'JUNGLE10',
    percentage: 10,
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'EXPIRED10',
    percentage: 10,
    expiresAt: '2025-12-31T23:59:59.000Z',
  },
] as const;
