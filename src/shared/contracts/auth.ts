import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  avatarUrl: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const SessionSchema = z.object({
  user: UserSchema,
  expiresAt: z.iso.datetime(),
});

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const RegisterRequestSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
