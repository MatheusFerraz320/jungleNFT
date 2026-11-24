import { restHandlers } from './rest';
import { socketHandler } from './socket';

export const handlers = [...restHandlers, socketHandler];
