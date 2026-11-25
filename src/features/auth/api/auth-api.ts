import { http } from '@/shared/api/http';
import {
  AuthResponseSchema,
  SessionSchema,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
  type Session,
} from '@/shared/contracts';

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const response = await http.post('/auth/login', body);
  return AuthResponseSchema.parse(response.data);
}

export async function register(body: RegisterRequest): Promise<AuthResponse> {
  const response = await http.post('/auth/register', body);
  return AuthResponseSchema.parse(response.data);
}

export async function getSession(signal?: AbortSignal): Promise<Session> {
  const response = await http.get('/auth/session', { signal });
  return SessionSchema.parse(response.data);
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
}
