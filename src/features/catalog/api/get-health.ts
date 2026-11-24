import { http } from '@/shared/api/http';
import { HealthResponseSchema, type HealthResponse } from '@/shared/contracts';

export async function getHealth(): Promise<HealthResponse> {
  const response = await http.get<unknown>('/health');
  return HealthResponseSchema.parse(response.data);
}
