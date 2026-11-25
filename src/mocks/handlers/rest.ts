import { accountHandlers } from './account';
import { authHandlers } from './auth';
import { cartHandlers } from './cart';
import { favoriteHandlers } from './favorites';
import { healthHandler } from './health';
import { mockControlHandlers } from './mock-control';
import { nftHandlers } from './nfts';
import { orderHandlers } from './orders';
import { quoteHandlers } from './quotes';

export const restHandlers = [
  healthHandler,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...accountHandlers,
  ...mockControlHandlers,
];
