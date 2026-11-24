import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { getHealth } from '../api/get-health';

export const healthQueryOptions = queryOptions({
  queryKey: queryKeys.health,
  queryFn: getHealth,
});
