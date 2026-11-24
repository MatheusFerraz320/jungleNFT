import type { User } from '@/shared/contracts';
import { UserSchema } from '@/shared/contracts';

const timestamp = '2026-01-01T00:00:00.000Z';

export const userFixtures: User[] = [
  UserSchema.parse({
    id: 'user-ana',
    name: 'Ana Souza',
    email: 'ana@jungle.test',
    avatarUrl: '/assets/avatar-placeholder.svg',
    createdAt: timestamp,
    updatedAt: timestamp,
  }),
  UserSchema.parse({
    id: 'user-bruno',
    name: 'Bruno Lima',
    email: 'bruno@jungle.test',
    avatarUrl: '/assets/avatar-placeholder.svg',
    createdAt: timestamp,
    updatedAt: timestamp,
  }),
];
