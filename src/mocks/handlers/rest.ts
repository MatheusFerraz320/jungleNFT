import { healthHandler } from './health';
import { mockControlHandlers } from './mock-control';
import { nftHandlers } from './nfts';

export const restHandlers = [healthHandler, ...nftHandlers, ...mockControlHandlers];
