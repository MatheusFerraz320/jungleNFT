import { healthHandler } from './health';
import { mockControlHandlers } from './mock-control';

export const restHandlers = [healthHandler, ...mockControlHandlers];
