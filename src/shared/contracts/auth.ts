import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  avatarUrl: z.string().min(1),
  username: z.string().max(40).optional(),
  ensName: z.string().max(60).optional(),
  walletNickname: z.string().max(40).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const SessionSchema = z.object({
  user: UserSchema,
  expiresAt: z.iso.datetime(),
});

/** Sessão opaca devolvida no login/cadastro; enviada como `Authorization: Bearer`. */
export const AuthResponseSchema = SessionSchema.extend({
  token: z.string().min(1),
});

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  /** Carrinho de visitante a ser mesclado ao carrinho da conta. */
  guestId: z.string().min(1).optional(),
});

export const RegisterRequestSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.email(),
  password: z.string().min(8).max(128),
  guestId: z.string().min(1).optional(),
});

export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
