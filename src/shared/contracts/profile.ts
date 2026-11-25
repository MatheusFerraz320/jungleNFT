import { z } from 'zod';

export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.email(),
  avatarUrl: z.string().min(1).optional(),
  username: z.string().trim().min(3).max(40).optional(),
  ensName: z.string().trim().max(60).optional(),
  walletNickname: z.string().trim().min(2).max(40).optional(),
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
