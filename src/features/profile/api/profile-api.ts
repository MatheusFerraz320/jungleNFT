import { z } from 'zod';
import { http } from '@/shared/api/http';
import {
  UserSchema,
  type ChangePasswordRequest,
  type UpdateProfileRequest,
  type User,
} from '@/shared/contracts';

const ProfileResponseSchema = z.object({ user: UserSchema });

export async function getProfile(signal?: AbortSignal): Promise<User> {
  const response = await http.get('/profile', { signal });
  return ProfileResponseSchema.parse(response.data).user;
}

export async function updateProfile(body: UpdateProfileRequest): Promise<User> {
  const response = await http.patch('/profile', body);
  return ProfileResponseSchema.parse(response.data).user;
}

export async function changePassword(body: ChangePasswordRequest): Promise<void> {
  await http.post('/profile/password', body);
}
