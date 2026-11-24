import { setupServer } from 'msw/node';
import { restHandlers } from './handlers/rest';

export const server = setupServer(...restHandlers);
